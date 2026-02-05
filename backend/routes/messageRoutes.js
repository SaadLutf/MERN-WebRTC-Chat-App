import express from "express";
import { verifyToken } from "../middlewares/jwtMiddleware.js";
import { messageDB } from "../models/messageModel.js";

import { conversationDB } from "../models/conversationModel.js";
import { upload } from "../middlewares/multer.js";
import { encryptMessage, decryptMessage } from "../utils/encryption.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
const router = express.Router();

// send message

router.post("/send", verifyToken, upload.single("media"), async (req, res) => {
    try {
        const io = req.io; //  Access attached Socket.IO instance

        const { content, conversationId } = req.body;
        const media = req.file ? req.file.filename : null;
        const sender = req.user.userId; 

        let msgType = "text";
        if (media && req.file) {
            const mime = req.file.mimetype; // e.g., "image/png"
            if (mime.startsWith("image/")) msgType = "image";
            else if (mime.startsWith("video/")) msgType = "video";
            else if (mime.startsWith("audio/")) msgType = "audio";
            else msgType = "file";
        }
        let encryptContent = encryptMessage(content);
        let newMessage = await messageDB.create({
            sender,
            conversation: conversationId,
            content: encryptContent,
            media,
            type: msgType //  Save the calculated type
        });
        newMessage = await newMessage.populate("sender", "username profileImage email");
        // update last message

        await conversationDB.findByIdAndUpdate(conversationId, { lastMessage: newMessage })

        newMessage.content = content
        //emit to room
        io.to(conversationId).emit("receiveMessage", newMessage);


        res.json({ newMessage });
    } catch (error) {
        console.error("Message send error:", error);
        console.log("Received Data:", req.body);

        res.status(500).json({ message: "Internal server error" });
    }
});




// get conversations by conversationId

router.get("/:conversationId", verifyToken, async (req, res) => {
    try {
        const { conversationId } = req.params;

        const messages = await messageDB.find({
            conversation: conversationId
        }).sort({ createdAt: 1 })
            .populate("sender", "email username profileImage")
            .lean();

        const decryptMessages = messages.map((msg) => {
            return {
                ...msg,
                content: decryptMessage(msg.content)
            }


        })
        console.log("here are the decrypted messages: ", decryptMessages)
        res.status(200).json(decryptMessages);
    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
})

// update single message status

router.put('/:messageId/status', verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { status } = req.body;
        if (!["delivered", "read"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }
        const updateMessage = await messageDB.findByIdAndUpdate(messageId, { status }, { new: true });
        if (!updateMessage) {
            return res.status(404).json({ message: "Message not found" });
        }
        return res.status(200).json({ message: "Status updated", updateMessage });
    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).json({ message: "Internal server error" })
    }
});

// mark all messages as read

router.put('/conversations/:userId/read', verifyToken, async (req, res) => {
    try {
        const userId1 = req.user.userId;
        const userId2 = req.params.userId;
        const result = await messageDB.updateMany(
            { sender: userId2, receiver: userId1, status: { $ne: "read" } },
            { $set: { status: "read" } }
        )
        return res.status(200).json({ message: "Messages marked as read", result });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

// delete a message "soft delete"

router.put('/delete-for-everyone/:messageId', verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.userId;

        const message = await messageDB.findById(messageId);
        if (!message) return res.status(404).json({ message: "Not found" });

        if (message.sender.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // File Deletion Logic 
        // Check if there is media and if the type is NOT text (meaning a file exists)
        if (message.media && message.type !== "text") {
            
            
           
            const filePath = path.join(process.cwd(), 'uploads', message.media);

            // Delete the file from storage
            fs.unlink(filePath, (err) => {
                if (err) {
                    // We log the error but don't stop the process so the DB still updates
                    console.error("Error deleting message file from disk:", err);
                } else {
                    console.log("File deleted successfully:", filePath);
                }
            });
        }
        // --------------------------------

        // Proceed with Soft Delete in Database
        message.content = "This message was deleted";
        message.media = null; // Clear the reference to the file
        message.type = "text"; // Reset type to text so the frontend renders it as a text bubble
        message.isDeleted = true;
        
        const deletedMsg = await message.save();

        // Broadcast the update to users inside the room
        req.io.to(message.conversation.toString()).emit("messageUpdate", deletedMsg);
        
        res.status(200).json(deletedMsg);

    } catch (error) {
        console.error(error); // Good practice to log the actual error for debugging
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;