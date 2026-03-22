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
  console.log(`Backend catch:- Incoming call from ${data.from + ' ' + data.name}`);

  let userSocketId = onlineUsers.find((user) => user.userId == data.callToUserId);

  if (userSocketId) {
    console.log("call to user id", userSocketId);
  }
});

  //socket disconnect
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-online-users", onlineUsers);
  });
};
module.exports = {
  SocketServer,
};
