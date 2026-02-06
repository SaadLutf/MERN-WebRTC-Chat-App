import express from "express";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import registerRoutes from "./routes/Auth/registerRoute.js";
import loginRoutes from "./routes/Auth/loginRoute.js";
import messageRoutes from "./routes/messageRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import dotenv from "dotenv";
import cors from "cors";
import { socketHandler } from "./utils/socketHandler.js";


import path from "path";

dotenv.config();

const app = express();
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

socketHandler(io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());

// Serve uploads folder so images/audio can be accessed
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use('/register', registerRoutes);
app.use('/login', loginRoutes);
app.use('/message', messageRoutes);
app.use('/friends', friendRoutes);
app.use('/user', userRoutes);
app.use('/conversations', conversationRoutes);

app.get('/', (req, res) => {
  res.send("Hello world");
});

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    server.listen(process.env.PORT || 3000, () => {
      console.log(`✅ Server & Socket.IO running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => {
    console.log("❌ MongoDB Error: ", error);
  });
