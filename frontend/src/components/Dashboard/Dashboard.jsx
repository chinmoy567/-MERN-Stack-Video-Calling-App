import { useEffect, useRef, useState } from "react";
import Layout from "../Layouts/Layout/Layout";
import socketInstance from "../../socket";
import AuthService from "../../services/AuthService";
import Peer from "simple-peer";

const Dashboard = () => {
  const socket = socketInstance.getSocket();
  const userData = AuthService.getUserData();

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState("");
  const myVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
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

    socket.on("get-online-users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("me", (id) => {
      console.log("my socket id is", id);
      setMe(id);
    });

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
      socket.off("get-online-users");
      socket.off("me");
      socket.off("connect", sendJoin);
    };
  }, []);

  const callToUser = (id) => {
    console.log("call to user id", id);

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      console.log("call to user with signal event");
      socket.emit("callToUser", {
        callToUserId: id,
        signalData: data,
        from: me,
        name: userData.name,
      });
    });

    connectionRef.current = peer;
  };

  return (
    <Layout onlineUsers={onlineUsers} callToUser={callToUser}>
      <h2 className="text-xl text-gray-700 bg-white p-4 rounded shadow mb-4">
        Welcome to Dashboard
      </h2>

      <div className="flex flex-wrap gap-4">
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
            <p className="text-red-500 text-sm mt-2">Camera not available</p>
          )}
        </div>

        <div className="flex flex-col items-center">
          <h4 className="text-gray-700 font-semibold mb-2">Remote Camera</h4>
          <div className="w-72 h-48 bg-black rounded-lg overflow-hidden border-2 border-gray-500 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Waiting for connection...</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;