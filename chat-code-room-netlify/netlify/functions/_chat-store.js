const { getStore } = require("@netlify/blobs");

const store = getStore("chat-code-rooms");

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function getRoom(code) {
  return store.get(normalizeCode(code), { type: "json" });
}

async function saveRoom(room) {
  await store.setJSON(room.code, room);
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

async function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return {};
  }
}

function cleanName(name) {
  return String(name || "").trim().slice(0, 24) || "Guest";
}

function cleanText(text) {
  return String(text || "").trim().slice(0, 500);
}

module.exports = {
  cleanName,
  cleanText,
  getRoom,
  json,
  makeCode,
  normalizeCode,
  parseBody,
  saveRoom
};
