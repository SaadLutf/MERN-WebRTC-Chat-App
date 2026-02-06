// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "./socket";
import { Toaster } from "react-hot-toast";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import Main from "./pages/Main";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/guestRoute";
import { Navigate } from "react-router-dom";
import {
  addMessage,
  prependRecent,
  setTypingStatus,
  incrementUnread,
  updateMessageStatus,
  updateMessage
} from "./redux/messagesSlice";
import { setOnlineUsers, addOnlineUser, removeOnlineUser } from "./redux/onlineStatusSlice";

import { getRecentConversations } from "./services/MessagesApi";
import { getUserById } from "./services/UserApi";
import { setUser } from "./redux/userSlice";

import { initializeWebRTC } from "./services/webRTCservice";
import IncomingCallModal from "./components/IncomingCallModal";
import CallView from "./components/CallView";

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux State
  const recent = useSelector((state) => state.messages.recent || []);
  const selectedChat = useSelector((state) => state.selectedChat.chat); // ✅ Need this to check active chat
  const { inCall } = useSelector((state) => state.call);

  const [myId, setMyId] = useState(null);

  // ✅ Ref to track selectedChat inside socket listeners (prevents stale closures)
  const selectedChatRef = useRef(selectedChat);

  // Keep ref in sync with state
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // --- 1. WebRTC Init ---
  useEffect(() => {
    if (socket && socket.connected) {
      initializeWebRTC();
      console.log("WebRTC initialized");
    }
  }, [socket.connected, myId]);

  // --- 2. Auth & Token Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMyId(null);
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setMyId(decoded.userId);
      console.log("it worked")
    } catch (err) {
      console.warn("Invalid token");
      setMyId(null);
    }
  }, [location.pathname]); // 🔥 reruns after login navigation


  // --- 3. Fetch User Info ---
  useEffect(() => {
    if (!myId) return;
    const fetchUser = async () => {
      try {
        const res = await getUserById(myId);
        dispatch(setUser(res.data));
      } catch (err) {
        console.error("Failed to load user info", err);
      }
    };
    fetchUser();
  }, [dispatch, myId]);

  // --- 4. Connect Socket ---
  useEffect(() => {
    if (!myId) return;

    // 1. If not connected, connect.
    if (!socket.connected) {
      socket.connect();
    }

    // 2. ALWAYS emit "userOnline" whenever this component mounts or myId changes
    // This fixes the issue where the server map stays empty
    console.log("[CLIENT] 📤 Registering with server as:", myId);
    socket.emit("userOnline", myId);

    // 3. Handle automatic reconnections (e.g. server restart or wifi drop)
    const handleConnect = () => {
      console.log("[CLIENT] 🔄 Reconnected. Re-registering:", myId);
      socket.emit("userOnline", myId);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [myId]);

  // --- 5. Fetch Recent Chats ---


  // --- 6. GLOBAL SOCKET LISTENERS ---
  useEffect(() => {
    if (!myId) return;

    // A. Handle Incoming Messages
    const handleReceive = async (msg) => {
      const senderId = msg.sender._id;
      console.log("sender id: ", senderId)
      console.log('my id: ', myId)
      console.log("Check:", String(senderId) === String(myId));

      if (String(senderId) === String(myId)) return;
      // 1. Add message to store

      dispatch(addMessage({ msg }));

      // 2. Check if user is currently looking at this chat
      const currentChatId = selectedChatRef.current?.id;

      if (currentChatId === msg.conversation) {
        // ✅ User is IN the chat: Mark as read immediately on server
        socket.emit("markMessagesRead", {
          conversationId: msg.conversation,
          byUserId: myId,
          messageIds: [msg._id]
        });
      } else {
        // ✅ User is OUT of the chat: Increment unread count badge
        dispatch(incrementUnread(msg.conversation));
      }
    };

    // B. Handle Typing
    const handleTyping = ({ from, conversation }) => {
      dispatch(setTypingStatus({ from, conversation, isTyping: true }));
    };
    const handleStopTyping = ({ from, conversation }) => {
      dispatch(setTypingStatus({ from, conversation, isTyping: false }));
    };

    // C. Handle New Group Creation
    const handleAddedToGroup = (newConversation) => {
      dispatch(prependRecent(newConversation));
    };

    // D. ✅ NEW: Handle "Messages Read" (Blue Ticks)
    // This fires when the OTHER person reads YOUR message
    const handleMessagesRead = ({ conversationId, messageIds }) => {
      dispatch(updateMessageStatus({
        conversationId,
        status: "read",
        messageIds,
        myId // Used in reducer to only update messages sent by ME
      }));
    };

    // listen for online users list
    const handleOnlineUsers = (userIds) => {
      console.log("📡 Online users updated:", userIds);
      dispatch(setOnlineUsers(userIds));
    };

    //  Listen for user coming online
    const handleUserOnline = ({ userId }) => {
      console.log("🟢 User came online:", userId);
      dispatch(addOnlineUser(userId));
    };

    //  Listen for user going offline
    const handleUserOffline = ({ userId }) => {
      console.log("🔴 User went offline:", userId);
      dispatch(removeOnlineUser(userId));
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("addedToGroup", handleAddedToGroup);
    socket.on("messagesRead", handleMessagesRead); // Attach new listener
    socket.on("messageUpdate", (updatedMsg) => {
      dispatch(updateMessage(updatedMsg));
    });
    socket.on("onlineUsersList", handleOnlineUsers);
    socket.on("userConnected", handleUserOnline);
    socket.on("userDisconnected", handleUserOffline);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("addedToGroup", handleAddedToGroup);
      socket.off("messagesRead", handleMessagesRead); // Detach
      socket.off("onlineUsersList", handleOnlineUsers);
      socket.off("userConnected", handleUserOnline);
      socket.off("userDisconnected", handleUserOffline);
    };
  }, [dispatch, myId]); // Removed `selectedChat` from dependency to prevent re-binding

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <IncomingCallModal />
      {inCall && <CallView />}
      <Routes>
        <Route element={<ProtectedRoute />} >
          <Route path="/chat" element={<Main />} />
        </Route>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignupPage />} />
        </Route>
        <Route
          path="/"
          element={myId ? <Navigate to="/chat" /> : <Navigate to="/login" />}
        />
      </Routes>
    </>
  );
};

export default App;