import { configureStore } from "@reduxjs/toolkit";
import tabReducer from "./tabSlice";
import selectedChatReducer from "./selectedChatSlice";
import messagesReducer from "./messagesSlice";
import userReducer from "./userSlice"
import callReducer from "./callSlice"
import onlineStatusReducer from './onlineStatusSlice';
const store = configureStore({
    reducer: {
        tab: tabReducer,
        selectedChat: selectedChatReducer,
        messages: messagesReducer,
        user: userReducer,
        call: callReducer,
        onlineStatus: onlineStatusReducer,
    },
});
export default store