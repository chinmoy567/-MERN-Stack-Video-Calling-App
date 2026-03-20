let onlineUsers = [];

const SocketServer = async (socket, io) => {
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

  //socket disconnect
  socket.on("disconnect", () => {
    
    // console.log("Before disconnect online users:", onlineUsers);

    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);

    // console.log("after disconnect onlin users:", onlineUsers);

    io.emit("get-online-users", onlineUsers);
  });
};
module.exports = {
  SocketServer,
  onlineUsers,
};
