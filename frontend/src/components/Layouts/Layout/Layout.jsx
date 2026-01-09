import { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Content Area */}
      <div className="flex-1">
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-white shadow">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-2xl"
          >
            ☰
          </button>
          <h2 className="text-xl font-semibold">Sidebar #04</h2>
        </header>

        {/* Page Content */}
        <main
          className={`p-6 transition-all duration-300 ${
            isSidebarOpen ? "ml-0" : "ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
