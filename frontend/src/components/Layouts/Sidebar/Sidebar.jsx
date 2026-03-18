import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/AuthService";

const Sidebar = ({ isOpen }) => {
  const [currentUserName, setCurrentUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = AuthService.getUserData();
    setCurrentUserName(user?.name || "");
    }, []);

  const handleLogout = () => {
  AuthService.logoutUser();
  navigate('/login', { replace: true });
  };

  return (
      <div
      className={`fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white 
      transform transition-transform duration-300 z-40
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>

      {/* Header */}
      <div className="bg-blue-200 px-4 py-4 font-semibold text-lg">
        Project Name
      </div>
      <div className='bg-blue-200 px-4 py-4 font-semibold text-lg'>
        <button className='btn btn-secondary' onClick={handleLogout}>
          Log Out
        </button>
      </div>
      
      {/* User */}
      <div className="px-4 py-2 text-sm text-gray-300">
        Hi, {currentUserName}
      </div>
    </div>
  );
};

export default Sidebar;












// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import AuthService from "../../../services/AuthService";

// const Sidebar = ({ isOpen }) => {
//   const [currentUserName, setCurrentUserName] = useState("");

//   useEffect(() => {
//     const user = AuthService.getUserData();
//     setCurrentUserName(user?.name || "");
//   }, []);

//   return (
//     <aside
//       className={`bg-gray-900 text-white transition-all duration-300 overflow-hidden ${
//         isOpen ? "w-64" : "w-0"
//       }`}
//     >
//       {/* Header */}
//       <div className="bg-blue-600 px-4 py-4 font-semibold text-lg">
//         {isOpen && `Hi, ${currentUserName}`}
//       </div>

//       {/* Menu */}
//       <ul className="mt-4 space-y-1">
//         <li className="hover:bg-blue-600 transition">
//           <Link to="/dashboard" className="block px-4 py-3">
//             {isOpen && "Dashboard"}
//           </Link>
//         </li>
//       </ul>
//     </aside>
//   );
// };

// export default Sidebar;



































// import { Link } from "react-router-dom";
// import React,{useState,useEffect} from "react";
// import { useNavigate } from "react-router-dom";
// import AuthService from "../../../services/AuthService";
// const Sidebar = ({ isOpen }) => {
//   const navigate = useNavigate();

//   const [sidebarActive, setSidebarActive] = useState('');
//   const [currentUserName, setCurrentUserName] = useState('');
//   return (
//     <aside
//       className={`bg-gray-900 text-white transition-all duration-300 overflow-hidden ${
//         isOpen ? "w-64" : "w-0"
//       }`}
//     >
//       {/* Logo */}
//       <div className="bg-blue-600 px-4 py-4 font-semibold text-lg">
//         {isOpen && "Project Name"}
//       </div>

//       {/* Menu */}
//       <ul className="mt-4 space-y-1">
//         <Item label="Dashboard" path="/dashboard" isOpen={isOpen} />
//       </ul>
//     </aside>
//   );
// };

// const Item = ({ label, path, isOpen }) => {
//   return (
//     <li className="hover:bg-blue-600 transition">
//       <Link to={path} className="block px-4 py-3">
//         {isOpen && label}
//       </Link>
//     </li>
//   );
// };

// export default Sidebar;







// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import AuthService from '../../../services/AuthService';

// const Sidebar = () => {
//   const navigate = useNavigate();

//   const [sidebarActive, setSidebarActive] = useState('');
//   const [currentUserName, setCurrentUserName] = useState('');

//   const sidebarToggle = () => {
//     if (sidebarActive !== '') {
//       setSidebarActive('');
//     } else {
//       setSidebarActive('active');
//     }
//   };

//   useEffect(() => {
//     const user = AuthService.getUserData();
//     setCurrentUserName(user ? user.name : '');
//   }, []);

//   return (
//     <nav id="sidebar" className={sidebarActive}>
//   <div className="custom-menu">
//     <button type="button" id="sidebarCollapse" onClick={sidebarToggle}>
//       <i className="fa fa-bars"></i>
//       <span className="sr-only">Toggle Menu</span>
//     </button>
//   </div>

//   <h1>
//     <a href="#" className="logo">Hii, {currentUserName}</a>
//   </h1>

//   <ul className="list-unstyled components mb-5">
//     <li className="active">
//       <a href="#">
//         <span className="fa fa-home mr-3"></span> Homepage
//       </a>
//     </li>
//   </ul>
// </nav>
//   );
// };


// export default Sidebar;





































