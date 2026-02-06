import API from "./Api";

// Send Text or Media Message
export const sendMessage = async (conversationId, content, mediaFile = null) => {
  const formData = new FormData();
  
  formData.append("conversationId", conversationId);
  if (content) formData.append("content", content);
  if (mediaFile) formData.append("media", mediaFile); // matches upload.single("media")

  return await API.post("/message/send", formData);
};


// Get Conversation
export const getConversation = async (conversationId) => {
  return await API.get(`/message/${conversationId}`);
};

// Update Single Message Status
export const updateMessageStatus = async (messageId, status) => {
  return await API.put(`/message/${messageId}/status`, { status });
};

// Mark All Messages as Read
export const markConversationAsRead = async (userId) => {
  return await API.put(`/message/conversations/${userId}/read`);
};

// Get Recent Conversations
export const getRecentConversations = async () => {
  return await API.get("/conversations/recent");
};
// find or create 1 on 1 conversation
export const initiatePrivateChat = async (participantId) => {
  return await API.post("/conversations/initiate-private", {
    participantId,
  });
};

// delete a message 

export const deleteForEveryOne=async(msgId)=>{
  return await API.put(`/message/delete-for-everyone/${msgId}`)
}

