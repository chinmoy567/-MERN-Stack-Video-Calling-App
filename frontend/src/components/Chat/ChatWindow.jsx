import { useCallback, useEffect, useRef, useState } from "react";
import { MdVideocam, MdSend } from "react-icons/md";
import AuthService from "../../services/AuthService";
import socketInstance from "../../socket";

const BE_URL = import.meta.env.VITE_API_BE_URL;

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

/**
 * One-to-one chat with the selected contact.
 * - Loads history over REST.
 * - Sends via socket ("send-message" with ack) and receives via "receive-message".
 * - onMessagesSeen lets the parent clear the unread badge / refresh previews.
 */
const ChatWindow = ({ me, contact, onStartCall, onMessageActivity }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const contactId = contact?._id ? String(contact._id) : null;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load conversation history when the selected contact changes.
  useEffect(() => {
    if (!contactId) return;
    let cancelled = false;
    // Reset view state for the newly selected conversation before fetching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setPeerTyping(false);

    AuthService.getMessages(contactId)
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data?.data || []);
        onMessageActivity?.();
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e.response?.data?.msg || e.message || "Could not load messages."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contactId, onMessageActivity]);

  // Live incoming messages + typing for this contact.
  useEffect(() => {
    if (!contactId) return;
    const s = socketInstance.getSocket();
    if (!s) return;

    const onReceive = (msg) => {
      if (String(msg.sender) !== contactId) return;
      // Append directly — no full refetch needed.
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
      onMessageActivity?.();
    };

    const onTyping = (data) => {
      if (String(data.from) !== contactId) return;
      setPeerTyping(!!data.isTyping);
    };

    s.on("receive-message", onReceive);
    s.on("typing", onTyping);
    return () => {
      s.off("receive-message", onReceive);
      s.off("typing", onTyping);
    };
  }, [contactId, onMessageActivity]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, peerTyping, scrollToBottom]);

  const emitTyping = useCallback(
    (isTyping) => {
      const s = socketInstance.getSocket();
      if (s && contactId) s.emit("typing", { to: contactId, isTyping });
    },
    [contactId]
  );

  const handleChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1200);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending || !contactId) return;

    const s = socketInstance.getSocket();
    if (!s) {
      setError("Not connected — refresh and sign in again.");
      return;
    }

    setSending(true);
    emitTyping(false);
    s.emit("send-message", { to: contactId, text: body }, (resp) => {
      setSending(false);
      if (resp?.ok && resp.message) {
        setMessages((prev) => [...prev, resp.message]);
        setText("");
        onMessageActivity?.();
      } else {
        setError("Message failed to send. Try again.");
      }
    });
  };

  if (!contact) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50 text-slate-400">
        <div className="text-center">
          <p className="text-lg font-medium">Select a contact</p>
          <p className="text-sm">Choose someone on the left to chat or call.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={`${BE_URL}${contact.image}`}
            alt={contact.name}
            className="h-10 w-10 rounded-full object-cover border border-slate-200"
          />
          <div>
            <p className="font-semibold text-slate-800">{contact.name}</p>
            <p className="text-xs text-slate-400">
              {peerTyping ? "typing…" : "Chat"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onStartCall(contact._id, contact.name)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
        >
          <MdVideocam size={18} />
          Video Call
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && (
          <p className="text-center text-sm text-slate-400">Loading messages…</p>
        )}
        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && messages.length === 0 && (
          <p className="text-center text-sm text-slate-400">
            No messages yet. Say hi 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = String(m.sender) === String(me);
          return (
            <div
              key={m._id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  mine
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    mine ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3"
      >
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
          aria-label="Send"
        >
          <MdSend size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
