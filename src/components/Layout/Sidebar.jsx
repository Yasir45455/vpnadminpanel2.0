import { NavLink } from 'react-router-dom';
import { FiCloud, FiLayout, FiUsers, FiBarChart2, FiLogOut, FiShield } from 'react-icons/fi';

const Sidebar = ({ onLogout }) => {
  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: FiLayout },
    { to: '/apps', label: 'Apps', icon: FiCloud },
    { to: '/users', label: 'Users', icon: FiUsers },
    { to: '/vpn-usage', label: 'VPN Usage', icon: FiBarChart2 },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white shadow-lg">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FiShield className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold">Admin Panel</span>
        </div>
      </div>

      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-full border-t border-gray-800 p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <FiLogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
