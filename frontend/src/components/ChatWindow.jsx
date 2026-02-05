import React, { useState, useEffect, useRef } from "react";
import { 
  Phone, Video, MoreVertical, Send, Smile, Paperclip, 
  User, Check, CheckCheck, ArrowLeft, Trash, LogOut, Camera 
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { clearSelectedChat } from "../redux/selectedChatSlice";

// --- SERVICES & REDUX ---
import { 
  sendMessage, 
  getConversation, 
  deleteForEveryOne, 

} from "../services/MessagesApi";
 
import { leaveGroup,updateGroupIcon } from "../services/conversationsApi";

import { 
  addMessage, 
  setConversationMessages, 
  markConversationAsRead 
} from "../redux/messagesSlice";

import { initiateCall } from "../services/webRTCservice";
import { socket } from "../socket";

// --- COMPONENTS ---
import AudioMessage from "../components/AudioMessage";
import TypingIndicator from "./TypingIndicator";

const SERVER_URL = import.meta.env.VITE_SERVER_URL + "/uploads/";

// --- SUB-COMPONENT: Message Status Ticks ---
const MessageStatus = ({ status, isMe }) => {
  if (!isMe) return null;
  if (status === "read") return <CheckCheck size={14} className="text-blue-400" />;
  if (status === "delivered") return <CheckCheck size={14} className="text-gray-400" />;
  return <Check size={14} className="text-gray-400" />;
};

const ChatWindow = () => {
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [tempMessages, setTempMessages] = useState([]);
  
  // --- NEW: Dropdown State ---
  const [showDropdown, setShowDropdown] = useState(false);

  // Refs
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const observer = useRef(null);
  const groupIconInputRef = useRef(null); // --- NEW: Ref for file input ---

  const dispatch = useDispatch();

  // Redux State
  const selectedChat = useSelector((state) => state.selectedChat.chat);
  const messagesById = useSelector((state) => state.messages.byId);
  const typingStatus = useSelector((state) => state.messages.typingStatus || {});
  const currentUser = useSelector((state) => state.user.currentUser);


  //test

  useEffect(()=>{
    console.log("Selected Chat: ",selectedChat)
  },[selectedChat])
  // --- HELPERS ---
  const getMyId = () => {
    if (currentUser?._id) return currentUser._id;
    const token = localStorage.getItem("token");
    if (token) {
      try { return JSON.parse(atob(token.split(".")[1])).userId; } catch (e) { return null; }
    }
    return null;
  };
  const loggedInUserId = getMyId();

  const getOtherUserId = () => {
    if (!selectedChat || selectedChat.type === 'group') return null;
    if (selectedChat.otherUserId) return selectedChat.otherUserId;
    if (selectedChat.participants && selectedChat.participants.length > 0) {
      const otherParticipant = selectedChat.participants.find(
        p => String(p._id || p) !== String(loggedInUserId)
      );
      return otherParticipant?._id || otherParticipant;
    }
    return null;
  };

  const messages = selectedChat ? (messagesById[selectedChat.id] || []) : [];
  const allMessages = [...messages, ...tempMessages];

  const firstUnreadIndex = allMessages.findIndex(
    (m) => m.sender?._id !== loggedInUserId && m.sender !== loggedInUserId && m.status !== "read"
  );

  // --- EFFECT: Handle Click Outside Dropdown ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest(".dropdown-container")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // --- EFFECT: Fetch Messages ---
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        const res = await getConversation(selectedChat.id);
        dispatch(setConversationMessages({
          conversationId: selectedChat.id,
          messages: res.data
        }));
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };
    fetchMessages();
  }, [selectedChat, dispatch]);

  // --- EFFECT: Mark Read Observer ---
  useEffect(() => {
    if (!selectedChat || !socket.connected) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      const readMessageIds = [];
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const msgId = entry.target.getAttribute("data-msg-id");
          if (msgId) {
            readMessageIds.push(msgId);
            observer.current.unobserve(entry.target);
          }
        }
      });

      if (readMessageIds.length > 0) {
        socket.emit("markMessagesRead", {
          conversationId: selectedChat.id,
          messageIds: readMessageIds,
          byUserId: loggedInUserId
        });
        dispatch(markConversationAsRead(selectedChat.id));
      }
    }, { threshold: 0.5 });

    const unreadElements = document.querySelectorAll(".message-unread");
    unreadElements.forEach((el) => observer.current.observe(el));

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [messages, selectedChat]);

  // --- EFFECT: Scroll ---
  useEffect(() => {
    if (messages.length === 0) return;
    if (firstUnreadIndex !== -1) {
      const firstUnreadId = messages[firstUnreadIndex]._id;
      const element = document.getElementById(`msg-${firstUnreadId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChat?.id, messages.length === 0]);


  // --- HANDLERS ---

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { to: selectedChat.id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { to: selectedChat.id });
    }, 1500);
  };

  const handleSend = async () => {
    if (!message.trim() && !media) return;

    const tempId = "temp-" + Date.now();
    let tempType = "text";

    if (media) {
      if (media.type.startsWith("image/")) tempType = "image";
      else if (media.type.startsWith("audio/")) tempType = "audio";
      else if (media.type.startsWith("video/")) tempType = "video";
      else tempType = "file";
    }

    if (media) {
      const tempMsg = {
        _id: tempId,
        media: typeof media === "string" ? media : media.name,
        content: "",
        sender: loggedInUserId,
        conversation: selectedChat.id,
        isTemp: true,
        type: tempType,
        status: "sent",
        contentUrl: media.type && media.type.startsWith("image/") ? URL.createObjectURL(media) : null,
        createdAt: new Date().toISOString()
      };
      setTempMessages([tempMsg]);
    }

    try {
      const res = await sendMessage(selectedChat.id, message, media);
      dispatch(addMessage({ msg: res.data.newMessage }));
      setTempMessages([]);
      setMessage("");
      setMedia(null);
      socket.emit("stopTyping", { to: selectedChat.id });
    } catch (err) {
      console.error("Send message error:", err);
      setTempMessages([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setMedia(file);
    if (!file) return;

    let type = "file";
    if (file.type.startsWith("image/")) type = "image";
    else if (file.type.startsWith("audio/")) type = "audio";
    else if (file.type.startsWith("video/")) type = "video";

    const tempMsg = {
      _id: "temp-" + Date.now(),
      type,
      content: type === "file" ? file.name : URL.createObjectURL(file),
      sender: { _id: loggedInUserId },
      isTemp: true,
      file,
      status: "sent",
      createdAt: new Date().toISOString()
    };
    setTempMessages([tempMsg]);
  };

  const removePreview = () => {
    setMedia(null);
    setTempMessages([]);
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteForEveryOne(msgId);
    } catch (error) {
      console.error("Error: ", error);
    }
  }

  const getSenderId = (msg) => {
    if (!msg || !msg.sender) return null;
    return msg.sender._id ? String(msg.sender._id) : String(msg.sender);
  };

  const handleAudioCall = () => {
    const recipientId = getOtherUserId();
    if (recipientId) {
      initiateCall(recipientId, true, currentUser?.username);
    } else {
      alert("Unable to initiate call.");
    }
  };

  const handleVideoCall = () => {
    const recipientId = getOtherUserId();
    if (recipientId) {
      initiateCall(recipientId, false, currentUser?.username);
    } else {
      alert("Unable to initiate call.");
    }
  };

  // --- NEW: Group Action Handlers ---

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    try {
      await leaveGroup(selectedChat.id);
      dispatch(clearSelectedChat());
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Failed to leave group.");
    }
  };

  const handleGroupIconClick = () => {
    groupIconInputRef.current.click();
    setShowDropdown(false);
  };

  const handleGroupIconChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("conversationId", selectedChat.id);
    formData.append("groupIcon", file);

    try {
      await updateGroupIcon(selectedChat.id, formData);
      alert("Group icon updated! (Refresh may be needed unless socket updates UI)");
    } catch (error) {
      console.error("Error updating group icon:", error);
      alert("Failed to update icon.");
    }
  };


  // --- RENDER ---
  if (!selectedChat) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center">
            <Send size={40} className="text-violet-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Start a Conversation</h3>
        </div>
      </div>
    );
  }

  const isTyper = typingStatus[selectedChat.id] && Object.keys(typingStatus[selectedChat.id]).some(id => id !== loggedInUserId);
  const isGroup = selectedChat.type === 'group';

  // Determine chat image (handle local uploads vs external URLs)
  const chatImage = selectedChat.avatar;
  return (
    <div className="flex flex-col flex-1 h-screen">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white dark:bg-zinc-900 dark:border-zinc-700/50 backdrop-blur-sm relative z-20">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <div className="lg:hidden" onClick={() => { dispatch(clearSelectedChat()) }}>
            <ArrowLeft />
          </div>
          
          {/* Profile Picture */}
          <div className="relative">
            <img
              src={SERVER_URL+chatImage}
              alt={selectedChat.chatName || selectedChat.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-violet-100 dark:ring-violet-900/30"
            />
            {!isGroup && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
            )}
          </div>
          
          {/* Chat Info */}
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">{selectedChat.chatName || selectedChat.name}</h2>
            {isGroup ? (
                <p className="text-xs text-gray-500">{selectedChat.participants?.length || 0} members</p>
            ) : (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Active now</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={handleAudioCall}
            disabled={selectedChat.isGroup}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:text-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Phone size={20} />
          </button>
          
          <button
            onClick={handleVideoCall}
            disabled={selectedChat.isGroup}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:text-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video size={20} />
          </button>
          
          {/* --- MORE VERTICAL / DROPDOWN CONTAINER --- */}
          <div className="relative dropdown-container">
            <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:text-violet-500 transition-all"
            >
              <MoreVertical size={20} />
            </button>

            {/* --- DROPDOWN (Only for Groups) --- */}
            {showDropdown && selectedChat.isGroup && (
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <button 
                        onClick={handleGroupIconClick}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2 transition-colors border-b border-gray-100 dark:border-zinc-700/50"
                    >
                        <Camera size={16} className="text-violet-500"/> Change Icon
                    </button>
                    <button 
                        onClick={handleLeaveGroup}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                    >
                        <LogOut size={16} /> Leave Group
                    </button>
                </div>
            )}
            
            {/* Hidden Input for changing group icon */}
            <input 
                type="file" 
                accept="image/*" 
                ref={groupIconInputRef} 
                className="hidden" 
                onChange={handleGroupIconChange}
            />
          </div>
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto p-6 space-y-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900">
        {allMessages.map((msg, index) => {
          const currentSenderId = getSenderId(msg);
          const prevMsg = allMessages[index - 1];
          const prevSenderId = getSenderId(prevMsg);
          const isFirstInSequence = currentSenderId !== prevSenderId;
          const isMe = currentSenderId === loggedInUserId;
          const type = msg.type || (msg.media ? "file" : "text");
          const content = msg.media ? SERVER_URL + msg.media : msg.content || msg.contentUrl || "";

          const senderName = msg.sender?.username || "Unknown";
          const senderImage = msg.sender?.profileImage
            ? `${SERVER_URL}${msg.sender.profileImage}`
            : "https://via.placeholder.com/40";

          const isUnread = !isMe && msg.status !== "read";
          const showUnreadLabel = index === firstUnreadIndex;

          return (
            <React.Fragment key={msg._id || index}>
              {/* UNREAD LABEL */}
              {showUnreadLabel && (
                <div className="w-full flex justify-center my-4">
                  <span className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-xs px-3 py-1 rounded-full shadow-sm font-medium">
                    Unread Messages
                  </span>
                </div>
              )}

              <div
                id={`msg-${msg._id}`}
                data-msg-id={msg._id}
                className={`flex ${isMe ? "justify-end" : "justify-start"} group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUnread ? 'message-unread' : ''}`}
                style={{ marginTop: isFirstInSequence ? "16px" : "2px" }}
              >
                {/* AVATAR (other users) */}
                {!isMe && (
                  <div className="w-10 flex-shrink-0 flex flex-col justify-end mr-2">
                    {isFirstInSequence ? (
                      <img
                        src={senderImage}
                        alt={senderName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-zinc-700"
                        title={senderName}
                      />
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                  {/* Sender Name */}
                  {!isMe && isFirstInSequence && (
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 ml-1 mb-1">
                      {senderName}
                    </span>
                  )}

                  {/* BUBBLE */}
                  <div
                    className={`relative p-2 rounded-2xl text-sm shadow-sm transition-all ${msg.isDeleted
                        ? "bg-gray-100 dark:bg-zinc-800/50 text-gray-400 italic border border-dashed border-gray-300 dark:border-zinc-700"
                        : isMe
                          ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-br-sm"
                          : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-zinc-700"
                      }`}
                  >
                    {/* DELETE BUTTON */}
                    {isMe && !msg.isTemp && !msg.isDeleted && (
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-gray-100 dark:border-zinc-800"
                        title="Delete for everyone"
                      >
                        <Trash size={14} />
                      </button>
                    )}

                    {/* CONTENT */}
                    {msg.isDeleted ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🚫 This message was deleted</span>
                      </div>
                    ) : (
                      <>
                        {type === "text" && <p className="leading-relaxed">{content}</p>}

                        {type === "image" && (
                          <img
                            src={content}
                            alt="Sent media"
                            className={`rounded-lg border border-gray-300 dark:border-zinc-700 ${msg.isTemp ? "w-20 h-20 object-cover opacity-70" : "max-w-[200px] max-h-[200px]"
                              }`}
                          />
                        )}

                        {type === "audio" && (
                          <div className={`${msg.isTemp ? "w-36 opacity-70" : "w-full"}`}>
                            <AudioMessage src={content} />
                          </div>
                        )}

                        {(type === "file" || type === "video") && !msg.isTemp && (
                          <a
                            href={content}
                            download
                            className={`text-sm underline break-all flex items-center gap-1 ${isMe ? "text-violet-100" : "text-blue-600 dark:text-blue-400"
                              }`}
                          >
                            <Paperclip size={14} />
                            {msg.media ? msg.media : "Download File"}
                          </a>
                        )}
                      </>
                    )}

                    {/* REMOVE TEMP */}
                    {msg.isTemp && (
                      <button
                        onClick={removePreview}
                        className="absolute -top-2 -right-2 text-white bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-lg border-2 border-white"
                      >
                        ✕
                      </button>
                    )}

                    {/* FOOTER: Time & Ticks */}
                    {!msg.isTemp && !msg.isDeleted && (
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? "opacity-80" : "opacity-50"}`}>
                        <span className={`text-[10px] ${isMe ? "text-violet-100" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                        {isMe && <MessageStatus status={msg.status} isMe={true} />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Typing Indicator */}
        {isTyper && (
          <div className="flex justify-start pl-2 mb-1 mt-5">
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} className="h-1"></div>
      </div>

      {/* INPUT AREA */}
      <div className="flex items-center gap-2 p-4 border-t border-gray-200 bg-white dark:bg-zinc-900 dark:border-zinc-700/50">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="w-full p-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <button className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-all">
          <Smile size={22} />
        </button>
        <label className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:text-violet-500 transition-all cursor-pointer">
          <Paperclip size={22} />
          <input type="file" accept="*/*" className="hidden" onChange={handleFileChange} />
        </label>

        <button
          onClick={handleSend}
          disabled={!message.trim() && !media}
          className="bg-gradient-to-br from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-md hover:shadow-lg disabled:shadow-none transition-all transform hover:scale-105 active:scale-95"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;