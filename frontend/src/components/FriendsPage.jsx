import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, UserMinus, Users, ChevronDown, ChevronUp, Check, X,MessageCircle } from "lucide-react";
import {
  getFriendList,
  searchUsers,
  sendFriendRequest,
  unfriendUser,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests
} from "../services/Friends.jsx";
import { initiatePrivateChat } from "../services/MessagesApi.jsx";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setSelectedChat } from "../redux/selectedChatSlice.js";
const FriendsTab = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL+"/uploads/";
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate=useNavigate();
   const dispatch = useDispatch();
  useEffect(() => {
    fetchFriends();
    fetchPending();
  }, []);

  useEffect(()=>{
    console.log("Friends: ",friends)
  },[friends])
  useEffect(()=>{
    console.log("Search Results: ",results)
  },[results])
  const fetchFriends = async () => {
    try {
      const data = await getFriendList();
      setFriends(data?.friends || data || []);
    } catch (error) {
      toast.error("Failed to load friends");
    }
  };

  const fetchPending = async () => {
    try {
      const data = await getPendingRequests();
      setPending(data || []);
    } catch (error) {
      toast.error("Failed to load pending requests");
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) return setResults([]);
    setLoading(true);
    try {
      const data = await searchUsers(value);
      setResults(data?.results || []);
    } catch {
      toast.error("Error searching users");
    }
    setLoading(false);
  };

  const handleSendRequest = async (userId) => {
    try {
      const res = await sendFriendRequest(userId);
      toast.success(res?.message || "Friend request sent!");
      setResults((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, status: "request_sent" } : u))
      );
    } catch {
      toast.error("Error sending request");
    }
  };

  const handleUnfriend = async (userId) => {
    try {
      const res = await unfriendUser(userId);
      setFriends((prev) => prev.filter((f) => f._id !== userId));
      toast.success(res?.message || "Unfriended successfully!");
    } catch {
      toast.error("Error unfriending");
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const res = await acceptFriendRequest(requestId);
      toast.success(res?.message || "Friend request accepted!");
      fetchFriends();
      fetchPending();
    } catch {
      toast.error("Error accepting request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const res = await rejectFriendRequest(requestId);
      toast.success(res?.message || "Request rejected");
      fetchPending();
    } catch {
      toast.error("Error rejecting request");
    }
  };

  const handleChat = async (person) => {
   
    const userId = person._id || person.userId; // Get the ID from either object
    const toastId = toast.loading("Opening chat...");

    try {
     
      const { data: conversation } = await initiatePrivateChat(userId);

     //dispatch conversation data
      dispatch(
        setSelectedChat({
          id: conversation._id, 
          name: person.username,
          avatar: person.profileImage,
          isGroup: false, 
        })
      );
      
      toast.dismiss(toastId);
      

    } catch (error) {
      toast.error("Could not open chat", { id: toastId });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
            <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="font-bold text-2xl text-gray-800 dark:text-gray-50">Friends</h1>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
          <div className="relative flex items-center w-full px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-700 shadow-sm border border-gray-200 dark:border-zinc-600 transition-all duration-200 hover:shadow-md">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-300 flex-shrink-0" />
            <input
              type="text"
              className="ml-3 w-full border-0 bg-transparent placeholder:text-sm focus:ring-0 focus:outline-none text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400"
              placeholder="Search for friends to add..."
              value={query}
              onChange={handleSearch}
            />
          </div>
        </div>

        {!loading && results.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-3 px-1">
              Search Results
            </h4>
            <Swiper spaceBetween={12} slidesPerView={3.5} className="pb-2">
              {results.map((user) => (
               <SwiperSlide key={user.userId}>
  <div className="bg-white dark:bg-zinc-700 w-full p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-zinc-600">
    
    <div className="flex flex-col items-center">
      
      {/* Profile Picture */}
      <img
        src={
         serverUrl+user.profileImage ||
          "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
        }
        alt="profile"
        className="rounded-full w-10 h-10 object-cover border border-violet-300 dark:border-violet-700"
      />

      {/* Username */}
      <h5 className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-2 text-center truncate w-full px-1">
        {user.username}
      </h5>

      {/* Chat Button */}
      <button
       onClick={()=>{handleChat(user)
        
       }}
        className="flex justify-center items-center gap-1 mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md py-1.5 text-[10px] font-medium shadow-sm transition-all"
      >
        <MessageCircle size={12} /> <span>Chat</span>
      </button>

      {/* Friend Request Buttons */}
      {user.status === "friends" ? (
        <button
          disabled
          className="flex justify-center items-center gap-1 mt-1 w-full bg-green-500/90 text-white rounded-md py-1.5 text-[10px]"
        >
          <Users size={12} /> <span>Friends</span>
        </button>
      ) : user.status === "request_sent" ? (
        <button
          disabled
          className="flex justify-center items-center gap-1 mt-1 w-full bg-gray-300 dark:bg-zinc-600 text-gray-700 dark:text-gray-200 rounded-md py-1.5 text-[10px]"
        >
          <UserPlus size={12} /> <span>Pending</span>
        </button>
      ) : user.status === "request_received" ? (
        <button
          disabled
          className="flex justify-center items-center gap-1 mt-1 w-full bg-amber-400/90 text-white rounded-md py-1.5 text-[10px]"
        >
          <UserPlus size={12} /> <span>Pending</span>
        </button>
      ) : (
        <button
          onClick={() => handleSendRequest(user.userId)}
          className="flex justify-center items-center gap-1 mt-1 w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-md py-1.5 text-[10px] shadow-sm transition-all"
        >
          <UserPlus size={12} /> <span>Add</span>
        </button>
      )}

    </div>
  </div>
</SwiperSlide>

              ))}
            </Swiper>
          </div>
        )}

        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mt-8 mb-4">
          Your Friends ({friends.length})
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {friends.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No friends yet</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((friend) => (
              <li
                key={friend._id}
                className="w-full bg-white dark:bg-zinc-700 rounded-xl px-3 py-2 flex justify-between items-center shadow-sm border dark:border-zinc-600"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={serverUrl+friend.profileImage || "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"}
                    alt="profile"
                    className="rounded-full w-10 h-10"
                  />
                  <span className="text-gray-800 dark:text-gray-50">{friend.username}</span>
                </div>
               <div>
                 <button onClick={()=>{handleChat(friend)}} className="text-[#7F22FE] hover:text-[#6f0cf9] mr-2">
                  <MessageCircle  size={20} />
                </button>
                 <button onClick={() => handleUnfriend(friend._id)} className="text-red-500 hover:text-red-700">
                  <UserMinus size={20} />
                </button>
               </div>
              </li>
            ))}
          </ul>
        )}

        <div
          className="mt-6 bg-violet-600 text-white px-4 py-3 rounded-lg flex justify-between items-center cursor-pointer"
          onClick={() => setPendingOpen(!pendingOpen)}
        >
          <span>⏳ Pending Requests ({pending.length})</span>
          {pendingOpen ? <ChevronUp /> : <ChevronDown />}
        </div>

        {pendingOpen && (
          <ul className="mt-2 space-y-2">
            {pending.map((req) => (
              <li
                key={req._id}
                className="bg-white dark:bg-zinc-700 rounded-lg p-4 flex justify-between items-center border dark:border-zinc-600"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={serverUrl+req.from.profileImage || "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"}
                    alt="profile"
                    className="rounded-full w-10 h-10"
                  />
                  <span className="text-gray-800 dark:text-gray-50">{req.from.username}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(req._id)} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600">
                    <Check size={16} />
                  </button>
                  <button onClick={() => handleReject(req._id)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600">
                    <X size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FriendsTab;
