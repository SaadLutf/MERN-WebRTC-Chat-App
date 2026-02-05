// src/store/messagesSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  byId: {},    
  recent: [],   // array of { conversationWith: { _id, username, profileImage, ... }, lastMessage }
  typingStatus: {}
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    
    // set messages for a conversation 
    setConversationMessages(state, action) {
      const { conversationId, messages } = action.payload;
      state.byId[conversationId] = messages;
    },

    // Add a single message and update recent list
    // payload: { msg, currentUserId }
    addMessage(state, action) {
      const { msg } = action.payload;
      // Get convo ID from the message
      const conversationId = msg.conversation;

      if (!conversationId) return;

      if (!state.byId[conversationId]) state.byId[conversationId] = [];
      state.byId[conversationId].push(msg);

      // Update recent list
      const idx = state.recent.findIndex(r => r._id === conversationId);
      if (idx !== -1) {
        state.recent[idx].lastMessage = msg;
        // Move to top
        const item = state.recent.splice(idx, 1)[0];
        state.recent.unshift(item);
      }
    },

    // set entire recent list (from backend / initial load)
    setRecent(state, action) {
      state.recent = action.payload || [];
    },

    // Prepend a new recent conversation (used after fetching user info)
    prependRecent(state, action) {
      state.recent.unshift(action.payload);
    },

    // update conversationWith object when we fetched real user details

    // for typing status
    setTypingStatus: (state, action) => {
      const { from, conversation, isTyping } = action.payload;

      if (!state.typingStatus[conversation]) {
        state.typingStatus[conversation] = {};
      }
      if (isTyping) {
        state.typingStatus[conversation][from] = true;
      } else {
        delete state.typingStatus[conversation][from];
      }
    },
    // 1. Update status of messages (e.g., turn gray ticks to blue)
   updateMessageStatus(state, action) {
        const { conversationId, status, messageIds, myId } = action.payload;

        if (state.byId[conversationId]) {
            state.byId[conversationId].forEach(msg => {
                // If it's MY message
                if (msg.sender === myId || msg.sender._id === myId) {
                    // If messageIds are provided, only update matches. 
                    // Otherwise update ALL (legacy/bulk behavior)
                    if (messageIds && messageIds.length > 0) {
                        if (messageIds.includes(msg._id)) {
                            msg.status = status;
                        }
                    } else {
                        msg.status = status;
                    }
                }
            });
        }
    },

    // 2. Mark conversation as read (Clear unread count)
 markConversationAsRead(state, action) {
    console.log("Reducer called with payload:", action.payload);
    state.recent.forEach(c => console.log(c._id, c.unreadCount));
    const conversationId = action.payload;
    state.recent = state.recent.map(convo =>
        convo._id.toString() === conversationId.toString()
            ? { ...convo, unreadMessages: 0 }
            : convo
    );
},
// updateMessage

updateMessage(state, action) {
  const updatedMsg = action.payload;
  const convoId = updatedMsg.conversation;
  if (state.byId[convoId]) {
    const index = state.byId[convoId].findIndex(m => m._id === updatedMsg._id);
    if (index !== -1) {
      state.byId[convoId][index] = updatedMsg;
    }
  }
  // Update the sidebar preview too
  const convo = state.recent.find(r => r._id === convoId);
  if (convo && convo.lastMessage?._id === updatedMsg._id) {
    convo.lastMessage = updatedMsg;
  }
},


    // Increment unread count (When receiving a msg in a closed chat)
    incrementUnread(state, action) {
        const conversationId = action.payload;
        const convo = state.recent.find(c => c._id === conversationId);
        if (convo) {
            convo.unreadMessages = (convo.unreadMessages || 0) + 1;
        }
    }
  }
  
});

export const {
  setConversationMessages,
  addMessage,
  setRecent,
  prependRecent,
  updateConversationWith,
  setTypingStatus,
  markConversationAsRead,
  updateMessageStatus,
  incrementUnread,
  updateMessage
} = messagesSlice.actions;

export default messagesSlice.reducer;
