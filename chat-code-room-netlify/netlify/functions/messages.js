const {
  cleanName,
  cleanText,
  getRoom,
  json,
  normalizeCode,
  parseBody,
  saveRoom
} = require("./_chat-store");
const { randomUUID } = require("crypto");

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const code = normalizeCode(event.queryStringParameters?.code);
      const room = await getRoom(code);
      if (!room) {
        return json(404, { error: "No chat found for that code." });
      }
      return json(200, { messages: room.messages.slice(-100) });
    }

    if (event.httpMethod === "POST") {
      const body = await parseBody(event);
      const code = normalizeCode(body.code);
      const text = cleanText(body.text);
      if (!text) {
        return json(400, { error: "Type a message first." });
      }

      const room = await getRoom(code);
      if (!room) {
        return json(404, { error: "No chat found for that code." });
      }

      room.messages.push({
        id: randomUUID(),
        userId: String(body.userId || ""),
        name: cleanName(body.name),
        text,
        createdAt: new Date().toISOString()
      });
      room.messages = room.messages.slice(-100);
      await saveRoom(room);

      return json(200, { ok: true });
    }

    return json(405, { error: "Use GET or POST." });
  } catch (error) {
    return json(500, { error: error.message || "Chat backend failed." });
  }
};
