import { useEffect, useRef, useState } from "react";
import Layout from "../Layouts/Layout/Layout";
import socketInstance from "../../socket";
import AuthService from "../../services/AuthService";
import Peer from "simple-peer";
import Calling from "../Calling/Calling";

const Dashboard = () => {
  const socket = socketInstance.getSocket();
  const userData = AuthService.getUserData();

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState("");

  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
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

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("get-online-users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("callToUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerName(data.name);
      setCallerSignal(data.signal);
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      connectionRef.current.signal(signal);
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
      socket.off("me");
      socket.off("get-online-users");
      socket.off("callToUser");
      socket.off("callAccepted");
      socket.off("connect", sendJoin);
    };
  }, []);

  const callToUser = (userId) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callToUser", {
        callToUserId: userId,
        signalData: data,
        from: me,
        name: userData.name,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    setReceivingCall(false);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", {
        signal: data,
        to: caller,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const rejectCall = () => {
    setReceivingCall(false);
    setCaller("");
    setCallerName("");
    setCallerSignal(null);
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
            {callAccepted ? (
              <video
                ref={userVideo}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-gray-400 text-sm">Waiting for connection...</p>
            )}
          </div>
        </div>
      </div>

      {receivingCall && !callAccepted && (
        <Calling
          callerName={callerName}
          onAnswer={answerCall}
          onReject={rejectCall}
        />
      )}
    </Layout>
  );
};

export default Dashboard;