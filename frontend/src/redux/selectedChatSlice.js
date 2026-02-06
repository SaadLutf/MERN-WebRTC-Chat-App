import { createSlice } from "@reduxjs/toolkit";

const selectedChatSlice=createSlice({
    name:"selectedChat",
    initialState:{
        chat:null
    },
    reducers:{
        setSelectedChat:(state,action)=>{
            state.chat=action.payload;
        },
        clearSelectedChat:(state,action)=>{
            state.chat=null
        }
    }
});

export const { setSelectedChat, clearSelectedChat } = selectedChatSlice.actions;
export default selectedChatSlice.reducer;