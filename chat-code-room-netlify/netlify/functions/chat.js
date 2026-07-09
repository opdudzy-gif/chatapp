const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const dataFile = path.join("/tmp", "chat-code-rooms.json");
let memoryRooms = {};

async function readRooms() {
  try {
    const text = await fs.readFile(dataFile, "utf8");
    memoryRooms = JSON.parse(text);
  } catch {
    memoryRooms = memoryRooms || {};
  }
  return memoryRooms;
}

async function writeRooms(rooms) {
  memoryRooms = rooms;
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

function cleanName(name) {
  return String(name || "").trim().slice(0, 24) || "Guest";
}

function cleanText(text) {
  return String(text || "").trim().slice(0, 500);
}

function cleanTitle(title) {
  return String(title || "").trim().slice(0, 32) || "Untitled Chat";
}

function routeFromEvent(event) {
  const lastPart = String(event.path || "").split("/").filter(Boolean).pop();
  return lastPart || "";
}

async function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return {};
  }
}

exports.handler = async (event) => {
  try {
    const route = routeFromEvent(event);
    const rooms = await readRooms();

    if (route === "create-chat" && event.httpMethod === "POST") {
      const body = await parseBody(event);
      let code = makeCode();
      for (let attempts = 0; attempts < 10 && rooms[code]; attempts += 1) {
        code = makeCode();
      }

      const now = new Date().toISOString();
      rooms[code] = {
        code,
        title: cleanTitle(body.title),
        createdAt: now,
        members: [{ userId: String(body.userId || ""), name: cleanName(body.name), joinedAt: now }],
        messages: []
      };

      await writeRooms(rooms);
      return json(200, { code, title: rooms[code].title });
    }

    if (route === "join-chat" && event.httpMethod === "POST") {
      const body = await parseBody(event);
      const code = normalizeCode(body.code);
      const room = rooms[code];
      if (!room) {
        return json(404, { error: "No chat found for that code. Make sure they copied the newest code." });
      }

      const userId = String(body.userId || "");
      if (!room.members.some((member) => member.userId === userId)) {
        room.members.push({ userId, name: cleanName(body.name), joinedAt: new Date().toISOString() });
        await writeRooms(rooms);
      }

      return json(200, { code: room.code, title: room.title || "Untitled Chat" });
    }

    if (route === "messages" && event.httpMethod === "GET") {
      const code = normalizeCode(event.queryStringParameters?.code);
      const room = rooms[code];
      if (!room) {
        return json(404, { error: "No chat found for that code." });
      }
      return json(200, { messages: room.messages.slice(-100) });
    }

    if (route === "messages" && event.httpMethod === "POST") {
      const body = await parseBody(event);
      const code = normalizeCode(body.code);
      const room = rooms[code];
      const text = cleanText(body.text);

      if (!room) {
        return json(404, { error: "No chat found for that code." });
      }
      if (!text) {
        return json(400, { error: "Type a message first." });
      }

      room.messages.push({
        id: randomUUID(),
        userId: String(body.userId || ""),
        name: cleanName(body.name),
        text,
        createdAt: new Date().toISOString()
      });
      room.messages = room.messages.slice(-100);
      await writeRooms(rooms);

      return json(200, { ok: true });
    }

    return json(404, { error: "Chat backend route not found." });
  } catch (error) {
    return json(500, { error: error.message || "Chat backend failed." });
  }
};
