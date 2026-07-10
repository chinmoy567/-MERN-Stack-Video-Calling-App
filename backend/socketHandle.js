const Message = require("./models/messageModel");

let onlineUsers = [];

const SocketServer = async (socket, io) => {
  socket.emit("me", socket.id);

  socket.on("join", (user) => {
    const verifiedId = socket.userId;
    if (!user || String(user.id) !== verifiedId) {
      return;
    }
    socket.join(verifiedId);
    const existingUser = onlineUsers.find((u) => u.userId === verifiedId);

    if (existingUser) {
      existingUser.socketId = socket.id;
    } else {
      onlineUsers.push({
        userId: verifiedId,
        name: user.name,
        socketId: socket.id,
      });
    }
    io.emit("get-online-users", onlineUsers);
  });

  socket.on("callToUser", (data) => {
    if (!data || typeof data.callToUserId === "undefined" || !data.from || !data.signalData) {
      console.warn("callToUser: invalid payload", data);
      return;
    }
    const callToUserId = String(data.callToUserId);
    console.log(
      `Incoming call from ${data.from} (${data.name}) to userId ${callToUserId}`
    );
    const userSocketData = onlineUsers.find(
      (user) => user.userId === callToUserId
    );
    if (userSocketData) {
      io.to(userSocketData.socketId).emit("callToUser", {
        signal: data.signalData,
        from: data.from,
        name: data.name,
        callType: data.callType === "audio" ? "audio" : "video",
      });
    } else {
      console.log("Target user not found or offline");
      socket.emit("callFailed", { reason: "offline" });
    }
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  // ── Reject Call ──────────────────────────────────────────────────────────
  socket.on("rejectCall", (data) => {
    console.log(`Call rejected — notifying caller socket: ${data.to}`);
    io.to(data.to).emit("callRejected");
  });

  socket.on("busyCall", (data) => {
    if (data?.to) {
      io.to(data.to).emit("callFailed", { reason: "busy" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

  socket.on("cancelOutgoingCall", (data) => {
    if (!data || typeof data.toUserId === "undefined") return;
    const peer = onlineUsers.find((u) => u.userId === String(data.toUserId));
    if (peer) {
      io.to(peer.socketId).emit("incomingCallCanceled");
    }
  });

  socket.on("endCall", (data) => {
    if (!data) return;
    if (data.toSocketId) {
      io.to(data.toSocketId).emit("callEnded");
    } else if (data.toUserId != null && data.toUserId !== "") {
      const peer = onlineUsers.find((u) => u.userId === String(data.toUserId));
      if (peer) {
        io.to(peer.socketId).emit("callEnded");
      }
    }
  });

  // ── Chat messaging ───────────────────────────────────────────────────────
  socket.on("send-message", async (data, ack) => {
    try {
      const from = socket.userId;
      const to = data && data.to != null ? String(data.to) : "";
      const text = data && typeof data.text === "string" ? data.text.trim() : "";

      if (!to || !text) {
        if (typeof ack === "function") ack({ ok: false, error: "invalid" });
        return;
      }

      const saved = await Message.create({
        sender: from,
        receiver: to,
        text: text.slice(0, 2000),
      });

      const payload = {
        _id: String(saved._id),
        sender: from,
        receiver: to,
        text: saved.text,
        read: false,
        createdAt: saved.createdAt,
      };

      // Deliver live to the receiver if they are online.
      const receiver = onlineUsers.find((u) => u.userId === to);
      if (receiver) {
        io.to(receiver.socketId).emit("receive-message", payload);
      }

      // Acknowledge to the sender with the persisted message.
      if (typeof ack === "function") ack({ ok: true, message: payload });
    } catch (err) {
      console.error("send-message error:", err.message);
      if (typeof ack === "function") ack({ ok: false, error: "server" });
    }
  });

  socket.on("typing", (data) => {
    const to = data && data.to != null ? String(data.to) : "";
    if (!to) return;
    const receiver = onlineUsers.find((u) => u.userId === to);
    if (receiver) {
      io.to(receiver.socketId).emit("typing", {
        from: socket.userId,
        isTyping: !!(data && data.isTyping),
      });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-online-users", onlineUsers);
  });
};

module.exports = {
  SocketServer,
};
