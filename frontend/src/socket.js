// src/socket.js
import { io } from "socket.io-client";

export const socket = io("http://localhost:3000", {
  autoConnect: false, //  will manually connect after user logs in
});
