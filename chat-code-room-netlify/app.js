const lobby = document.querySelector("#lobby");
const chat = document.querySelector("#chat");
const nameInput = document.querySelector("#nameInput");
const codeInput = document.querySelector("#codeInput");
const joinForm = document.querySelector("#joinForm");
const messageForm = document.querySelector("#messageForm");
const messageInput = document.querySelector("#messageInput");
const messagesEl = document.querySelector("#messages");
const lobbyStatus = document.querySelector("#lobbyStatus");
const roomCodeEl = document.querySelector("#roomCode");
const createChatBtn = document.querySelector("#createChatBtn");
const showJoinBtn = document.querySelector("#showJoinBtn");
const copyCodeBtn = document.querySelector("#copyCodeBtn");
const leaveBtn = document.querySelector("#leaveBtn");

const session = {
  userId: crypto.randomUUID(),
  name: "",
  code: "",
  lastMessageCount: -1,
  pollTimer: null
};

nameInput.value = localStorage.getItem("chat-code-name") || "";

const params = new URLSearchParams(location.search);
const codeFromUrl = params.get("code");
if (codeFromUrl) {
  codeInput.value = codeFromUrl.toUpperCase();
  joinForm.hidden = false;
}

function setStatus(message) {
  lobbyStatus.textContent = message;
}

function getName() {
  const name = nameInput.value.trim();
  if (!name) {
    throw new Error("Add your name first.");
  }
  localStorage.setItem("chat-code-name", name);
  return name;
}

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api/${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
  } catch {
    throw new Error("The chat backend is not reachable. Make sure this is deployed on Netlify with Functions.");
  }

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    if (data.error) {
      throw new Error(data.error);
    }
    if (response.status === 404) {
      throw new Error("Chat backend not found. Deploy this with Netlify Functions, not static-only upload.");
    }
    throw new Error(`Chat backend error (${response.status}).`);
  }
  return data;
}

function showChat(code, name) {
  session.code = code;
  session.name = name;
  session.lastMessageCount = -1;
  roomCodeEl.textContent = code;
  lobby.hidden = true;
  chat.hidden = false;
  messageInput.focus();
  history.replaceState(null, "", `?code=${encodeURIComponent(code)}`);
  startPolling();
}

function showLobby() {
  stopPolling();
  session.code = "";
  chat.hidden = true;
  lobby.hidden = false;
  history.replaceState(null, "", location.pathname);
}

function renderMessages(messages) {
  if (messages.length === session.lastMessageCount) return;
  session.lastMessageCount = messages.length;
  messagesEl.innerHTML = "";

  if (!messages.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No messages yet.";
    messagesEl.append(empty);
    return;
  }

  for (const message of messages) {
    const item = document.createElement("article");
    item.className = message.userId === session.userId ? "message mine" : "message";

    const meta = document.createElement("div");
    meta.className = "message-meta";
    const name = document.createElement("strong");
    name.textContent = message.name;
    const time = document.createElement("span");
    time.textContent = new Date(message.createdAt).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
    meta.append(name, time);

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = message.text;

    item.append(meta, bubble);
    messagesEl.append(item);
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function loadMessages() {
  if (!session.code) return;
  try {
    const data = await api(`messages?code=${encodeURIComponent(session.code)}`);
    renderMessages(data.messages || []);
  } catch (error) {
    console.error(error);
  }
}

function startPolling() {
  stopPolling();
  loadMessages();
  session.pollTimer = setInterval(loadMessages, 1500);
}

function stopPolling() {
  if (session.pollTimer) {
    clearInterval(session.pollTimer);
    session.pollTimer = null;
  }
}

createChatBtn.addEventListener("click", async () => {
  setStatus("");
  try {
    const name = getName();
    createChatBtn.disabled = true;
    const data = await api("create-chat", {
      method: "POST",
      body: JSON.stringify({ name, userId: session.userId })
    });
    showChat(data.code, name);
  } catch (error) {
    setStatus(error.message);
  } finally {
    createChatBtn.disabled = false;
  }
});

showJoinBtn.addEventListener("click", () => {
  joinForm.hidden = !joinForm.hidden;
  if (!joinForm.hidden) codeInput.focus();
});

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");
  try {
    const name = getName();
    const code = codeInput.value.trim().toUpperCase();
    if (!code) throw new Error("Put in the chat code.");
    const data = await api("join-chat", {
      method: "POST",
      body: JSON.stringify({ code, name, userId: session.userId })
    });
    showChat(data.code, name);
  } catch (error) {
    setStatus(error.message);
  }
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  messageInput.value = "";
  try {
    await api("messages", {
      method: "POST",
      body: JSON.stringify({
        code: session.code,
        userId: session.userId,
        name: session.name,
        text
      })
    });
    await loadMessages();
  } catch (error) {
    messageInput.value = text;
    alert(error.message);
  }
});

copyCodeBtn.addEventListener("click", async () => {
  const link = `${location.origin}${location.pathname}?code=${encodeURIComponent(session.code)}`;
  await navigator.clipboard.writeText(link);
  copyCodeBtn.querySelector(".copy-hint").textContent = "Copied";
  setTimeout(() => {
    copyCodeBtn.querySelector(".copy-hint").textContent = "Copy";
  }, 1200);
});

leaveBtn.addEventListener("click", showLobby);
