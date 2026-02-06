// src/redux/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: { data: null },
  reducers: {
    setUser: (state, action) => {
      state.data = action.payload;
    },
    updateProfileImage: (state, action) => {
      if (state.data) {
        state.data.profileImage = action.payload;
      }
    },
    clearUser: (state) => {
      state.data = null;
    },
  },
});

export const { setUser, updateProfileImage, clearUser } = userSlice.actions;
export default userSlice.reducer;
