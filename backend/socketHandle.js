let onlineUsers = [];

const SocketServer = async (socket, io) => {
  socket.emit("me", socket.id);

  socket.on("join", (user) => {
    socket.join(user.id);
    const existingUser = onlineUsers.find((u) => u.userId === user.id);

    if (existingUser) {
      existingUser.socketId = socket.id;
    } else {
      onlineUsers.push({
        userId: user.id,
        name: user.name,
        socketId: socket.id,
      });
    }
    io.emit("get-online-users", onlineUsers);
  });

  socket.on("callToUser", (data) => {
    console.log(
      `Incoming call from ${data.from} (${data.name}) to userId ${data.callToUserId}`
    );
    const userSocketData = onlineUsers.find(
      (user) => user.userId == data.callToUserId
    );
    if (userSocketData) {
      io.to(userSocketData.socketId).emit("callToUser", {
        signal: data.signalData,
        from: data.from,
        name: data.name,
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
  // ─────────────────────────────────────────────────────────────────────────

  socket.on("cancelOutgoingCall", (data) => {
    const peer = onlineUsers.find((u) => u.userId == data.toUserId);
    if (peer) {
      io.to(peer.socketId).emit("incomingCallCanceled");
    }
  });

  socket.on("endCall", (data) => {
    if (data.toSocketId) {
      io.to(data.toSocketId).emit("callEnded");
    } else if (data.toUserId != null && data.toUserId !== "") {
      const peer = onlineUsers.find((u) => u.userId == data.toUserId);
      if (peer) {
        io.to(peer.socketId).emit("callEnded");
      }
    }
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-online-users", onlineUsers);
  });
};

module.exports = {
  SocketServer,
};