import { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Header */}
      <header
        className={`fixed top-0 h-16 bg-white shadow z-50 flex items-center px-6 transition-all duration-300
        ${isSidebarOpen ? "left-64 w-[calc(100%-16rem)]" : "left-0 w-full"}`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-2xl"
        >
          ☰
        </button>

        <h1 className="ml-4 font-semibold">Dashboard</h1>
      </header>

      {/* Content */}
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













// import { useState } from "react";
// import Sidebar from "../Sidebar/Sidebar";

// const Layout = ({ children }) => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       <Sidebar isOpen={isSidebarOpen} />

//       {/* Content Area */}
//       <div className="flex-1">
//         {/* Top Bar */}
//         <header className="flex items-center gap-4 px-6 py-4 bg-white shadow">
//           <button
//             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             className="text-2xl"
//           >
//             ☰
//           </button>
        
//         </header>

//         {/* Page Content */}
//         <main
//           className={`p-6 transition-all duration-300 ${
//             isSidebarOpen ? "ml-64" : "ml-0"
//           }`}
//         >
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Layout;
