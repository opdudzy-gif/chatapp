const fs = require("fs/promises");
const path = require("path");

const dataFile = path.join("/tmp", "chat-code-rooms.json");

async function readRooms() {
  try {
    const text = await fs.readFile(dataFile, "utf8");
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function writeRooms(rooms) {
  await fs.writeFile(dataFile, JSON.stringify(rooms), "utf8");
}

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
  const rooms = await readRooms();
  return rooms[normalizeCode(code)] || null;
}

async function saveRoom(room) {
  const rooms = await readRooms();
  rooms[room.code] = room;
  await writeRooms(rooms);
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
