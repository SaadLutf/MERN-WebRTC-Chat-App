import { messageDB } from "../models/messageModel.js";
import { conversationDB } from "../models/conversationModel.js";
export const onlineUsers = new Map();

export const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("user connected", socket.id);
        // user comes online
        socket.on("userOnline", async (userId) => {
            onlineUsers.set(userId, socket.id);
            socket.userId = userId
            console.log("Online users: ", Array.from(onlineUsers.keys()));

            // Broadcast to all clients that this user came online
            socket.broadcast.emit("userConnected", { userId });

            // Send current online users list to the newly connected user
            socket.emit("onlineUsersList", Array.from(onlineUsers.keys()));
            // Join all conversation Rooms

            try {
                const conversations = await conversationDB.find({ participants: userId })
                conversations.forEach(convo => {
                    socket.join(convo._id.toString());
                })

                console.log(`Socket ${socket.id} joined ${conversations.length} rooms`);
            } catch (error) {
                console.log("Error joining conversation rooms", error);
            }


        });

        // typing indicator

        socket.on("typing", ({ to: conversationId }) => {
            // Broadcast to everyone in the room *except* the sender
            socket.to(conversationId).emit("typing", {
                from: socket.userId,
                conversation: conversationId, // Send conversationId
            });
        });

        // typing indicator stopped

        socket.on("stopTyping", ({ to: conversationId }) => {
            socket.to(conversationId).emit("stopTyping", {
                from: socket.userId,
                conversation: conversationId,
            });
        });

        socket.on("markMessagesRead", async ({ conversationId, messageIds, byUserId }) => {
            try {
                // If messageIds are provided, only update those
                // If not, update ALL (fallback)
                const query = {
                    conversation: conversationId,
                    sender: { $ne: byUserId },
                    status: { $ne: "read" }
                };

                if (messageIds && messageIds.length > 0) {
                    query._id = { $in: messageIds };
                }

                await messageDB.updateMany(query, { $set: { status: "read" } });

                // Broadcast to sender that specific messages were read
                io.to(conversationId).emit("messagesRead", {
                    conversationId,
                    messageIds // Send back which ones were read
                });

            } catch (error) {
                console.error("Error marking read:", error);
            }
        });

        //webrtc signal handling

        //caller sends offer to callee

        socket.on('call-user', ({ to, offer, isAudioOnly, fromName }) => {
            console.log(`[SERVER] 📞 Call initiated by ${socket.userId} -> to ${to}`);
            const receiverSocket = onlineUsers.get(to);
            if (receiverSocket) {
                console.log(`[SERVER] ✅ Receiver found (Socket ID: ${receiverSocket}). Forwarding offer...`);
                io.to(receiverSocket).emit('incoming-call', {
                    from: socket.userId,
                    offer,
                    isAudioOnly,
                    fromName,
                })
            }
            else {
                console.log(`[SERVER] ❌ Receiver ${to} is NOT in onlineUsers map.`);

            }
        });

        // on call accepted

        socket.on('call-accepted', ({ to, answer }) => {
            console.log(`[SERVER] 🟢 Call accepted by ${socket.userId} -> sending answer to ${to}`);
            const receiverSocket = onlineUsers.get(to);
            if (receiverSocket) {
                io.to(receiverSocket).emit("call-accepted", {
                    from: socket.userId,
                    answer
                })
            }
        })


        //reject call

        socket.on('call-rejected', ({ to, reason }) => {
            const receiverSocket = onlineUsers.get(to);
            if (receiverSocket) {
                io.to(receiverSocket).emit('call-rejected', {
                    from: socket.userId,
                    reason
                })

            }
        });

        // exchange ice canditate

        socket.on('ice-candidate', ({ to, candidate }) => {
            console.log(`[SERVER] ❄️ ICE Candidate exchanged from ${socket.userId} to ${to}`);
            const receiverSocket = onlineUsers.get(to);
            if (receiverSocket) {
                io.to(receiverSocket).emit("ice-candidate", {
                    from: socket.userId,
                    candidate,
                });
            }
        })
        // Handle hang up
        socket.on("hang-up", ({ to }) => {
            const receiverSocket = onlineUsers.get(to);
            if (receiverSocket) {
                io.to(receiverSocket).emit("hang-up", {
                    from: socket.userId,
                });
            }
        });


        // handle disconnect
        socket.on("disconnect", () => {
            let disconnectedUserId=null;
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                }
            }
            if (disconnectedUserId) {
                io.emit("userDisconnected", { userId: disconnectedUserId });
                console.log("user disconnected: ", socket.id, "userId:", disconnectedUserId);
            }

            console.log("user disconnected: ", socket.id)
        });
    });
}