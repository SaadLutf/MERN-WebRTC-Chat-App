import express from "express";
import { userDB } from "../models/userModel.js";
import { verifyToken } from "../middlewares/jwtMiddleware.js";
import { upload } from "../middlewares/multer.js";
import fs from "fs";
import path from "path";
const router = express.Router();

//  Get user by ID
router.get("/:id",verifyToken, async (req, res) => {
  try {
    const user = await userDB.findById(req.params.id).select("-password"); // exclude password
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// edit profile 

router.put("/update-info", verifyToken, async (req, res) => {
  try {
    const { username, email, location } = req.body;

    // ✅Build update object only with provided fields
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (location) updateData.location = location;

    const updatedUser = await userDB.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },  // Only updates sent fields
      { new: true }
    );

    res.json({ success: true, message: "Profile updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
});

// update profile image


router.put("/update-profile-image",verifyToken,upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const user = await userDB.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    //  Get old image path
    const oldImage = `/uploads/${user.profileImage}`; // e.g. "/uploads/abc123.jpg"

    //  Set new image path
    const newImagePath =req.file.filename;

    // Update db
    user.profileImage = newImagePath;
    await user.save();

    // Delete old image if exists and not a default image
    if (oldImage && oldImage !== "/uploads/default.jpg") {
      const fullPath = path.join(process.cwd(), oldImage); // Absolute path
      fs.unlink(fullPath, (err) => {
        if (err) console.error("Error deleting old image:", err);
        else console.log("Old image deleted:", fullPath);
      });
    }

    res.json({ success: true, message: "Profile picture updated",newImagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating image" });
  }
});




export default router;
