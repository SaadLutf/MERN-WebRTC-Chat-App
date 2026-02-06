import express from "express";
import { verifyToken } from "../middlewares/jwtMiddleware.js";
import { upload } from "../middlewares/multer.js";
import { conversationDB } from "../models/conversationModel.js"; 
import { onlineUsers } from "../utils/socketHandler.js"; 
import { CONNREFUSED } from "dns";
import { messageDB } from "../models/messageModel.js";
import { decryptMessage } from "../utils/encryption.js";

import fs from "fs";
import path from "path";
const router = express.Router();

// --- FORMATTER HELPER ---
const formatConversation = (convo, myId) => {
  if (convo.type === "group") {
    let img = convo.groupIcon;
   
    return {
      _id: convo._id,
      type: "group",
      chatName: convo.groupName, 
      chatImage: img || "https://placehold.co/100x100/7F22FE/FFF?text=G",
      lastMessage: convo.lastMessage,
      updatedAt: convo.updatedAt,
      participants: convo.participants,
    };
  }

  const otherUser = convo.participants.find(
    (p) => p._id.toString() !== myId.toString()
  );

  const username = otherUser ? otherUser.username : "Unknown User";
  let profileImg = otherUser ? otherUser.profileImage : null;
  
  return {
    _id: convo._id,
    type: "private",
    chatName: username,
    chatImage: profileImg || "https://placehold.co/100x100/E6EBF5/000?text=U",
    lastMessage: convo.lastMessage,
    updatedAt: convo.updatedAt,
    otherUserId: otherUser ? otherUser._id : null,
    participants: convo.participants, 
  };
};

// --- GET RECENT ---
router.get("/recent", verifyToken, async (req, res) => {
  try {
    const myId = req.user.userId;
    const conversations = await conversationDB.find({ participants: myId })
    .populate("lastMessage")
    .populate({ path: "participants", select: "username profileImage location" })
    .sort({ updatedAt: -1 })
    .lean();

    // calculate unread messages for each conversation 

   const  conversationsWithUnread=await Promise.all(
      conversations.map(async(convo)=>{

        //decrypt the last message (if exists)

        if(convo.lastMessage && convo.lastMessage.content)
        {
          convo.lastMessage.content=decryptMessage(convo.lastMessage.content);
        }

        const formatted=formatConversation(convo,myId);

        const unreadMessages=await messageDB.countDocuments({
          conversation:convo._id,
          sender:{$ne:myId},
          status:{$ne:"read"}
        });
        return {...formatted,unreadMessages}
      })
    )
    
    res.status(200).json(conversationsWithUnread);
  } catch (err) {
    console.error("Fetch recent conversations error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// create group

router.post("/create-group", verifyToken, upload.single("groupIcon"), async (req, res) => {
    try {
      const { groupName, memberIds } = req.body;
      const creatorId = req.user.userId;
      const members = Array.isArray(memberIds) ? memberIds : [memberIds];
      const participants = [creatorId, ...members];

      const newConversation = new conversationDB({
        type: "group",
        groupName: groupName,
        participants: participants,
        admins: [creatorId],
        groupIcon: req.file ? req.file.filename : null,
      });

      const savedConversation = await newConversation.save();

      const io = req.io;
      members.forEach(memberId => {
        const receiverSocket = onlineUsers.get(memberId);
        if (receiverSocket) {
          const socketInstance = io.sockets.sockets.get(receiverSocket);
          if (socketInstance) socketInstance.join(savedConversation._id.toString());
          io.to(receiverSocket).emit("addedToGroup", savedConversation);
        }
      });

     
      const populatedConversation = await savedConversation.populate({
        path: "participants",
        select: "username profileImage location", 
      });

     
      const response = formatConversation(populatedConversation, creatorId);
      
      res.status(201).json(response);
    } catch (error) {
      console.error("Create group error:", error); // Check your terminal for this log!
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// initiate conversation
router.post("/initiate-private", verifyToken, async (req, res) => {
  try {
    const myId = req.user.userId;
    const { participantId } = req.body;

    if (!participantId) return res.status(400).json({ message: "Participant ID is required" });

    const existingConversation = await conversationDB.findOne({
      type: "private",
      participants: { $all: [myId, participantId] },
    })
    .populate("lastMessage")
    .populate("participants", "username profileImage");

    if (existingConversation) {
      const response = formatConversation(existingConversation, myId);
      return res.status(200).json(response);
    }

    const newConversation = new conversationDB({
      type: "private",
      participants: [myId, participantId],
    });

    const savedConversation = await newConversation.save();

    const io = req.io;
    const receiverSocket = onlineUsers.get(participantId);
    if (receiverSocket) {
      const socketInstance = io.sockets.sockets.get(receiverSocket);
      if (socketInstance) socketInstance.join(savedConversation._id.toString());
    }

   
    const populatedConversation = await savedConversation.populate({
        path: "participants",
        select: "username profileImage",
    });

    
    const response = formatConversation(populatedConversation, myId);

    res.status(201).json(response);

  } catch (error) {
    console.error("Initiate private chat error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// leave a group

router.put("/leave-group", verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.userId;

    const conversation = await conversationDB.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "This is not a group chat" });
    }

    // Check if user is actually in the group
    if (!conversation.participants.includes(userId)) {
      return res.status(400).json({ message: "You are not a participant of this group" });
    }

    // Remove user from participants
    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== userId
    );

 
    if (conversation.admins && conversation.admins.includes(userId)) {
      conversation.admins = conversation.admins.filter(
        (id) => id.toString() !== userId
      );
    }

    
    
    await conversation.save();

    // Notify other group members that this user left
    req.io.to(conversationId).emit("userLeftGroup", { 
        conversationId, 
        userId,
        message: "A user has left the group"
    });

    res.status(200).json({ message: "Left group successfully", conversationId });

  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// --- UPDATE GROUP ICON ---
router.put("/update-group-icon", verifyToken, upload.single("groupIcon"), async (req, res) => {
  try {
    const { conversationId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const conversation = await conversationDB.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verify it is a group
    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Cannot change icon for private chats here" });
    }

    
    
    // Delete old image if it exists
    const oldImage = conversation.groupIcon;
    if (oldImage) {
       const oldPath = path.join(process.cwd(), 'uploads', oldImage);
       fs.unlink(oldPath, (err) => {
          if (err) console.error("Failed to delete old group icon:", err);
       });
    }

    // Update DB
    conversation.groupIcon = req.file.filename;
    await conversation.save();

    const newImageUrl = conversation.groupIcon;

    // Notify everyone in the group about the new icon
    req.io.to(conversationId).emit("groupIconUpdated", { 
        conversationId, 
        groupIcon: newImageUrl 
    });

    res.status(200).json({ message: "Group icon updated", groupIcon: newImageUrl });

  } catch (error) {
    console.error("Update group icon error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;