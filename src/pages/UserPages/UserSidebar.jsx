import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChartBar, FaTasks, FaCalendarAlt, FaBell, FaUser } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

const UserSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if user is authenticated
  const isAuthenticated = !!user || !!localStorage.getItem("token");

  // Sidebar links with icons - show only Dashboard if not authenticated
  const allMenuItems = [
    { path: "/user/dashboard", label: "Dashboard", icon: <FaChartBar />, public: true },
    { path: "/user/userpage", label: "Create Tasks", icon: <FaTasks />, public: false },
    { path: "/user/calendar", label: "Calendar", icon: <FaCalendarAlt />, public: false },
    { path: "/user/notifications", label: "Notifications", icon: <FaBell />, public: false },
    { path: "/user/profile", label: "Profile", icon: <FaUser />, public: false },
  ];
  
  // Filter menu items based on authentication status
  const menuItems = isAuthenticated 
    ? allMenuItems 
    : allMenuItems.filter(item => item.public);

  return (
    <div className="w-64 min-h-screen p-6 bg-gray-900 text-white glassmorphism border-r border-gray-700">
      <h2 className="text-2xl font-extrabold text-center text-gray-100 tracking-wide mb-6">🚀 User Panel</h2>

      <ul className="space-y-3">
        {menuItems.map(({ path, label, icon }) => (
          <li key={path}>
            <Link
              to={path}
              className={`flex items-center gap-3 py-3 px-5 rounded-lg transition-all duration-200 text-lg font-medium ${
                location.pathname === path
                  ? "bg-blue-600 shadow-lg transform scale-105"
                  : "hover:bg-blue-700 hover:scale-105 transition"
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserSidebar;
