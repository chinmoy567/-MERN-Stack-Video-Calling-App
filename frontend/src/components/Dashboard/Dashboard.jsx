import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Layout from "../Layouts/Layout/Layout";
import socketInstance from "../../socket";
import AuthService from "../../services/AuthService";
import Peer from "simple-peer";
import Calling from "../Calling/Calling";
import { MdCallEnd } from "react-icons/md";

/**
 * No short timers on first calls — Chrome’s permission dialog keeps getUserMedia pending.
 *
 * Many Windows + Logitech setups fail { video: true, audio: true } (AbortError / NotReadableError)
 * but succeed when microphone and camera are requested separately and merged.
 */
async function acquireLocalMedia() {
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) {
    throw new DOMException("Use HTTPS or localhost for camera/microphone.", "NotSupportedError");
  }

  try {
    return await md.getUserMedia({ video: true, audio: true });
  } catch (e) {
    console.warn("getUserMedia video+audio:", e?.name, e?.message);
  }

  let audioStream = null;
  try {
    audioStream = await md.getUserMedia({ video: false, audio: true });
  } catch (e) {
    console.warn("getUserMedia audio-only:", e?.name, e?.message);
  }

  const mergeVideoInto = (aStream, videoConstraints) => {
    return (async () => {
      const vStream = await md.getUserMedia(videoConstraints);
      return new MediaStream([...aStream.getAudioTracks(), ...vStream.getVideoTracks()]);
    })();
  };

  if (audioStream) {
    const videoLegAttempts = [
      { video: true, audio: false },
      {
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 30 } },
        audio: false,
      },
      {
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      },
      { video: { frameRate: { max: 15 } }, audio: false },
    ];

    for (const constraints of videoLegAttempts) {
      try {
        return await mergeVideoInto(audioStream, constraints);
      } catch (e) {
        console.warn("split merge video leg failed:", e?.name, e?.message);
      }
    }

    try {
      const devices = await md.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput" && d.deviceId);
      for (const cam of cams.slice(0, 3)) {
        try {
          return await mergeVideoInto(audioStream, {
            video: { deviceId: { exact: cam.deviceId } },
            audio: false,
          });
        } catch (e) {
          console.warn("split merge deviceId failed:", cam.label, e?.name, e?.message);
        }
      }
    } catch (e) {
      console.warn("enumerateDevices:", e);
    }

    return audioStream;
  }

  try {
    return await md.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 24 } },
      audio: true,
    });
  } catch (e) {
    console.warn("getUserMedia 640p+audio:", e?.name, e?.message);
  }

  try {
    return await md.getUserMedia({
      video: { width: { ideal: 320 }, height: { ideal: 240 } },
      audio: true,
    });
  } catch (e) {
    console.warn("getUserMedia 240p+audio:", e?.name, e?.message);
  }

  return md.getUserMedia({ video: true, audio: false });
}

function formatMediaError(e) {
  if (e?.name === "NotAllowedError") {
    return "Access was blocked. Click the camera icon in the address bar or use Retry and choose Allow.";
  }
  const msg = String(e?.message || "");
  if (
    e?.name === "NotReadableError" ||
    /could not start video|in use|busy|being used|another application/i.test(msg)
  ) {
    return "Your webcam can only be used by one app at a time on Windows. Hang up or fully close WhatsApp video, Zoom, Teams, or the Windows Camera app, then click Retry below.";
  }
  if (e?.name === "AbortError" || /Timeout starting video/i.test(msg)) {
    return "The camera did not start in time — often because another app is using it. Close other video apps, then Retry.";
  }
  return msg || "Could not access camera or microphone.";
}

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

  const [callInitiated, setCallInitiated] = useState(false);
  const [callingToName, setCallingToName] = useState("");

  const [callNotice, setCallNotice] = useState(null);

  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  const [mediaRetryKey, setMediaRetryKey] = useState(0);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const activeStreamRef = useRef(null);
  const mediaLoadGenRef = useRef(0);
  const callingToNameRef = useRef("");
  const outgoingPeerUserIdRef = useRef(null);

  useEffect(() => {
    callingToNameRef.current = callingToName;
  }, [callingToName]);

  useEffect(() => {
    if (!callNotice) return;
    const t = setTimeout(() => setCallNotice(null), 6000);
    return () => clearTimeout(t);
  }, [callNotice]);

  const clearCallState = useCallback(() => {
    if (connectionRef.current) {
      try {
        connectionRef.current.destroy();
      } catch (_) {
        /* noop */
      }
      connectionRef.current = null;
    }
    if (userVideo.current) userVideo.current.srcObject = null;
    setCallAccepted(false);
    setCallInitiated(false);
    setReceivingCall(false);
    setCallingToName("");
    setCaller("");
    setCallerName("");
    setCallerSignal(null);
    outgoingPeerUserIdRef.current = null;
  }, []);

  useLayoutEffect(() => {
    const el = myVideo.current;
    if (!el || !stream) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    el.play().catch(() => {});
  }, [stream]);

  useEffect(() => {
    const myGen = ++mediaLoadGenRef.current;
    let timerId;

    setMediaLoading(true);
    setMediaError(null);

    // Defer with setTimeout(0) so StrictMode's synchronous cleanup can cancel
    // the timer before getUserMedia is ever called — preventing two concurrent
    // camera requests (which causes NotReadableError on Windows).
    timerId = setTimeout(async () => {
      if (myGen !== mediaLoadGenRef.current) return;

      try {
        const s = await acquireLocalMedia();
        if (myGen !== mediaLoadGenRef.current) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        activeStreamRef.current = s;
        setStream(s);
        setMediaLoading(false);
      } catch (e) {
        console.error("Camera/Mic error:", e);
        if (myGen !== mediaLoadGenRef.current) return;
        setMediaLoading(false);
        setMediaError(formatMediaError(e));
      }
    }, 0);

    return () => {
      clearTimeout(timerId);
      mediaLoadGenRef.current += 1;
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
        activeStreamRef.current = null;
      }
      setStream(null);
    };
  }, [mediaRetryKey]);

  useEffect(() => {
    if (!socket || !userData) return;

    socket.on("me", (id) => setMe(id));
    socket.on("get-online-users", (users) => setOnlineUsers(users));

    socket.on("callToUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerName(data.name);
      setCallerSignal(data.signal);
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      setCallInitiated(false);
      if (connectionRef.current) connectionRef.current.signal(signal);
    });

    socket.on("callRejected", () => {
      if (connectionRef.current) {
        connectionRef.current.destroy();
        connectionRef.current = null;
      }
      setCallInitiated(false);
      setCallingToName("");
      outgoingPeerUserIdRef.current = null;
      const name = callingToNameRef.current || "User";
      setCallNotice(`${name} declined the call.`);
    });

    socket.on("callFailed", () => {
      if (connectionRef.current) {
        try {
          connectionRef.current.destroy();
        } catch (_) {
          /* noop */
        }
        connectionRef.current = null;
      }
      setCallInitiated(false);
      setCallingToName("");
      outgoingPeerUserIdRef.current = null;
      setCallNotice("That user is offline or unavailable.");
    });

    socket.on("incomingCallCanceled", () => {
      setReceivingCall(false);
      setCaller("");
      setCallerName("");
      setCallerSignal(null);
      setCallNotice("The caller canceled.");
    });

    socket.on("callEnded", () => {
      clearCallState();
      setCallNotice("The call ended.");
    });

    const sendJoin = () =>
      socket.emit("join", { id: userData._id, name: userData.name });

    if (socket.connected) sendJoin();
    else socket.once("connect", sendJoin);

    return () => {
      socket.off("me");
      socket.off("get-online-users");
      socket.off("callToUser");
      socket.off("callAccepted");
      socket.off("callRejected");
      socket.off("callFailed");
      socket.off("incomingCallCanceled");
      socket.off("callEnded");
      socket.off("connect", sendJoin);
    };
  }, [socket, userData, clearCallState]);

  const hasVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks().some((t) => t.readyState !== "ended");

  const callToUser = useCallback((userId, userName) => {
    if (!stream) {
      setCallNotice("Camera/microphone is not ready yet.");
      return;
    }
    if (!me) {
      setCallNotice("Connecting to server — try again in a moment.");
      return;
    }

    outgoingPeerUserIdRef.current = userId;

    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("callToUser", {
        callToUserId: userId,
        signalData: data,
        from: me,
        name: userData.name,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    peer.on("close", () => {
      clearCallState();
    });

    connectionRef.current = peer;
    setCallInitiated(true);
    setCallingToName(userName || "User");
  }, [socket, stream, me, userData, clearCallState]);

  const answerCall = () => {
    setCallAccepted(true);
    setReceivingCall(false);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    peer.on("close", () => {
      clearCallState();
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const rejectCall = () => {
    socket.emit("rejectCall", { to: caller });
    setReceivingCall(false);
    setCaller("");
    setCallerName("");
    setCallerSignal(null);
  };

  const cancelOutgoingCall = () => {
    if (outgoingPeerUserIdRef.current) {
      socket.emit("cancelOutgoingCall", { toUserId: outgoingPeerUserIdRef.current });
    }
    if (connectionRef.current) {
      try {
        connectionRef.current.destroy();
      } catch (_) {
        /* noop */
      }
      connectionRef.current = null;
    }
    setCallInitiated(false);
    setCallingToName("");
    outgoingPeerUserIdRef.current = null;
  };

  const hangUp = () => {
    if (callAccepted) {
      if (outgoingPeerUserIdRef.current) {
        socket.emit("endCall", { toUserId: outgoingPeerUserIdRef.current });
      } else if (caller) {
        socket.emit("endCall", { toSocketId: caller });
      }
    }
    clearCallState();
    setCallNotice("You ended the call.");
  };

  return (
    <Layout onlineUsers={onlineUsers} callToUser={callToUser}>
      <h2 className="text-xl text-gray-700 bg-white p-4 rounded shadow mb-4">
        Welcome to Dashboard
      </h2>

      {callNotice && (
        <div
          className="mb-4 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm"
          role="status"
        >
          {callNotice}
        </div>
      )}

      {mediaLoading && (
        <p className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
          <strong>Camera permission:</strong> if Chrome shows a prompt for localhost, choose{" "}
          <strong>Allow while visiting the site</strong> (or <strong>Allow this time</strong>). The preview can stay
          black until you allow — that is normal.
        </p>
      )}

      {mediaError && (
        <div className="mb-4 space-y-2">
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{mediaError}</p>
          <button
            type="button"
            onClick={() => setMediaRetryKey((k) => k + 1)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
          >
            Retry camera &amp; microphone
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col items-center">
          <h4 className="text-gray-700 font-semibold mb-2">Your Camera</h4>
          <div className="w-72 h-48 bg-black rounded-lg overflow-hidden border-2 border-blue-500">
            <video ref={myVideo} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          {!mediaError && stream && !hasVideoTrack && (
            <div className="mt-2 max-w-72 text-center space-y-2">
              <p className="text-amber-800 text-sm">
                No camera video — microphone only. Voice calls still work.
              </p>
              <p className="text-gray-600 text-xs">
                If WhatsApp (or Zoom / Teams) is in a video call, it may hold the camera — then Chrome cannot show video
                here, and WhatsApp may say “camera used by another app” if Chrome grabbed it first. Use one app at a time,
                or plug in a second camera. Also check Windows Settings → Privacy → Camera for Chrome.
              </p>
              <button
                type="button"
                onClick={() => setMediaRetryKey((k) => k + 1)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
              >
                Try camera again
              </button>
            </div>
          )}
          {!stream && !mediaError && mediaLoading && (
            <p className="text-gray-600 text-sm mt-2">Waiting for permission or device…</p>
          )}
          {!stream && !mediaError && !mediaLoading && (
            <p className="text-gray-500 text-sm mt-2">Starting…</p>
          )}
        </div>

        <div className="flex flex-col items-center">
          <h4 className="text-gray-700 font-semibold mb-2">Remote Camera</h4>
          <div className="w-72 h-48 bg-black rounded-lg overflow-hidden border-2 border-gray-500 flex items-center justify-center">
            {callAccepted ? (
              <video ref={userVideo} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <p className="text-gray-400 text-sm">Waiting for connection...</p>
            )}
          </div>
        </div>
      </div>

      {callAccepted && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-gray-700 bg-gray-900 px-6 py-3 text-white shadow-2xl">
          <span className="max-w-[220px] truncate text-sm text-gray-300">
            {outgoingPeerUserIdRef.current ? `In call with ${callingToName}` : callerName ? `In call with ${callerName}` : "In call"}
          </span>
          <button
            type="button"
            onClick={hangUp}
            className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-500"
          >
            <MdCallEnd size={20} />
            End call
          </button>
        </div>
      )}

      {callInitiated && !callAccepted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 text-white rounded-3xl shadow-2xl w-72 p-6 flex flex-col items-center gap-4 animate-slideFade">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold border-4 border-blue-400">
              {callingToName.charAt(0).toUpperCase()}
            </div>
            <p className="text-gray-400 text-sm uppercase tracking-widest">Calling…</p>
            <h2 className="text-xl font-bold">{callingToName}</h2>
            <button
              type="button"
              onClick={cancelOutgoingCall}
              className="mt-2 w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition hover:scale-110"
            >
              <span className="text-2xl">✕</span>
            </button>
            <span className="text-xs text-gray-400">Cancel</span>
          </div>
        </div>
      )}

      {receivingCall && !callAccepted && (
        <Calling callerName={callerName} onAnswer={answerCall} onReject={rejectCall} />
      )}
    </Layout>
  );
};

export default Dashboard;
