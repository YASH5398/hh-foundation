import React, { useRef, useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiChevronDown, FiChevronRight, FiMenu } from 'react-icons/fi';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, menuItems, logoutRoute }) => {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Check if mobile on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-expand submenu if current route matches a submenu item
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.submenu) {
        const hasActiveSubmenu = item.submenu.some(
          subItem => location.pathname === subItem.route
        );
        if (hasActiveSubmenu && !expandedMenus[item.name]) {
          setExpandedMenus(prev => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [location.pathname, menuItems, expandedMenus]);

  // Close sidebar when clicking outside (only mobile)
  useEffect(() => {
    if (!isSidebarOpen || !isMobile) return;
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isSidebarOpen, setIsSidebarOpen, isMobile]);

  const handleLogout = () => {
    navigate(logoutRoute);
  };

  return (
    <>
      <div
        ref={sidebarRef}
        id="sidebar"
        className={`fixed left-0 top-0 z-40 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 shadow-2xl transform transition-all duration-300 ease-in-out overflow-y-auto border-r border-blue-700
          ${isMobile 
            ? (isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64') 
            : (isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64')
          }
        `}
        style={{
          height: '100vh',
          paddingTop: '64px'
        }}
      >
        {/* ❌ Removed "Feature" header completely */}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            if (item.submenu) {
              const isExpanded = expandedMenus[item.name];
              const hasActiveSubmenu = item.submenu.some(
                subItem => location.pathname === subItem.route
              );

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() =>
                      setExpandedMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }))
                    }
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 text-base font-medium group
                      ${hasActiveSubmenu
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 shadow-lg font-semibold'
                        : 'text-white/90 hover:bg-white/10 hover:text-white hover:shadow-md'}`}
                  >
                    <div className="flex items-center">
                      {item.emoji ? (
                        <span className="mr-3 text-xl" role="img" aria-label={item.name}>
                          {item.emoji}
                        </span>
                      ) : item.materialIcon ? (
                        <span className="material-icons mr-3 text-xl">{item.materialIcon}</span>
                      ) : item.icon ? (
                        <item.icon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                      ) : null}
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <FiChevronDown className="w-4 h-4 transition-transform" />
                    ) : (
                      <FiChevronRight className="w-4 h-4 transition-transform" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-6 space-y-1">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.name}
                          to={subItem.route}
                          className={({ isActive }) =>
                            `flex items-center px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium
                            ${isActive
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 shadow-md font-semibold'
                              : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
                          onClick={() => isMobile && setIsSidebarOpen(false)}
                        >
                          <span className="w-2 h-2 bg-current rounded-full mr-3 opacity-60"></span>
                          <span>{subItem.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <NavLink
                  key={item.name}
                  to={item.route}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-base font-medium group
                    ${isActive
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 shadow-lg font-semibold'
                      : 'text-white/90 hover:bg-white/10 hover:text-white hover:shadow-md'}`}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                >
                  {item.emoji ? (
                    <span className="mr-3 text-xl" role="img" aria-label={item.name}>
                      {item.emoji}
                    </span>
                  ) : item.materialIcon ? (
                    <span className="material-icons mr-3 text-xl">{item.materialIcon}</span>
                  ) : item.icon ? (
                    <item.icon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  ) : null}
                  <span>{item.name}</span>
                </NavLink>
              );
            }
          })}
        </nav>

        {/* Sticky bottom logout button */}
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-blue-900 to-blue-800 border-t border-blue-600/30">
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
