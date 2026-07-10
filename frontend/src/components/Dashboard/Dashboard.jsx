import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import socketInstance from "../../socket";
import AuthService, { ACCESS_TOKEN_UPDATED } from "../../services/AuthService";
import Peer from "simple-peer";
import Calling from "../Calling/Calling";
import Sidebar from "../Layouts/Sidebar/Sidebar";
import ChatWindow from "../Chat/ChatWindow";
import { MdCallEnd, MdMic, MdMenu, MdClose } from "react-icons/md";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const ATTEMPT_TIMEOUT_MS = 20000;

function gum(constraints) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new DOMException("getUserMedia timed out.", "TimeoutError")),
      ATTEMPT_TIMEOUT_MS
    );
    navigator.mediaDevices.getUserMedia(constraints).then(
      (s) => {
        clearTimeout(t);
        resolve(s);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function acquireLocalMedia(audioOnly = false) {
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) {
    throw new DOMException(
      "Use HTTPS or localhost for camera/microphone.",
      "NotSupportedError"
    );
  }

  if (audioOnly) {
    return gum({ video: false, audio: true });
  }

  const mergeVideoInto = async (aStream, videoConstraints) => {
    const vStream = await gum(videoConstraints);
    return new MediaStream([
      ...aStream.getAudioTracks(),
      ...vStream.getVideoTracks(),
    ]);
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
      { video: { width: { ideal: 320 }, height: { ideal: 240 } }, audio: false },
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
          console.warn("split merge deviceId failed:", cam.label, e?.name);
        }
      }
    } catch (e) {
      console.warn("enumerateDevices:", e);
    }

    return audioStream;
  }

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
      console.warn("getUserMedia fallback failed:", e?.name, e?.message);
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
    return "Your webcam can only be used by one app at a time. Close other video apps (Zoom, Teams, WhatsApp), then Retry.";
  }
  if (e?.name === "AbortError" || /Timeout starting video/i.test(msg)) {
    return "The camera did not start in time — often because another app is using it. Close other video apps, then Retry.";
  }
  if (e?.name === "NotSupportedError" || /HTTPS|secure/i.test(msg)) {
    return "Camera and microphone need a secure context (https or localhost).";
  }
  if (e?.name === "TimeoutError") {
    return "No response from camera or microphone in time. Close other video apps, then Retry.";
  }
  if (e?.name === "NotFoundError") {
    return "No camera or microphone found. Plug in a device and Retry.";
  }
  return msg || "Could not access camera or microphone.";
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
  const joinId = user?._id != null ? String(user._id) : null;
  const joinName = user?.name ?? "";

  const [socketKey, setSocketKey] = useState(0);

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [listError, setListError] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  const [callType, setCallType] = useState("video"); // "video" | "audio" — current/incoming call kind
  const [incomingCallType, setIncomingCallType] = useState("video");

  const [mediaStarted, setMediaStarted] = useState(false);
  const mediaAudioOnlyRef = useRef(false);
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
  const pendingCallRef = useRef(null); // {userId, userName, callType} — call requested before media ready

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
    callingToNameRef.current = callingToName;
  }, [callingToName]);

  useEffect(() => {
    const onTokenRefresh = () => setSocketKey((k) => k + 1);
    window.addEventListener(ACCESS_TOKEN_UPDATED, onTokenRefresh);
    return () => window.removeEventListener(ACCESS_TOKEN_UPDATED, onTokenRefresh);
  }, []);

  useEffect(() => {
    if (!callNotice) return;
    const t = setTimeout(() => setCallNotice(null), 6000);
    return () => clearTimeout(t);
  }, [callNotice]);

  // Load contacts + conversation previews.
  const loadConversations = useCallback(() => {
    AuthService.getConversations()
      .then((res) => setConversations(res.data?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    AuthService.getAllUsers()
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success) setUsers(res.data.data || []);
      })
      .catch((e) => {
        if (cancelled) return;
        setListError(
          e.response?.data?.msg || e.message || "Could not load contacts."
        );
      });
    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [loadConversations]);

  const clearCallState = useCallback(() => {
    if (connectionRef.current) {
      try {
        connectionRef.current.destroy();
      } catch {
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
    setCallType("video");
    mediaAudioOnlyRef.current = false;
    outgoingPeerUserIdRef.current = null;
  }, []);

  useLayoutEffect(() => {
    const el = myVideo.current;
    if (!el || !stream) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    el.play().catch(() => {});
  }, [stream, callAccepted, callInitiated, receivingCall]);

  // Acquire media when started/retried.
  useEffect(() => {
    if (!mediaStarted) return undefined;
    const myGen = ++mediaLoadGenRef.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMediaLoading(true);
    setMediaError(null);

    (async () => {
      try {
        const s = await acquireLocalMedia(mediaAudioOnlyRef.current);
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

  const startOutgoingCall = useCallback(
    (userId, userName, activeStream, type = "video") => {
      outgoingPeerUserIdRef.current = userId;
      setCallType(type);
      const peer = createPeer({ initiator: true, stream: activeStream });

      peer.on("signal", (data) => {
        const sock = socketInstance.getSocket();
        if (!sock) return;
        sock.emit("callToUser", {
          callToUserId: userId,
          signalData: data,
          from: me,
          name: joinName,
          callType: type,
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
      peer.on("close", () => clearCallState());

      connectionRef.current = peer;
      setCallInitiated(true);
      setCallingToName(userName || "User");
    },
    [me, joinName, clearCallState]
  );

  // When media becomes ready and a call was queued, start it.
  useEffect(() => {
    if (stream && pendingCallRef.current) {
      const { userId, userName, callType: pendingType } = pendingCallRef.current;
      pendingCallRef.current = null;
      if (me) startOutgoingCall(userId, userName, stream, pendingType);
    }
  }, [stream, me, startOutgoingCall]);

  // Socket wiring for calls + presence.
  useEffect(() => {
    if (!joinId) return;
    const s = socketInstance.getSocket();
    if (!s) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocketError("Not connected — sign in again.");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocketError(null);

    const onConnectError = (err) => {
      console.warn("Socket connect_error:", err?.message);
      setSocketError(
        "Real-time connection failed. Try refreshing the page or sign out and in again."
      );
    };

    s.on("connect_error", onConnectError);
    s.on("me", (id) => setMe(id));
    s.on("get-online-users", (u) => setOnlineUsers(u));

    s.on("callToUser", (data) => {
      if (isInCallFlow()) {
        s.emit("busyCall", { to: data.from });
        return;
      }
      setReceivingCall(true);
      setCaller(data.from);
      setCallerName(data.name);
      setCallerSignal(data.signal);
      setIncomingCallType(data.callType === "audio" ? "audio" : "video");
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
        } catch {
          /* noop */
        }
        connectionRef.current = null;
      }
      setCallInitiated(false);
      setCallingToName("");
      outgoingPeerUserIdRef.current = null;
      setCallNotice(
        payload?.reason === "busy"
          ? "That user is on another call."
          : "That user is offline or unavailable."
      );
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

    // Refresh conversation previews when any message arrives.
    const onAnyMessage = () => loadConversations();
    s.on("receive-message", onAnyMessage);

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
      s.off("receive-message", onAnyMessage);
      s.off("connect", sendJoin);
    };
  }, [socketKey, joinId, joinName, clearCallState, loadConversations]);

  const hasVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks().some((t) => t.readyState !== "ended");

  // Called from chat header / sidebar. Ensures media is running first.
  const callToUser = useCallback(
    (userId, userName, type = "video") => {
      if (!me) {
        setCallNotice("Connecting to server — try again in a moment.");
        return;
      }
      if (isInCallFlow()) {
        setCallNotice("Finish your current call before starting another.");
        return;
      }
      setCallType(type);
      if (stream) {
        startOutgoingCall(userId, userName, stream, type);
      } else {
        // Queue the call and start media (browsers need a user gesture — this is one).
        pendingCallRef.current = { userId, userName, callType: type };
        mediaAudioOnlyRef.current = type === "audio";
        setCallingToName(userName || "User");
        setCallInitiated(true);
        setMediaError(null);
        setMediaStarted(true);
      }
    },
    [me, stream, startOutgoingCall]
  );

  const answerCall = () => {
    if (!joinId) return;
    if (!stream) {
      // Start media, then this function is effectively retried by the user.
      mediaAudioOnlyRef.current = incomingCallType === "audio";
      setCallType(incomingCallType);
      setMediaStarted(true);
      setCallNotice(
        incomingCallType === "audio"
          ? "Starting microphone… tap Answer again once ready."
          : "Starting camera… tap Answer again once the preview appears."
      );
      return;
    }
    setCallType(incomingCallType);
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
    peer.on("close", () => clearCallState());
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
      } catch {
        /* noop */
      }
      connectionRef.current = null;
    }
    pendingCallRef.current = null;
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

  const retryMedia = () => {
    setMediaError(null);
    setMediaStarted(true);
    setMediaRetryKey((k) => k + 1);
  };

  if (!joinId) return <Navigate to="/login" replace />;

  const callActive = callAccepted || callInitiated || receivingCall;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Sidebar — desktop */}
      <aside className="hidden w-80 shrink-0 border-r border-slate-800 lg:block">
        <Sidebar
          users={users}
          onlineUsers={onlineUsers}
          conversations={conversations}
          selectedId={selectedContact?._id}
          onSelect={setSelectedContact}
          listError={listError}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-80 shadow-2xl">
            <Sidebar
              users={users}
              onlineUsers={onlineUsers}
              conversations={conversations}
              selectedId={selectedContact?._id}
              onSelect={(u) => {
                setSelectedContact(u);
                setMobileSidebarOpen(false);
              }}
              listError={listError}
            />
          </aside>
        </div>
      )}

      {/* Main panel: chat, with call overlay */}
      <main className="relative flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle contacts"
          >
            {mobileSidebarOpen ? <MdClose size={20} /> : <MdMenu size={20} />}
          </button>
          <span className="text-sm font-semibold text-slate-700">
            {selectedContact?.name || "Chats"}
          </span>
        </div>

        {(socketError || callNotice) && (
          <div className="absolute left-1/2 top-3 z-30 w-[90%] max-w-md -translate-x-1/2 space-y-2">
            {socketError && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow">
                {socketError}
              </div>
            )}
            {callNotice && (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow">
                {callNotice}
              </div>
            )}
          </div>
        )}

        <ChatWindow
          me={joinId}
          contact={selectedContact}
          onStartCall={callToUser}
          onMessageActivity={loadConversations}
        />

        {/* ── Call overlay ─────────────────────────────────────────── */}
        {callActive && (
          <div className="absolute inset-0 z-40 flex flex-col overflow-y-auto bg-slate-900/95 p-4 backdrop-blur-sm sm:p-6">
            {mediaError && (
              <div className="mx-auto mb-3 w-full max-w-lg space-y-2">
                <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {mediaError}
                </p>
                <button
                  type="button"
                  onClick={retryMedia}
                  className="text-sm font-medium text-blue-300 underline"
                >
                  Retry camera &amp; microphone
                </button>
              </div>
            )}

            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4 sm:flex-row sm:flex-wrap">
              <div className="flex w-full max-w-xs flex-col items-center sm:w-80">
                <h4 className="mb-2 font-semibold text-slate-200">You</h4>
                <div className="glass-card tilt-card relative aspect-video w-full overflow-hidden !rounded-xl border-2 border-indigo-500/70 bg-black [perspective:1000px] sm:h-64 sm:aspect-auto">
                  <video
                    ref={myVideo}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  {callType === "audio" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800">
                      <MdMic size={40} className="text-indigo-400" />
                      <span className="text-xs text-slate-300">Audio call</span>
                    </div>
                  )}
                </div>
                {callType !== "audio" && stream && !hasVideoTrack && (
                  <p className="mt-2 max-w-80 text-center text-xs text-amber-300">
                    No camera video — microphone only. Voice still works.
                  </p>
                )}
                {mediaLoading && (
                  <p className="mt-2 text-center text-sm text-slate-300">
                    {callType === "audio"
                      ? "Starting microphone… choose "
                      : "Starting camera… choose "}
                    <strong>Allow</strong> if prompted.
                  </p>
                )}
              </div>

              <div className="flex w-full max-w-xs flex-col items-center sm:w-80">
                <h4 className="mb-2 truncate font-semibold text-slate-200">
                  {callAccepted
                    ? callingToName || callerName || "Remote"
                    : "Remote"}
                </h4>
                <div className="glass-card relative flex aspect-video w-full items-center justify-center overflow-hidden !rounded-xl border-2 border-slate-600 bg-black sm:h-64 sm:aspect-auto">
                  {callAccepted ? (
                    <>
                      <video
                        ref={userVideo}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                      />
                      {callType === "audio" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800">
                          <MdMic size={40} className="text-indigo-400" />
                          <span className="text-xs text-slate-300">Audio call</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">
                      {callInitiated ? "Ringing…" : "Waiting…"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 pb-2 pt-4">
              {callAccepted && (
                <button
                  type="button"
                  onClick={hangUp}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-950/50 transition hover:from-red-500 hover:to-rose-500"
                >
                  <MdCallEnd size={20} /> End call
                </button>
              )}
              {callInitiated && !callAccepted && (
                <button
                  type="button"
                  onClick={cancelOutgoingCall}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-950/50 transition hover:from-red-500 hover:to-rose-500"
                >
                  <MdCallEnd size={20} /> Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Incoming call prompt (over everything) */}
        {receivingCall && !callAccepted && (
          <Calling
            callerName={callerName}
            callType={incomingCallType}
            onAnswer={answerCall}
            onReject={rejectCall}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
