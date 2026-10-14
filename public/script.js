const socket = io();

const joinCard = document.getElementById("joinCard");
const joinForm = document.getElementById("joinForm");
const nameInput = document.getElementById("nameInput");
const joinError = document.getElementById("joinError");
const chatApp = document.getElementById("chatApp");
const socketStatus = document.getElementById("socketStatus");
const userList = document.getElementById("userList");
const chatBox = document.getElementById("chatBox");
const typingStatus = document.getElementById("typingStatus");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

let currentUser = null;
let typingTimeout = null;
const typingUsers = new Set();

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function addSystemMessage(text) {
  const row = document.createElement("p");
  row.className = "system";
  row.textContent = text;
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addChatMessage(data) {
  const row = document.createElement("article");
  row.className = "message" + (data.id === currentUser?.id ? " own" : "");

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `${data.name} · ${formatTime(data.time)}`;

  const body = document.createElement("p");
  body.className = "body";
  body.textContent = data.text;

  row.append(meta, body);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function renderUsers(users) {
  userList.replaceChildren();

  users.forEach((user) => {
    const item = document.createElement("li");
    item.textContent = user.name + (user.id === currentUser?.id ? " (you)" : "");
    userList.appendChild(item);
  });
}

function renderTyping() {
  if (typingUsers.size === 0) {
    typingStatus.textContent = "";
    return;
  }

  const names = Array.from(typingUsers);
  typingStatus.textContent =
    names.length === 1
      ? `${names[0]} is typing...`
      : `${names.join(", ")} are typing...`;
}

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  joinError.textContent = "";
  socket.emit("join", nameInput.value);
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  socket.emit("chat-message", text);
  socket.emit("typing", false);
  chatInput.value = "";
});

chatInput.addEventListener("input", () => {
  socket.emit("typing", true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("typing", false);
  }, 800);
});

socket.on("connect", () => {
  socketStatus.textContent = "Connected";
  socketStatus.classList.remove("offline");
});

socket.on("disconnect", () => {
  socketStatus.textContent = "Disconnected";
  socketStatus.classList.add("offline");
  typingUsers.clear();
  renderTyping();
});

socket.on("join-error", (message) => {
  joinError.textContent = message;
});

socket.on("join-success", ({ user, users, history }) => {
  currentUser = user;
  joinCard.classList.add("hidden");
  chatApp.classList.remove("hidden");
  renderUsers(users);
  chatBox.replaceChildren();
  history.forEach(addChatMessage);
  addSystemMessage(`You joined as ${user.name}`);
  chatInput.focus();
});

socket.on("users", renderUsers);

socket.on("chat-message", addChatMessage);

socket.on("system-message", addSystemMessage);

socket.on("typing", ({ name, isTyping }) => {
  if (isTyping) {
    typingUsers.add(name);
  } else {
    typingUsers.delete(name);
  }
  renderTyping();
});
