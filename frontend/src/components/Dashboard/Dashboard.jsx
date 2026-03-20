

import React, { useEffect, useState } from "react";
import Layout from "../Layouts/Layout/Layout";
import socketInstance from "../../socket";
import AuthService from "../../services/AuthService";

const Dashboard = () => {
  const socket = socketInstance.getSocket();
  const userData = AuthService.getUserData();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!socket || !userData) return;

    console.log("socket connected?", socket.connected);
    console.log("socket id:", socket.id);

    socket.on("get-online-users", (users) => {
      console.log("received online users:", users);
      setOnlineUsers(users);
    });

    const handleConnect = () => {
      console.log("connected! emitting join");
      socket.emit("join", {
        id: userData._id,
        name: userData.name,
      });
    };

    socket.on("connect", handleConnect);

    if (socket.connected) {
      console.log("already connected, emitting join");
      socket.emit("join", {
        id: userData._id,
        name: userData.name,
      });
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("get-online-users");
    };
  }, [socket]);

  return (
    <Layout onlineUsers={onlineUsers}>
      <h2 className="text-xl text-gray-700 bg-white p-4 rounded shadow">
        Welcome to Dashboard
      </h2>
    </Layout>
  );
};

export default Dashboard;















// import React,{useEffect} from "react";
// import Layout from "../Layouts/Layout/Layout";
// import socketInstance from "../../socket";
// import AuthService from "../../services/AuthService";

// const Dashboard = () => {
//   const socket = socketInstance.getSocket();
//   const userData = AuthService.getUserData();
//   const [onlineUsers, setOnlineUsers] = React.useState([]); 



//   useEffect(() => {
//   socket.emit("join", {
//     id: userData._id,
//     name: userData.name,});}, [socket]);

//   return (
//     <Layout onlineUsers={onlineUsers}>
//       <h2 className="text-xl text-gray-700 bg-white p-4 rounded shadow">
//         Welcome to Dashboard
//       </h2>
//     </Layout>
//   );
// };

// export default Dashboard;

 