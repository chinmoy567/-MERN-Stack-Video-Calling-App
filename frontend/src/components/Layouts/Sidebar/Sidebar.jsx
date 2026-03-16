import { Link } from "react-router-dom";

const Sidebar = ({ isOpen }) => {
  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 overflow-hidden ${
        isOpen ? "w-64" : "w-0"
      }`}
    >
      {/* Logo */}
      <div className="bg-blue-600 px-4 py-4 font-semibold text-lg">
        {isOpen && "Project Name"}
      </div>

      {/* Menu */}
      <ul className="mt-4 space-y-1">
        <Item label="Dashboard" path="/dashboard" isOpen={isOpen} />
      </ul>
    </aside>
  );
};

const Item = ({ label, path, isOpen }) => {
  return (
    <li className="hover:bg-blue-600 transition">
      <Link to={path} className="block px-4 py-3">
        {isOpen && label}
      </Link>
    </li>
  );
};

export default Sidebar;