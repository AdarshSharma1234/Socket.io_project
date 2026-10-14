const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAX_MESSAGE_LENGTH = 500;
const MAX_NAME_LENGTH = 24;
const MAX_HISTORY = 50;

const users = new Map();
const messageHistory = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Socket.IO chat server is running",
    onlineUsers: users.size,
  });
});

app.get("/api/users", (req, res) => {
  res.json({
    success: true,
    users: getOnlineUsers(),
  });
});

function getOnlineUsers() {
  return Array.from(users.values());
}

function sanitizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function emitUsers() {
  io.emit("users", getOnlineUsers());
}

io.on("connection", (socket) => {
  socket.on("join", (rawName) => {
    const name = sanitizeText(rawName, MAX_NAME_LENGTH);

    if (!name) {
      socket.emit("join-error", "Please enter a name.");
      return;
    }

    const taken = Array.from(users.values()).some(
      (user) => user.name.toLowerCase() === name.toLowerCase()
    );

    if (taken) {
      socket.emit("join-error", "That name is already in use.");
      return;
    }

    const user = { id: socket.id, name };
    users.set(socket.id, user);

    socket.emit("join-success", {
      user,
      users: getOnlineUsers(),
      history: messageHistory,
    });

    socket.broadcast.emit("system-message", `${name} joined the chat`);
    emitUsers();
  });

  socket.on("chat-message", (rawText) => {
    const user = users.get(socket.id);
    if (!user) return;

    const text = sanitizeText(rawText, MAX_MESSAGE_LENGTH);
    if (!text) return;

    const payload = {
      id: socket.id,
      name: user.name,
      text,
      time: new Date().toISOString(),
    };

    messageHistory.push(payload);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }

    io.emit("chat-message", payload);
  });

  socket.on("typing", (isTyping) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.broadcast.emit("typing", {
      name: user.name,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (!user) return;

    users.delete(socket.id);
    io.emit("system-message", `${user.name} left the chat`);
    emitUsers();
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
