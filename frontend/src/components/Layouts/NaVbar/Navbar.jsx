import React from "react";
import {Link,useNavigate} from "react-router-dom";
import AuthService from "../../../services/AuthService";

const Navbar = () => {


  const navigate = useNavigate();

  const logOutUser = async () => {
    await AuthService.logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 shadow-md">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        {/* Left - Logo / Home */}
        <h1 className="text-xl font-semibold cursor-pointer">MyApp</h1>

        {/* Right - Menu */}
        <ul className="flex space-x-6">
          <li className="cursor-pointer hover:text-gray-200">
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className="cursor-pointer hover:text-gray-200">
            <Link to="/profile">Profile</Link>
          </li>
          <li className="cursor-pointer hover:text-gray-200">
            <Link onClick={logOutUser}>Logout</Link>
          </li>
          <li className="cursor-pointer hover:text-gray-200">
            <Link to="/login">Login</Link>
          </li>
          <li className="cursor-pointer hover:text-gray-200">
            <Link to="/register">Register</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
