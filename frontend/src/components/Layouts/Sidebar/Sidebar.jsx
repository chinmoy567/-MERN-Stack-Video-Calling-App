const Sidebar = ({ isOpen }) => {
  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300
      ${isOpen ? "w-64" : "w-16"}`}
    >
      {/* Logo */}
      <div className="bg-blue-600 px-4 py-4 font-semibold text-lg truncate">
        {isOpen ? "Project Name" : ""}
      </div>

      {/* Menu */}
      <ul className="mt-4 space-y-1">
        <Item label="Homepage" isOpen={isOpen} />
        <Item label="Dashboard" isOpen={isOpen} />
        <Item label="Friends" isOpen={isOpen} />
        <Item label="Subscription" isOpen={isOpen} />
        <Item label="Settings" isOpen={isOpen} />
        <Item label="Information" isOpen={isOpen} />
      </ul>
    </aside>
  );
};

const Item = ({ label, isOpen }) => (
  <li className="px-4 py-3 hover:bg-blue-600 cursor-pointer transition">
    {isOpen && label}
  </li>
);

export default Sidebar;
