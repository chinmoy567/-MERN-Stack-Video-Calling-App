import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "../Layouts/Layout/Layout";
import socketInstance from "../../socket";
import AuthService, { ACCESS_TOKEN_UPDATED } from "../../services/AuthService";
import Peer from "simple-peer";
import Calling from "../Calling/Calling";
import { MdCallEnd } from "react-icons/md";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Per-attempt timeout so a hanging camera driver doesn't freeze the whole chain.
// 8 s is enough for even a slow device; Chrome usually rejects bad constraints in < 2 s.
const ATTEMPT_TIMEOUT_MS = 8000;

function gum(constraints) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new DOMException("getUserMedia timed out.", "TimeoutError")),
      ATTEMPT_TIMEOUT_MS
    );
    navigator.mediaDevices.getUserMedia(constraints).then(
      (s) => { clearTimeout(t); resolve(s); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

/**
 * Prefer microphone first, then add camera — avoids Chrome on Windows aborting with
 * "AbortError: Timeout starting video source" on the common first call { video:true, audio:true }.
 * Each getUserMedia call has its own 8 s timeout so a hung driver doesn't block indefinitely.
 */
async function acquireLocalMedia() {
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) {
    throw new DOMException("Use HTTPS or localhost for camera/microphone.", "NotSupportedError");
  }

  const mergeVideoInto = async (aStream, videoConstraints) => {
    const vStream = await gum(videoConstraints);
    return new MediaStream([...aStream.getAudioTracks(), ...vStream.getVideoTracks()]);
  };

  let audioStream = null;
  try {
    audioStream = await gum({ video: false, audio: true });
  } catch (e) {
    console.warn("getUserMedia audio-only:", e?.name, e?.message);
  }

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

    // All video attempts failed — return audio-only so voice calls still work
    return audioStream;
  }

  // No audio stream — try combined fallbacks
  for (const constraints of [
    { video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 24 } }, audio: true },
    { video: { width: { ideal: 320 }, height: { ideal: 240 } }, audio: true },
    { video: true, audio: true },
    { video: false, audio: true },
    { video: true, audio: false },
  ]) {
    try {
      return await gum(constraints);
    } catch (e) {
      console.warn("getUserMedia fallback failed:", JSON.stringify(constraints), e?.name, e?.message);
    }
  }

  throw new DOMException("Could not access any camera or microphone.", "NotFoundError");
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
  if (e?.name === "NotSupportedError" || /HTTPS|secure/i.test(msg)) {
    return "Camera and microphone need a secure context. Use https:// in production or http://localhost for development.";
  }
  if (e?.name === "TimeoutError") {
    return "No response from camera or microphone in time. Make sure no other app (Zoom, Teams, WhatsApp) is using the camera, then click Retry below.";
  }
  if (e?.name === "NotFoundError") {
    return "No camera or microphone found. Plug in a device and click Retry below.";
  }
  return msg || "Could not access camera or microphone.";
}

const MEDIA_WAIT_MS = 20000;

function withMediaTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new DOMException("Camera or microphone did not respond in time.", "TimeoutError"));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function createPeer(opts) {
  return new Peer({
    initiator: opts.initiator,
    trickle: false,
    stream: opts.stream,
    config: ICE_SERVERS,
  });
}

const Dashboard = () => {
  const user = AuthService.getUserData();
  // Stable primitives for effect deps — getUserData() returns a new object every render (JSON.parse),
  // so putting that object in useEffect deps caused an infinite re-render loop.
  const joinId = user?._id != null ? String(user._id) : null;
  const joinName = user?.name ?? "";

  const [socketKey, setSocketKey] = useState(0);

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
  const [socketError, setSocketError] = useState(null);

  /** Browsers often block or never show the permission prompt unless getUserMedia runs from a click. */
  const [mediaStarted, setMediaStarted] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [mediaRetryKey, setMediaRetryKey] = useState(0);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const activeStreamRef = useRef(null);
  const mediaLoadGenRef = useRef(0);
  const callingToNameRef = useRef("");
  const outgoingPeerUserIdRef = useRef(null);

  const receivingCallRef = useRef(false);
  const callInitiatedRef = useRef(false);
  const callAcceptedRef = useRef(false);

  useEffect(() => {
    receivingCallRef.current = receivingCall;
  }, [receivingCall]);
  useEffect(() => {
    callInitiatedRef.current = callInitiated;
  }, [callInitiated]);
  useEffect(() => {
    callAcceptedRef.current = callAccepted;
  }, [callAccepted]);

  useEffect(() => {
    const onTokenRefresh = () => setSocketKey((k) => k + 1);
    window.addEventListener(ACCESS_TOKEN_UPDATED, onTokenRefresh);
    return () => window.removeEventListener(ACCESS_TOKEN_UPDATED, onTokenRefresh);
  }, []);

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
    if (!mediaStarted) {
      return undefined;
    }

    const myGen = ++mediaLoadGenRef.current;

    setMediaLoading(true);
    setMediaError(null);

    (async () => {
      try {
        const s = await withMediaTimeout(acquireLocalMedia(), MEDIA_WAIT_MS);
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
    })();

    return () => {
      mediaLoadGenRef.current += 1;
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
        activeStreamRef.current = null;
      }
      setStream(null);
    };
  }, [mediaStarted, mediaRetryKey]);

  const isInCallFlow = () =>
    !!(
      connectionRef.current ||
      receivingCallRef.current ||
      callInitiatedRef.current ||
      callAcceptedRef.current
    );

  useEffect(() => {
    if (!joinId) return;

    const s = socketInstance.getSocket();
    if (!s) {
      setSocketError("Not connected — sign in again.");
      return;
    }

    setSocketError(null);

    const onConnectError = (err) => {
      console.warn("Socket connect_error:", err?.message);
      setSocketError(
        "Real-time connection failed. Try refreshing the page. If you were idle a long time, sign out and sign in again."
      );
    };

    s.on("connect_error", onConnectError);

    s.on("me", (id) => setMe(id));
    s.on("get-online-users", (users) => setOnlineUsers(users));

    s.on("callToUser", (data) => {
      if (isInCallFlow()) {
        s.emit("busyCall", { to: data.from });
        return;
      }
      setReceivingCall(true);
      setCaller(data.from);
      setCallerName(data.name);
      setCallerSignal(data.signal);
    });

    s.on("callAccepted", (signal) => {
      setCallAccepted(true);
      setCallInitiated(false);
      if (connectionRef.current) connectionRef.current.signal(signal);
    });

    s.on("callRejected", () => {
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

    s.on("callFailed", (payload) => {
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
      if (payload?.reason === "busy") {
        setCallNotice("That user is on another call.");
      } else {
        setCallNotice("That user is offline or unavailable.");
      }
    });

    s.on("incomingCallCanceled", () => {
      setReceivingCall(false);
      setCaller("");
      setCallerName("");
      setCallerSignal(null);
      setCallNotice("The caller canceled.");
    });

    s.on("callEnded", () => {
      clearCallState();
      setCallNotice("The call ended.");
    });

    const sendJoin = () => s.emit("join", { id: joinId, name: joinName });

    if (s.connected) sendJoin();
    else s.once("connect", sendJoin);

    return () => {
      s.off("connect_error", onConnectError);
      s.off("me");
      s.off("get-online-users");
      s.off("callToUser");
      s.off("callAccepted");
      s.off("callRejected");
      s.off("callFailed");
      s.off("incomingCallCanceled");
      s.off("callEnded");
      s.off("connect", sendJoin);
    };
  }, [socketKey, joinId, joinName, clearCallState]);

  const hasVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks().some((t) => t.readyState !== "ended");

  const callToUser = (userId, userName) => {
    if (!joinId) return;
    if (!stream) {
      setCallNotice("Camera/microphone is not ready yet.");
      return;
    }
    if (!me) {
      setCallNotice("Connecting to server — try again in a moment.");
      return;
    }
    if (isInCallFlow()) {
      setCallNotice("Finish your current call before starting another.");
      return;
    }

    outgoingPeerUserIdRef.current = userId;

    const peer = createPeer({ initiator: true, stream });

    peer.on("signal", (data) => {
      const sock = socketInstance.getSocket();
      if (!sock) return;
      sock.emit("callToUser", {
        callToUserId: userId,
        signalData: data,
        from: me,
        name: joinName,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    peer.on("error", (err) => {
      console.error("Peer error (outgoing):", err);
      setCallNotice("Connection error — try again.");
      clearCallState();
    });

    peer.on("close", () => {
      clearCallState();
    });

    connectionRef.current = peer;
    setCallInitiated(true);
    setCallingToName(userName || "User");
  };

  const answerCall = () => {
    if (!joinId || !stream) return;
    setCallAccepted(true);
    setReceivingCall(false);

    const peer = createPeer({ initiator: false, stream });

    peer.on("signal", (data) => {
      const sock = socketInstance.getSocket();
      if (!sock) return;
      sock.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    peer.on("error", (err) => {
      console.error("Peer error (answer):", err);
      setCallNotice("Connection error — try again.");
      clearCallState();
    });

    peer.on("close", () => {
      clearCallState();
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const rejectCall = () => {
    const sock = socketInstance.getSocket();
    if (sock) sock.emit("rejectCall", { to: caller });
    setReceivingCall(false);
    setCaller("");
    setCallerName("");
    setCallerSignal(null);
  };

  const cancelOutgoingCall = () => {
    const sock = socketInstance.getSocket();
    if (outgoingPeerUserIdRef.current && sock) {
      sock.emit("cancelOutgoingCall", { toUserId: outgoingPeerUserIdRef.current });
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
    const sock = socketInstance.getSocket();
    if (callAccepted && sock) {
      if (outgoingPeerUserIdRef.current) {
        sock.emit("endCall", { toUserId: outgoingPeerUserIdRef.current });
      } else if (caller) {
        sock.emit("endCall", { toSocketId: caller });
      }
    }
    clearCallState();
    setCallNotice("You ended the call.");
  };

  if (!joinId) {
    return <Navigate to="/login" replace />;
  }

  const startMedia = () => {
    setMediaError(null);
    setMediaStarted(true);
  };

  const retryMedia = () => {
    setMediaError(null);
    setMediaStarted(true);
    setMediaRetryKey((k) => k + 1);
  };

  return (
    <Layout onlineUsers={onlineUsers} callToUser={callToUser}>
      <h2 className="text-xl text-gray-700 bg-white p-4 rounded shadow mb-4">
        Welcome to Dashboard
      </h2>

      {socketError && (
        <div
          className="mb-4 px-4 py-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm"
          role="alert"
        >
          {socketError}
        </div>
      )}

      {callNotice && (
        <div
          className="mb-4 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm"
          role="status"
        >
          {callNotice}
        </div>
      )}

      {!mediaStarted && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-800 text-sm mb-3">
            <strong>Enable your camera and microphone.</strong> Chrome often will not show a permission prompt until you
            click a button on this page (a security rule). Use the button below, then choose{" "}
            <strong>Allow</strong> when asked.
          </p>
          <button
            type="button"
            onClick={startMedia}
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-700 transition"
          >
            Start camera &amp; microphone
          </button>
        </div>
      )}

      {mediaStarted && mediaLoading && (
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
            onClick={retryMedia}
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
                here, and WhatsApp may say "camera used by another app" if Chrome grabbed it first. Use one app at a time,
                or plug in a second camera. Also check Windows Settings → Privacy → Camera for Chrome.
              </p>
              <button
                type="button"
                onClick={retryMedia}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
              >
                Try camera again
              </button>
            </div>
          )}
          {mediaStarted && !stream && !mediaError && mediaLoading && (
            <p className="text-gray-600 text-sm mt-2">Waiting for permission or device…</p>
          )}
          {!mediaStarted && (
            <p className="text-gray-500 text-sm mt-2 text-center max-w-72">
              Tap <strong>Start camera &amp; microphone</strong> above to begin.
            </p>
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
