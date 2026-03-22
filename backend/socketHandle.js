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
    console.log(`Incoming call from ${data.from} (${data.name}) to userId ${data.callToUserId}`);
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
    }
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-online-users", onlineUsers);
  });
};

module.exports = {
  SocketServer,
};