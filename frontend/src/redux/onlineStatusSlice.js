import { createSlice } from "@reduxjs/toolkit";
import { SeparatorHorizontalIcon } from "lucide-react";
const initialState={
    onilneUsers:[]
};

const onlineStatusSlice=createSlice({
    name:'OnlineStatus',
    initialState,
    reducers:{
        setOnlineUsers:(state,action)=>{
                state.onilneUsers=action.payload;
        },
        addOnlineUsers:(state,action)=>{
            if(!state.onilneUsers.includes(action.payload))
            {
                state.onilneUsers.push(action.payload)
            }
        },
        removeOnlineUser:(state,action)=>{
            state.onilneUsers.filter(id=>id!==action.payload)
        }
    }

})

export const { setOnlineUsers, addOnlineUser, removeOnlineUser } = onlineStatusSlice.actions;
export default onlineStatusSlice.reducer;
