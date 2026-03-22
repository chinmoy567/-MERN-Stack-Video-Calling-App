import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/AuthService";
import socketInstance from "../../../socket";

const Sidebar = ({ callToUser, isOpen, onlineUsers = [] }) => {
  const [currentUserName, setCurrentUserName] = useState("");
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [listError, setListError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setListError(null);
      try {
        const response = await AuthService.getAllUsers();
        const data = response.data;
        if (data.success) {
          setUsers(data.data || []);
        }
      } catch (error) {
        console.log(error);
        const msg =
          error.response?.data?.msg ||
          error.message ||
          "Could not load contacts.";
        setListError(msg);
      }
    };

    fetchUsers();

    const user = AuthService.getUserData();
    setCurrentUserName(user ? user.name : "");
  }, []);

  const handleLogout = () => {
    const socket = socketInstance.getSocket();

    if (socket) {
      socket.disconnect();
    }

    socketInstance.setSocket();
    AuthService.logoutUser();
    navigate("/login", { replace: true });
  };

  const isUserOnline = (userId) => {
    const id = userId != null ? String(userId) : "";
    return onlineUsers.some((u) => String(u.userId) === id);
  };

  return (
    <div
      className={`fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white 
      transform transition-transform duration-300 z-40
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="bg-blue-200 px-4 py-4 font-semibold text-lg text-black">
        Video Calling
      </div>
      <div className="bg-blue-200 px-4 py-4">
        <button
          className="bg-red-500 text-white px-3 py-1 rounded"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>

      <div className="px-4 py-2 text-sm text-gray-300">
        Hi, {currentUserName}
      </div>

      {listError && (
        <div className="px-4 py-2 text-xs text-red-300 border-b border-gray-700">
          {listError}
        </div>
      )}

      {!listError && users.length === 0 && (
        <div className="px-4 py-3 text-sm text-gray-500">No other users yet.</div>
      )}

      <ul className="mb-5">
        {users.map((user) => (
          <li
            key={user._id}
            onClick={() => callToUser(user._id, user.name)}
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-700 cursor-pointer transition"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                <img
                  src={`${import.meta.env.VITE_API_BE_URL}${user.image}`}
                  alt={user.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900
                  ${isUserOnline(user._id) ? "bg-green-400" : "bg-gray-500"}`}
              />
            </div>

            <div className="flex flex-col">
              <span className="text-white font-medium text-sm">
                {user.name}
              </span>
              <span
                className={`text-xs font-semibold
                  ${isUserOnline(user._id) ? "text-green-400" : "text-gray-400"}`}
              >
                {isUserOnline(user._id) ? "● Online" : "○ Offline"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
