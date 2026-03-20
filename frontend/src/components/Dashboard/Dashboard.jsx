import { useEffect, useRef, useState } from "react";
import Layout from "../Layouts/Layout/Layout";
import socketInstance from "../../socket";
import AuthService from "../../services/AuthService";

const Dashboard = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const myVideo = useRef();
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const socket = socketInstance.getSocket();
    const userData = AuthService.getUserData();

    // get camera and mic
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((error) => {
        console.log("Camera/Mic error:", error);
      });

    if (!socket || !userData) return;

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("get-online-users", handleOnlineUsers);

    const sendJoin = () => {
      socket.emit("join", {
        id: userData._id,
        name: userData.name,
      });
    };

    if (socket.connected) {
      sendJoin();
    } else {
      socket.once("connect", sendJoin);
    }

    return () => {
      socket.off("get-online-users", handleOnlineUsers);
      socket.off("connect", sendJoin);
    };
  }, []);

  return (
    <Layout onlineUsers={onlineUsers}>
      <h2 className="text-xl text-gray-700 bg-white p-4 rounded shadow mb-4">
        Welcome to Dashboard
      </h2>

      <div className="flex flex-wrap gap-4">
        {/* Local Video */}
        <div className="flex flex-col items-center">
          <h4 className="text-gray-700 font-semibold mb-2">Your Camera</h4>
          <div className="w-72 h-48 bg-black rounded-lg overflow-hidden border-2 border-blue-500">
            <video
              ref={myVideo}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          {!stream && (
            <p className="text-red-500 text-sm mt-2">
              Camera not available
            </p>
          )}
        </div>

        {/* Remote Video - placeholder for now */}
        <div className="flex flex-col items-center">
          <h4 className="text-gray-700 font-semibold mb-2">Remote Camera</h4>
          <div className="w-72 h-48 bg-black rounded-lg overflow-hidden border-2 border-gray-500 flex items-center justify-center">
            <p className="text-gray-400 text-sm">
              Waiting for connection...
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;