import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfileImage } from "../redux/userSlice";
import {
  ChevronDown,
  ChevronUp,
  Bell,
  Shield,
  User,
  Pencil,
  Check,
  X,
  Camera
} from "lucide-react";
import { editUserInfoApi, getUserById, setProfileImageApi } from "../services/UserApi";
import { Toaster, toast } from "react-hot-toast";

const SettingsTab = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL+"/uploads/";
  const dispatch = useDispatch();
  const [openPersonal, setOpenPersonal] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);

  // User data
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const profileImg = useSelector((state) => state.user.data?.profileImage)
  // Editing control
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");

  // Get user ID from token
  const token = localStorage.getItem("token");
  let loggedInUserId = null;
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      loggedInUserId = decoded.userId;
    } catch (e) { }
  }

  // Fetch user data on mount
  useEffect(() => { const getUserData = async () =>
     { try { const res = await getUserById(loggedInUserId);
       console.log("this is user data", res.data);
        setName(res.data.username);
         setLocation(res.data.location);
         setEmail(res.data.email); 
         dispatch(updateProfileImage(res.data.profileImage)) } catch (error) { console.error("Error: ", error); } }; if (loggedInUserId) getUserData(); }, [loggedInUserId]);


  // Update handler
  const handleUpdate = async (data) => {
    try {
      const res = await editUserInfoApi(data);
      console.log("data edited");
      if (data.username) setName(data.username);
      if (data.location) setLocation(data.location);
      toast.success(res.data.message || "Updated Successfully!");
    } catch (error) {
      console.error("Error: ", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return

    const formData = new FormData();
    formData.append("profileImage", file)
    try {
      const res = await setProfileImageApi(formData);
      dispatch(updateProfileImage(res.data.newImagePath))

      toast.success(res.data.message || "Updated Successfully!");
    } catch (error) {
      console.error("Error: ", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  }


  return (
    <div className="w-full h-full flex flex-col">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex-1 overflow-y-auto px-6 pt-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-zinc-600 dark:scrollbar-track-zinc-800">
        <h1 className="font-medium text-xl text-gray-700 dark:text-gray-50">
          Settings
        </h1>

        {/* Profile */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white mt-5 mx-auto relative">
          <img
            src={`${serverUrl}${profileImg}?t=${Date.now()}`}
            alt="Profile"
            className="w-full h-full object-cover"
          />

          {/* Camera button */}
          <label className="absolute bottom-1 right-1 bg-gray-200 p-1.5 rounded-full shadow-md cursor-pointer hover:bg-gray-300 transition">
            <Camera size={16} className="text-gray-700" />
            <input type="file" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>


        <h3 className="text-xl text-center mt-5 font-medium">{name}</h3>

        {/* Status */}
        <div className="flex justify-center items-center gap-3 mt-2">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Available</p>
        </div>

        {/* Personal Info */}
        <div
          onClick={() => setOpenPersonal(!openPersonal)}
          className="flex justify-between p-3 border-gray-100 border bg-[#F9FAFA] mt-6 text-[14px] font-medium cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <User size={14} />
            <p>Personal Info</p>
          </div>
          {openPersonal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>

        {openPersonal && (
          <div className="bg-white w-full p-3 space-y-4 border border-gray-100">
            {/* Editable Name */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[#7a7f9a]">Name</p>
              {editingField === "username" ? (
                <div className="flex items-center gap-1">
                  <input
                    className="border px-1 py-0.5 text-sm"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                  />
                  <Check
                    size={14}
                    className="cursor-pointer"
                    onClick={() => {
                      handleUpdate({ username: tempValue });
                      setName(tempValue);
                      setEditingField(null);
                    }}
                  />
                  <X
                    size={14}
                    className="cursor-pointer"
                    onClick={() => setEditingField(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[14px] font-medium">
                  <p>{name}</p>
                  <Pencil
                    size={14}
                    className="cursor-pointer"
                    onClick={() => {
                      setEditingField("username");
                      setTempValue(name);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Email (Not Editable) */}
            <div>
              <p className="text-[13px] text-[#7a7f9a]">Email</p>
              <p className="text-[14px] font-medium">{email}</p>
            </div>

            {/* Editable Location */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[#7a7f9a]">Location</p>
              {editingField === "location" ? (
                <div className="flex items-center gap-1">
                  <input
                    className="border px-1 py-0.5 text-sm"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                  />
                  <Check
                    size={14}
                    className="cursor-pointer"
                    onClick={() => {
                      handleUpdate({ location: tempValue });
                      setLocation(tempValue);
                      setEditingField(null);
                    }}
                  />
                  <X
                    size={14}
                    className="cursor-pointer"
                    onClick={() => setEditingField(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[14px] font-medium">
                  <p>{location}</p>
                  <Pencil
                    size={14}
                    className="cursor-pointer"
                    onClick={() => {
                      setEditingField("location");
                      setTempValue(location);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Privacy */}
        <div
          onClick={() => setOpenPrivacy(!openPrivacy)}
          className="flex justify-between p-3 border-gray-100 border bg-[#F9FAFA] mt-4 text-[14px] font-medium cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Shield size={14} />
            <p>Privacy</p>
          </div>
          {openPrivacy ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>

        {openPrivacy && (
          <div className="bg-white w-full p-3 space-y-4 border border-gray-100">
            <div className="flex justify-between items-center">
              <p className="text-[14px]">Profile Photo</p>
              <select className="border rounded px-2 py-1 text-sm">
                <option>Everyone</option>
                <option>Contacts</option>
                <option>Nobody</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[14px]">Last Seen</p>
              <input type="checkbox" defaultChecked className="accent-green-500" />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[14px]">Status</p>
              <select className="border rounded px-2 py-1 text-sm">
                <option>Everyone</option>
                <option>Contacts</option>
                <option>Nobody</option>
              </select>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div
          onClick={() => setOpenNotifications(!openNotifications)}
          className="flex justify-between p-3 border-gray-100 border bg-[#F9FAFA] mt-4 text-[14px] font-medium cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Bell size={14} />
            <p>Notifications</p>
          </div>
          {openNotifications ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>

        {openNotifications && (
          <div className="bg-white w-full p-3 space-y-4 border border-gray-100">
            <div className="flex justify-between items-center">
              <p className="text-[14px]">Sounds</p>
              <input type="checkbox" defaultChecked className="accent-green-500" />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[14px]">Desktop Alerts</p>
              <input type="checkbox" className="accent-green-500" />
            </div>
          </div>
        )}

        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default SettingsTab;
