import API from "./Api"
export const createGroup=async(formData)=>{
    return await API.post('/conversations/create-group',formData);
}

export const leaveGroup = async(conversationId) =>{ 
  return await API.put("/conversations/leave-group", { conversationId })};

export const updateGroupIcon = async(conversationId, formData) =>{ 
  return await API.put("/conversations/update-group-icon", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })};