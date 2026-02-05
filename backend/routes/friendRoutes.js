import express from "express";
import { verifyToken } from "../middlewares/jwtMiddleware.js";
import { userDB } from "../models/userModel.js";

const router = express.Router();

/**
 * Send Friend Request
 */
router.post("/request/:userId", verifyToken, async (req, res) => {
    try {
        const senderId = req.user.userId;
        const receiverId = req.params.userId;

        if (senderId === receiverId) {
            return res.status(400).json({ message: "You cannot send a request to yourself" });
        }

        const sender = await userDB.findById(senderId);
        const receiver = await userDB.findById(receiverId);

        if (!receiver || !sender) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already friends
        if (sender.friends.includes(receiverId) || receiver.friends.includes(senderId)) {
            return res.status(400).json({ message: "User is already your friend" });
        }

        // Check if sender already sent a pending request
        const alreadySent = receiver.friendRequests.some(
            (r) => r.from.toString() === senderId && r.status === "pending"
        );
        if (alreadySent) {
            return res.status(400).json({ message: "Friend request already sent" });
        }

        // Check if receiver already sent a request (reverse)
        const reverseRequest = sender.friendRequests.find(
            (r) => r.from.toString() === receiverId && r.status === "pending"
        );
        if (reverseRequest) {
            return res.status(400).json({ message: "User has already sent you a request" });
        }

        // Add request to receiver
        receiver.friendRequests.push({ from: senderId });

        // Track outgoing request in sender (optional but useful)
        if (!sender.sentRequests) sender.sentRequests = [];
        const alreadyInSent = sender.sentRequests.some(
            (id) => id.toString() === receiverId
        );
        if (!alreadyInSent) sender.sentRequests.push({to:receiverId});

        await receiver.save();
        await sender.save();

        res.status(200).json({ message: "Friend request sent successfully" });
    } catch (err) {
        console.error("Error in /friends/request:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});


/**
 * Cancel Sent Friend Request
 */
router.delete("/cancel/:userId", verifyToken, async (req, res) => {
    try {
        const senderId = req.user.userId;
        const receiverId = req.params.userId;

        const receiver = await userDB.findById(receiverId);
        if (!receiver) return res.status(404).json({ message: "User not found" });

        receiver.friendRequests = receiver.friendRequests.filter(r => !(r.from.toString() === senderId && r.status === "pending"));
        await receiver.save();

        res.status(200).json({ message: "Friend request canceled" });
    } catch (err) {
        console.error("Error in /cancel:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * Accept Friend Request
 */
router.post("/accept/:requestId", verifyToken, async (req, res) => {
    try {
        const user = await userDB.findById(req.user.userId);

        // Find the pending request in user's friendRequests list
        const request = user.friendRequests.find(
            r => r._id.toString() === req.params.requestId && r.status === "pending"
        );

        if (!request) {
            return res.status(404).json({ message: "Request not found or not pending" });
        }

        const senderId = request.from; // The one who sent the request

        //  Add each other as friends (avoid duplicates with $addToSet)
        await userDB.findByIdAndUpdate(user._id, { $addToSet: { friends: senderId } });
        await userDB.findByIdAndUpdate(senderId, { $addToSet: { friends: user._id } });

        //  Remove from receiver's request list
        user.friendRequests = user.friendRequests.filter(r => r._id.toString() !== req.params.requestId);
        await user.save();

        //  Remove from sender's sentRequests list
        await userDB.findByIdAndUpdate(senderId, {
            $pull: { sentRequests: { to: user._id } }
        });
        

        res.status(200).json({ message: "Friend request accepted" });

    } catch (err) {
        console.error("Error in /accept:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});


/**
 * Reject Friend Request
 */
router.post("/reject/:requestId", verifyToken, async (req, res) => {
    try {
        const user = await userDB.findById(req.user.userId);

        const request = user.friendRequests.find(
            r => r._id.toString() === req.params.requestId && r.status === "pending"
        );

        if (!request) {
            return res.status(404).json({ message: "Request not found or not pending" });
        }

        const senderId = request.from;

        // Remove from receiver's incoming requests
        user.friendRequests = user.friendRequests.filter(r => r._id.toString() !== req.params.requestId);
        await user.save();

        //  Remove from sender's sentRequests as well
        await userDB.findByIdAndUpdate(senderId, {
            $pull: { sentRequests: { to: user._id } }
        });

        res.status(200).json({ message: "Friend request rejected and removed" });

    } catch (err) {
        console.error("Error in /reject:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * Get Pending Friend Requests
 */
router.get("/requests", verifyToken, async (req, res) => {
    try {
        const user = await userDB.findById(req.user.userId).populate("friendRequests.from", "username email profileImage");
        const pending = user.friendRequests.filter(r => r.status === "pending");

        res.status(200).json(pending);
    } catch (err) {
        console.error("Error in /requests:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * Get Friend List
 */
router.get("/list", verifyToken, async (req, res) => {
    try {
        const user = await userDB.findById(req.user.userId).populate("friends", "username email profileImage");
        res.status(200).json(user.friends);
    } catch (err) {
        console.error("Error in /list:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * Search Users with Pagination + Status
 */
router.get("/search", verifyToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { q, page = 1, limit = 10 } = req.query;

        let filter = { _id: { $ne: currentUserId } };

        if (q) {
            filter.$or = [
                { username: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } }
            ];
        }

        const users = await userDB.find(filter)
            .skip((page - 1) * Number(limit))
            .limit(Number(limit))
            .select("username email profileImage friends friendRequests");

        const total = await userDB.countDocuments(filter);

        const formattedUsers = users.map(u => {
            let status = "none";
            if (u.friends.some(id => id.toString() === currentUserId)) {
                status = "friends";
            } else if (u.friendRequests.some(r => r.from.toString() === currentUserId && r.status === "pending")) {
                status = "request_sent";
            } else if (u.friendRequests.some(r => r.from.toString() === currentUserId && r.status === "pending")) {
                status = "request_received"; // ✅ Fixed reverse logic
            }

            return {
                userId: u._id,
                username: u.username,
                email: u.email,
                profileImage: u.profileImage,
                status
            };
        });

        res.status(200).json({
            page: Number(page),
            limit: Number(limit),
            total,
            results: formattedUsers
        });

    } catch (err) {
        console.error("Error in /search:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * Unfriend a user
 */
router.delete("/unfriend/:userId", verifyToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const otherUserId = req.params.userId;

        if (currentUserId === otherUserId) {
            return res.status(400).json({ message: "You cannot unfriend yourself" });
        }

        const user = await userDB.findById(currentUserId);
        const otherUser = await userDB.findById(otherUserId);

        if (!otherUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.friends.includes(otherUserId)) {
            return res.status(400).json({ message: "You are not friends with this user" });
        }

        user.friends = user.friends.filter(id => id.toString() !== otherUserId);
        otherUser.friends = otherUser.friends.filter(id => id.toString() !== currentUserId);

        await user.save();
        await otherUser.save();

        res.status(200).json({ message: "Unfriended successfully" });
    } catch (err) {
        console.error("Error in /unfriend:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
