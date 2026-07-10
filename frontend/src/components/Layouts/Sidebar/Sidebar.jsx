import { useNavigate } from "react-router-dom";
import { MdLogout } from "react-icons/md";
import AuthService from "../../../services/AuthService";
import socketInstance from "../../../socket";

const BE_URL = import.meta.env.VITE_API_BE_URL;

const Sidebar = ({
  users = [],
  onlineUsers = [],
  conversations = [],
  selectedId,
  onSelect,
  listError,
}) => {
  const navigate = useNavigate();
  const currentUser = AuthService.getUserData();

  const onlineIds = new Set(onlineUsers.map((u) => u.userId));
  const isOnline = (id) => onlineIds.has(String(id));

  const convById = new Map(
    conversations.map((c) => [String(c.userId), c])
  );

  const handleLogout = () => {
    const socket = socketInstance.getSocket();
    if (socket) socket.disconnect();
    socketInstance.setSocket();
    AuthService.logoutUser();
    navigate("/login", { replace: true });
  };

  // Sort: contacts with conversations first (most recent), then the rest.
  const sorted = [...users].sort((a, b) => {
    const ca = convById.get(String(a._id));
    const cb = convById.get(String(b._id));
    if (ca && cb)
      return new Date(cb.lastMessageAt) - new Date(ca.lastMessageAt);
    if (ca) return -1;
    if (cb) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 text-white">
      {/* Current user header */}
      <button
        type="button"
        onClick={() => navigate("/profile")}
        className="flex items-center gap-3 border-b border-slate-700 px-4 py-4 text-left hover:bg-slate-800 transition"
      >
        {currentUser?.image && (
          <img
            src={`${BE_URL}${currentUser.image}`}
            alt={currentUser.name}
            className="h-10 w-10 rounded-full object-cover border border-slate-600"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{currentUser?.name}</p>
          <p className="text-xs text-slate-400">View profile</p>
        </div>
      </button>

      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-slate-300">Chats</span>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-xs font-medium hover:bg-red-500 transition"
        >
          <MdLogout size={14} /> Log out
        </button>
      </div>

      {listError && (
        <div className="px-4 py-2 text-xs text-red-300">{listError}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!listError && sorted.length === 0 && (
          <p className="px-4 py-3 text-sm text-slate-500">No other users yet.</p>
        )}
        <ul>
          {sorted.map((user) => {
            const conv = convById.get(String(user._id));
            const active = String(selectedId) === String(user._id);
            return (
              <li key={user._id}>
                <button
                  type="button"
                  onClick={() => onSelect(user)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                    active ? "bg-slate-700" : "hover:bg-slate-800"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={`${BE_URL}${user.image}`}
                      alt={user.name}
                      className="h-11 w-11 rounded-full object-cover border border-slate-600"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${
                        isOnline(user._id) ? "bg-green-400" : "bg-slate-500"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-sm">
                        {user.name}
                      </span>
                      {conv?.unread > 0 && !active && (
                        <span className="ml-1 shrink-0 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-400">
                      {conv?.lastMessage ||
                        (isOnline(user._id) ? "Online" : "Offline")}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
