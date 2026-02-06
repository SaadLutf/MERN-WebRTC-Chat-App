// models/conversationModel.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  
  // 'type' will distinguish 1-on-1 from group
  type: {
    type: String,
    enum: ["private", "group"],
    default: "private",
  },
  
  // --- Group-Only Fields ---
  groupName: {
    type: String,
    trim: true,
  },
  groupIcon: {
    type: String, // Path to an uploaded image
  },
  admins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  
  // --- For your "Recent" list ---
  
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
}, {
  // 'updatedAt' will be used to sort our recent chats
  timestamps: true 
});

export const conversationDB = mongoose.model("Conversation", conversationSchema);