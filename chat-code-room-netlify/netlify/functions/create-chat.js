const {
  cleanName,
  getRoom,
  json,
  makeCode,
  parseBody,
  saveRoom
} = require("./_chat-store");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Use POST." });
    }

    const body = await parseBody(event);
    const name = cleanName(body.name);
    const userId = String(body.userId || "");

    let code = makeCode();
    for (let attempts = 0; attempts < 5; attempts += 1) {
      const existing = await getRoom(code);
      if (!existing) break;
      code = makeCode();
    }

    const now = new Date().toISOString();
    const room = {
      code,
      createdAt: now,
      members: [{ userId, name, joinedAt: now }],
      messages: []
    };

    await saveRoom(room);
    return json(200, { code });
  } catch (error) {
    return json(500, { error: error.message || "Chat backend failed." });
  }
};
