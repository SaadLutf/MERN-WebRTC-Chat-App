import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inCall: false,           
  isAudioCall: false,      
  otherUser: null,         
  incomingCall: null,       
  callStatus: 'idle',     
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    // Action to set the incoming call data (triggers the modal)
    setIncomingCall: (state, action) => {
      state.incomingCall = action.payload; // { from, fromName, offer, isAudioOnly }
      state.callStatus = 'ringing';
    },
    
    // Action to clear the incoming call (when rejected or missed)
    clearIncomingCall: (state) => {
      state.incomingCall = null;
      state.callStatus = 'idle';
    },
    
    // Action when we initiate or accept a call
    startCall: (state, action) => {
      state.inCall = true;
      state.isAudioCall = action.payload.isAudioOnly;
      state.otherUser = action.payload.otherUser;
      state.callStatus = action.payload.status || 'active';
      state.incomingCall = null; 
    },

    // Action when a call is ended
    endCall: (state) => {
      // Reset all state back to initial
      return initialState;
    },
    
    setCallStatus: (state, action) => {
      state.callStatus = action.payload;
    }
  },
});

export const { 
  setIncomingCall, 
  clearIncomingCall, 
  startCall, 
  endCall,
  setCallStatus
} = callSlice.actions;

export default callSlice.reducer;