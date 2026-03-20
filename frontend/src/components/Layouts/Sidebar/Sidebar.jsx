import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/AuthService";

const Sidebar = ({ isOpen, onlineUsers = [] }) => {
  const [currentUserName, setCurrentUserName] = useState("");
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    console.log("✅ onlineUsers prop updated:", onlineUsers); // debug
  }, [onlineUsers]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await AuthService.getAllUsers();
        const data = response.data;
        if (data.success) {
          setUsers(data.data);
          console.log("✅ fetched users:", data.data); // debug
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchUsers();

    const user = AuthService.getUserData();
    setCurrentUserName(user ? user.name : "");
  }, []);

  const handleLogout = () => {
    AuthService.logoutUser();
    navigate("/login", { replace: true });
  };

  const isUserOnline = (userId) => {
    const result = onlineUsers.some((u) => u.userId === userId.toString());
    console.log(`checking ${userId} → online: ${result}`, onlineUsers); // debug
    return result;
  };

  return (
    <div
      className={`fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white 
      transform transition-transform duration-300 z-40
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="bg-blue-200 px-4 py-4 font-semibold text-lg text-black">
        Project Name
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

      <ul className="mb-5">
        {users.map((user) => (
          <li
            key={user._id}
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
              {/* Online dot on avatar */}
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




















// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AuthService from "../../../services/AuthService";

// const Sidebar = ({ isOpen, onlineUsers = [] }) => {
//   const [currentUserName, setCurrentUserName] = useState("");
//   const navigate = useNavigate();
//   const [users, setUsers] = useState([]);
//   // const [onlineUsers, setOnlineUsers] = useState([]);

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await AuthService.getAllUsers();
//         const data = response.data;

//         if (data.success) {
//           setUsers(data.data);
//         } else {
//           alert(data.msg);
//         }
//       } catch (error) {
//         console.log(error);
//       }
//     };
//     fetchUsers();

//     const user = AuthService.getUserData();
//     setCurrentUserName(user?user.name : ''); }, []);
//     // Listen for online users updates

//   //   if (!socket) return; 
//   //   socket.on("get-online-users", (onlineUsers) => {
//   //     setOnlineUsers(onlineUsers);
//   //   });
//   //   return () => {
//   //     socket.off("get-online-users");
//   //   };
//   // }, [socket]);

//   const handleLogout = () => {
//     AuthService.logoutUser();
//     navigate("/login", { replace: true });
//   };

//   const isUserOnline = (userId) => {
//     return onlineUsers.some((user) => user.userId === userId);
//   };

//   return (
//     <div
//       className={`fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white 
//       transform transition-transform duration-300 z-40
//       ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
//     >
//       {/* Header */}
//       <div className="bg-blue-200 px-4 py-4 font-semibold text-lg">
//         Project Name
//       </div>
//       <div className="bg-blue-200 px-4 py-4 font-semibold text-lg">
//         <button
//           className="bg-red-500 text-white px-3 py-1 rounded"
//           onClick={handleLogout}
//         >
//           Log Out
//         </button>
//       </div>

//       {/* User */}
//       <div className="px-4 py-2 text-sm text-gray-300">
//         Hi, {currentUserName}
//       </div>

//       {/* Users */}
//       <ul className="mb-5">
//         {users.map((user) => (
//           <li
//             key={user._id}
//             className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-700 cursor-pointer transition"
//           >
//             <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
//               <img
//                 src={`${import.meta.env.VITE_API_BE_URL}${user.image}`}
//                 alt={user.name}
//                 className="w-full h-full object-cover object-center"
//               />
//             </div>

//             <div className="flex flex-col">
//               <span className="text-white font-medium text-sm">
//                 {user.name}
//               </span>
//               <span className="text-gray-400 text-xs">
//                 {isUserOnline(user._id) ? "Online" : "Offline"}
//               </span>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default Sidebar;
