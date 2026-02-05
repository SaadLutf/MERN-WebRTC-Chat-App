import React, { useState, useEffect } from 'react';

import { X, Camera, Check, Users } from 'lucide-react';
import { getFriendList } from '../services/Friends';
import { createGroup } from '../services/conversationsApi';
const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {

  const serverUrl = import.meta.env.VITE_SERVER_URL + "/uploads/";
  // --- State Management ---
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      // Reset states when opening
      setError("");
      setGroupName("");
      setGroupIcon(null);
      setPreviewUrl(null);
      setSelectedFriends([]);
    }
  }, [isOpen]);

  // --- Handlers ---
  const fetchFriends = async () => {
    try {
      const res = await getFriendList();
      setFriends(res);
    } catch (err) {
      console.error("Failed to fetch friends", err);
      setError("Could not load friends list.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupIcon(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }
    if (selectedFriends.length === 0) {
      setError("Please select at least one friend.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("groupName", groupName);
      if (groupIcon) {
        formData.append("groupIcon", groupIcon);
      }
      // Append friends array for backend handling
      selectedFriends.forEach((id) => {
        formData.append("memberIds", id);
      });
      const res = await createGroup(formData);

      onGroupCreated(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Overlay
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">

      {/* Modal Container */}
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl transform transition-all p-6 m-4 max-h-[90vh] overflow-y-auto scrollbar-hide">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-3 border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Create New Group
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-full p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          {/* Image Upload Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm bg-gray-100 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400" />
                )}
              </div>
              {/* Hidden File Input overlay */}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md">
                <Camera className="w-3 h-3" />
              </div>
            </div>
            <span className="text-xs text-gray-500">Upload Group Icon</span>
          </div>

          {/* Group Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Weekend Plans"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Friend List Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Members <span className="text-gray-400 text-xs">({selectedFriends.length} selected)</span>
            </label>

            <div className="border border-gray-200 rounded-lg h-48 overflow-y-auto p-2 bg-gray-50 custom-scrollbar">
              {friends.length > 0 ? (
                friends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend._id);
                  return (
                    <div
                      key={friend._id}
                      onClick={() => toggleFriend(friend._id)}
                      className={`flex items-center p-2 mb-1 rounded-lg cursor-pointer transition-all duration-200 border ${isSelected
                          ? 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'hover:bg-white border-transparent hover:shadow-sm'
                        }`}
                    >
                      {/* Avatar */}
                      <img
                        src={
                          friend.profileImage
                            ? `${serverUrl}${friend.profileImage}?t=${Date.now()}`
                            : "https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
                        }
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 mr-3"
                      />

                      {/* Name */}
                      <span className={`font-medium text-sm ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {friend.username}
                      </span>

                      {/* Checkmark Icon */}
                      {isSelected && (
                        <div className="ml-auto bg-blue-500 text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                  <Users className="w-8 h-8 mb-2 opacity-20" />
                  No friends found
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 mt-6 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition font-medium text-sm shadow-sm flex justify-center items-center ${loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : "Create Group"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;