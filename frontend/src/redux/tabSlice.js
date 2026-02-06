import { createSlice } from "@reduxjs/toolkit";
const tabSlice=createSlice({
    name:"tab",
    initialState:{
        activeTab:"Chats",
    },
    reducers:{
        setActiveTab:(state,action)=>{
            state.activeTab=action.payload;
        }
    },

});
export const {setActiveTab}=tabSlice.actions;
export default tabSlice.reducer;