import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdChat,
  MdPerson,
  MdLogout,
  MdMenu,
  MdClose,
  MdVideocam,
} from "react-icons/md";
import AuthService from "../../../services/AuthService";
import socketInstance from "../../../socket";
import { resolveAvatar } from "../../../utils/avatar";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: MdDashboard },
  { to: "/chat", label: "Chat & Calls", icon: MdChat },
  { to: "/profile", label: "Profile", icon: MdPerson },
];

/**
 * Authenticated layout: fixed sidebar navigation + top bar.
 * Renders page content via `children`.
 */
const AppShell = ({ title, children }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = AuthService.getUserData();

  const handleLogout = () => {
    const socket = socketInstance.getSocket();
    if (socket) socket.disconnect();
    socketInstance.setSocket();
    AuthService.logoutUser();
    navigate("/", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700 shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
          <MdVideocam size={20} />
        </span>
        <span className="text-lg font-bold tracking-tight text-slate-800">
          Meetly
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={navLinkClass}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon size={18} /> {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-100"
        >
          {user?.image ? (
            <img
              src={resolveAvatar(user.image)}
              alt={user?.name || "avatar"}
              className="h-9 w-9 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <MdPerson size={18} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-800">
              {user?.name}
            </span>
            <span className="block truncate text-xs text-slate-400">
              {user?.email}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <MdLogout size={18} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/70 bg-white/70 backdrop-blur lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <MdClose size={20} /> : <MdMenu size={20} />}
          </button>
          <h1 className="text-base font-semibold text-slate-800">{title}</h1>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
