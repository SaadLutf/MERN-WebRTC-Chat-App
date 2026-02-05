import mongoose from "mongoose";


const messageSchema = mongoose.Schema({
  content: {
    type: String,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  media: { type: String },
  type: {
    type: String,
    enum: ["text", "image", "video", "audio", "file"],
    default: "text"
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
},
  {
    timestamps: true
  })

export const messageDB = mongoose.model("Message", messageSchema)