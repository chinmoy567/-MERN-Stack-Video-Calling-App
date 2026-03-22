import { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";

const Layout = ({ children, onlineUsers, callToUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div>
      <Sidebar
        onlineUsers={onlineUsers}
        isOpen={isSidebarOpen}
        callToUser={callToUser}
      />

      <header
        className={`fixed top-0 h-16 bg-blue-600 shadow z-50 flex items-center px-6 transition-all duration-300
        ${isSidebarOpen ? "left-64 w-[calc(100%-16rem)]" : "left-0 w-full"}`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-2xl text-white"
        >
          ☰
        </button>
      </header>

      <main
        className={`mt-16 p-6 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;