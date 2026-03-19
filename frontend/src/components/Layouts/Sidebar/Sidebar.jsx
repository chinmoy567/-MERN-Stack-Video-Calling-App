import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/AuthService";

const Sidebar = ({ isOpen }) => {
  const [currentUserName, setCurrentUserName] = useState("");
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await AuthService.getAllUsers();
        const data = response.data;

        if (data.success) {
          setUsers(data.data);
        } else {
          alert(data.msg);
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchUsers();

    const user = AuthService.getUserData();
    setCurrentUserName(user?.name || "");
  }, []);

  const handleLogout = () => {
    AuthService.logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className={`fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white 
      transform transition-transform duration-300 z-40
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Header */}
      <div className="bg-blue-200 px-4 py-4 font-semibold text-lg">
        Project Name
      </div>
      <div className="bg-blue-200 px-4 py-4 font-semibold text-lg">
        <button
          className="bg-red-500 text-white px-3 py-1 rounded"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>

      {/* User */}
      <div className="px-4 py-2 text-sm text-gray-300">
        Hi, {currentUserName}
      </div>

        {/* Users */}
      <ul className="mb-5">
        {users.map((user) => (
          <li
            key={user._id}
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-700 cursor-pointer transition"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
              <img
                src={`${import.meta.env.VITE_API_BE_URL}${user.image}`}
                alt={user.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-white font-medium text-sm">
                {user.name}
              </span>
              <span className="text-gray-400 text-xs">Online</span>
            </div>
          </li>
        ))}
      </ul>
      
    </div>
  );
};

export default Sidebar;
