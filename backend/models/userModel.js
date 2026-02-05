// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  profileImage: String,
  location:String,
  friends: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],
  friendRequests: [
    {
      from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
      }
    }
  ],
  sentRequests: [
    {
      to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
      }
    }
  ]
}, {
  timestamps: true
});

export const userDB = mongoose.model("User", userSchema);
