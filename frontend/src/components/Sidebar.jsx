import React, { useState, useEffect, useRef } from "react";
import { User, MessageCircle, Users, Settings, Globe, Moon, Sun, LogOut } from "lucide-react";
import Logo from "../assets/images/logo.svg";
import { useSelector, useDispatch } from "react-redux";
import { setActiveTab } from "../redux/tabSlice";
import { useNavigate } from "react-router-dom";
const Sidebar = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL+"/uploads/";
  const navigate=useNavigate();
  const profileImg = useSelector((state) => state.user.data?.profileImage);
  const tabs = [
    { id: "Profile", icon: User },
    { id: "Chats", icon: MessageCircle },
    { id: "Friends", icon: Users },
    { id: "Settings", icon: Settings },
  ];

  const dispatch = useDispatch();
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const activeTab = useSelector((state) => state.tab.activeTab);

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate('/login')
    window.location.reload();
  };

  return (
    <div
      className="
      fixed bottom-0 left-0 w-full h-[70px] flex justify-around items-center bg-white shadow-lg z-50
      lg:relative lg:flex-col lg:w-[80px] lg:h-screen lg:justify-between lg:items-center lg:p-4 
      dark:bg-zinc-800
    "
    >
      {/* Logo (Desktop only) */}
      <div className="hidden lg:block mx-auto">
        <img src={Logo} alt="logo" width={35} />
      </div>

      {/* Tabs */}
      <ul className="flex flex-row justify-around w-full lg:flex-col lg:flex-1 lg:mt-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.id} className="list-none">
              <button
                onClick={() => dispatch(setActiveTab(tab.id))}
                className={`flex items-center justify-center w-14 h-14 transition rounded-xl
                ${
                  activeTab === tab.id
                    ? "bg-violet-500 text-white"
                    : "text-gray-600 hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
              >
                <Icon size={26} />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Bottom Utilities (Desktop only) */}
      <div className="hidden lg:flex flex-col items-center space-y-4 relative">
        {/* Language */}
        <button
         
          className={`flex items-center justify-center w-14 h-14 rounded-xl transition 
          ${
            activeTab === "Language"
              ? "bg-violet-500 text-white"
              : "text-gray-600 hover:bg-gray-200 dark:hover:bg-zinc-700"
          }`}
        >
          <Globe size={26} />
        </button>

        {/* Dark Mode */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center justify-center w-14 h-14 rounded-xl text-gray-600 hover:bg-gray-200 dark:hover:bg-zinc-700"
        >
          {darkMode ? <Sun size={26} /> : <Moon size={26} />}
        </button>

        {/* Profile + Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <div
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-violet-500 cursor-pointer"
            onClick={() => setShowProfileMenu((prev) => !prev)}
          >
            <img
              src={
                profileImg
                  ? `${serverUrl}${profileImg}?t=${Date.now()}`
                  : "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
              }
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div
              className="absolute bottom-16 left-12 transform -translate-x-1/2 bg-white dark:bg-zinc-800 
              rounded-lg shadow-lg w-44 p-3 z-50 border border-gray-100 dark:border-zinc-700 animate-fadeIn font-semibold" 
            >
              <button
                onClick={() => {
                  dispatch(setActiveTab("Profile"));
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"
              >
                <User size={16} /> View Profile
              </button>

              <button
                onClick={() => {
                  dispatch(setActiveTab("Settings"));
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"
              >
                <Settings size={16} /> Settings
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-base text-red-600 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
