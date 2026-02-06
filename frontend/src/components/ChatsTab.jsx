import React, { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedChat } from "../redux/selectedChatSlice";
import TypingIndicator from "./TypingIndicator";
import CreateGroupModal from "./CreateGroup";
import { prependRecent } from "../redux/messagesSlice";

const ChatsTab = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL + "/uploads/";
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch();

  // Redux state
  const recentChats = useSelector((state) => state.messages.recent || []);
  const typingStatus = useSelector((state) => state.messages.typingStatus || {});
  const { currentUser } = useSelector((state) => state.user);



  const getMyId = () => {
    if (currentUser?._id) return currentUser._id;
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        return decoded.userId;
      } catch (e) { return null; }
    }
    return null;
  };
  const myId = getMyId();

  const handleGroupCreated = (newConversation) => {
    dispatch(prependRecent(newConversation));
    setIsModalOpen(false);
  };

  // Placeholder profiles for the top slider (Static data)
  const profiles = [
    { id: 1, name: "Patrick", image: "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg", status: "online" },
    { id: 2, name: "Doris", image: "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg", status: "online" },
    { id: 3, name: "Emily", image: "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg", status: "online" },
    { id: 4, name: "Steve", image: "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg", status: "away" },
  ];



  const filteredChats = recentChats.filter((convo) => {
    const name = convo.chatName || "Unknown";
    const lastMsg = (convo.lastMessage?.content || "").toString();
    const searchTermLower = searchTerm.toLowerCase();

    return (
      name.toLowerCase().includes(searchTermLower) ||
      lastMsg.toLowerCase().includes(searchTermLower)
    );
  });


  const openChat = (convo) => {
    dispatch(
      setSelectedChat({
        id: convo._id,
        name: convo.chatName,
        avatar: convo.chatImage,
        isGroup: convo.type === "group",
        participants: convo.participants,
        otherUserId: convo.otherUserId,
      })
    );
  };

  return (
    <>
      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
      <div className="w-full h-full flex flex-col p-2">
        <div className="px-6 pt-6">
          <div className="flex justify-between items-center">
            <h1 className="font-medium text-xl text-gray-700 dark:text-gray-50">
              Chats
            </h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded-full bg-violet-500 text-white hover:bg-violet-600 transition-all"
              title="Create Group"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex items-center w-full px-3 py-2 mt-5 mb-5 rounded bg-[#E6EBF5] dark:bg-zinc-600">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-200 flex-shrink-0" />
            <input
              type="text"
              className="ml-2 w-full border-0 bg-transparent placeholder:text-[14px] focus:ring-0 focus:outline-none placeholder:text-gray-400 dark:bg-zinc-600 text-gray-700 dark:text-white"
              placeholder="Search messages or users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Top Horizontal Scroll (Stories/Online) */}
          <Swiper spaceBetween={2} slidesPerView={4.5}>
            {profiles.map((chat) => (
              <SwiperSlide key={chat.id}>
                <div className="bg-[#E6EBF5] w-full max-w-[70px] relative block p-2 mt-4 rounded dark:bg-zinc-600 cursor-pointer">
                  <div className="absolute inset-0 text-center top-[-15px]">
                    <img
                      src={chat.image}
                      alt="profile"
                      className="mx-auto rounded-full w-9 h-9 border-2 border-white dark:border-zinc-700"
                    />
                    <span className={`absolute w-2.5 h-2.5 border-2 border-white rounded-full top-7 lg:right-5 dark:border-zinc-600 ${chat.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  </div>
                  <h5 className="mt-4 mb-0 truncate text-center dark:text-gray-50 text-sm font-medium">
                    {chat.name}
                  </h5>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <h4 className="text-base font font-medium mt-5 mx-6 dark:text-gray-200">Recent</h4>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ul className="list-none">
            {filteredChats.map((convo) => {
              const { lastMessage } = convo;
              const convoId = convo._id;


              const name = convo.chatName;
              const avatar = serverUrl + convo.chatImage;

              const time = lastMessage?.createdAt
                ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
                : "";

              const lastMsgContent = lastMessage?.media
                ? "Sent a file"
                : lastMessage?.content || "No messages yet";

              // Check for typists
              const typers = typingStatus[convoId] || {};
              const isSomeoneElseTyping = Object.keys(typers).some(
                (userId) => userId !== myId && typers[userId]
              );

              return (
                <li
                  key={convoId}
                  className="w-full hover:bg-[#E6EBF5] dark:hover:bg-zinc-700 p-5 flex justify-between cursor-pointer transition-colors"
                  onClick={() => openChat(convo)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <img
                      src={avatar}
                      alt="profile"
                      className="rounded-full w-9 h-9 flex-shrink-0 object-cover bg-gray-300"
                    />
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-base font-bold truncate dark:text-gray-100">
                        {name}
                      </h3>
                      {isSomeoneElseTyping ? (
                        <TypingIndicator />
                      ) : (
                        <p className="text-sm text-[#AAAEBE] truncate">
                          {lastMsgContent}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Time and Unread Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[11px] text-[#AAAEBE] flex-shrink-0">
                      {time}
                    </p>

                    {/* UNREAD BADGE */}
                    {convo.unreadMessages > 0 && (
                      <div className="bg-green-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                        {convo.unreadMessages}
                      </div>
                    )}
                  </div>
                </li>

              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
};

export default ChatsTab;