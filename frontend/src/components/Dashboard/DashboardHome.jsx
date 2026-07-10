import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdChat,
  MdGroups,
  MdMarkChatUnread,
  MdPerson,
  MdVideocam,
  MdArrowForward,
} from "react-icons/md";
import AuthService from "../../services/AuthService";
import { resolveAvatar } from "../../utils/avatar";

const StatCard = ({ icon, label, value, accent, loading }) => (
  <div className="tilt-card rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-lg shadow-slate-200/40 backdrop-blur [perspective:1000px]">
    <div className="flex items-center justify-between">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md ${accent}`}
      >
        {icon}
      </span>
    </div>
    <p className="mt-4 text-3xl font-bold tracking-tight text-slate-800">
      {loading ? (
        <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" />
      ) : (
        value
      )}
    </p>
    <p className="mt-1 text-sm text-slate-500">{label}</p>
  </div>
);

const DashboardHome = () => {
  const navigate = useNavigate();
  const user = AuthService.getUserData();

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      AuthService.getAllUsers(),
      AuthService.getConversations(),
    ]).then(([usersRes, convRes]) => {
      if (cancelled) return;
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data?.data || []);
      } else {
        setError(
          usersRes.reason?.response?.data?.msg || "Could not load your data."
        );
      }
      if (convRes.status === "fulfilled") {
        setConversations(convRes.value.data?.data || []);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const unread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const recent = [...conversations]
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    .slice(0, 6);

  const firstName = (user?.name || "").split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-2xl shadow-indigo-300/50">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-32 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-xl" />
        <div className="relative">
          <p className="text-sm font-medium text-indigo-100">Welcome back</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">
            Hey {firstName} 👋
          </h2>
          <p className="mt-2 max-w-lg text-sm text-indigo-100">
            Jump back into your conversations or start a face-to-face call with
            anyone on your team.
          </p>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
          >
            <MdVideocam size={18} /> Open Chat &amp; Calls
          </button>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<MdGroups size={20} />}
          label="Contacts"
          value={users.length}
          accent="bg-gradient-to-br from-indigo-500 to-indigo-600"
          loading={loading}
        />
        <StatCard
          icon={<MdChat size={20} />}
          label="Conversations"
          value={conversations.length}
          accent="bg-gradient-to-br from-violet-500 to-violet-600"
          loading={loading}
        />
        <StatCard
          icon={<MdMarkChatUnread size={20} />}
          label="Unread messages"
          value={unread}
          accent="bg-gradient-to-br from-fuchsia-500 to-fuchsia-600"
          loading={loading}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <section className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">
              Recent conversations
            </h3>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              View all <MdArrowForward size={15} />
            </button>
          </div>

          {loading ? (
            <ul className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <li key={i} className="flex animate-pulse items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-slate-200" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3 w-1/3 rounded bg-slate-200" />
                    <span className="block h-3 w-2/3 rounded bg-slate-100" />
                  </span>
                </li>
              ))}
            </ul>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                <MdChat size={22} />
              </span>
              <p className="text-sm font-medium text-slate-600">
                No conversations yet
              </p>
              <p className="text-xs text-slate-400">
                Pick a contact in Chat &amp; Calls to say hello.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((conv) => {
                const contact = userById.get(String(conv.userId));
                return (
                  <li key={conv.userId}>
                    <button
                      type="button"
                      onClick={() => navigate("/chat")}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-slate-50"
                    >
                      {contact?.image ? (
                        <img
                          src={resolveAvatar(contact.image)}
                          alt={contact.name}
                          className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <MdPerson size={18} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">
                          {contact?.name || "Unknown user"}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {conv.lastMessage || "…"}
                        </span>
                      </span>
                      {conv.unread > 0 && (
                        <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            Quick actions
          </h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <MdVideocam size={18} />
              </span>
              Start a video call
            </button>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <MdChat size={18} />
              </span>
              Send a message
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-fuchsia-300 hover:bg-fuchsia-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-600">
                <MdPerson size={18} />
              </span>
              Edit your profile
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardHome;
