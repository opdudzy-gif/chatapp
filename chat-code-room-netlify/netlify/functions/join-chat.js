const {
  cleanName,
  getRoom,
  json,
  normalizeCode,
  parseBody,
  saveRoom
} = require("./_chat-store");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Use POST." });
    }

    const body = await parseBody(event);
    const code = normalizeCode(body.code);
    if (!code) {
      return json(400, { error: "Enter a chat code." });
    }

    const room = await getRoom(code);
    if (!room) {
      return json(404, { error: "No chat found for that code." });
    }

    const userId = String(body.userId || "");
    const name = cleanName(body.name);
    const alreadyJoined = room.members.some((member) => member.userId === userId);
    if (!alreadyJoined) {
      room.members.push({ userId, name, joinedAt: new Date().toISOString() });
      await saveRoom(room);
    }

    return json(200, { code: room.code });
  } catch (error) {
    return json(500, { error: error.message || "Chat backend failed." });
  }
};
