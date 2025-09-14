import React, { useRef, useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { HiX } from 'react-icons/hi';
import { FiLogOut, FiChevronDown } from 'react-icons/fi';

// Add custom CSS for animations
const customStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fade-in 0.4s ease-out forwards;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('sidebar-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'sidebar-animations';
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, menuItems, logoutRoute }) => {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState({});

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isSidebarOpen, setIsSidebarOpen]);

  const handleLogout = () => {
    navigate(logoutRoute);
  };

  const toggleSubmenu = (itemName) => {
    setOpenSubmenu((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  return (
    <div
      ref={sidebarRef}
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-30 w-64 lg:w-64 h-screen max-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 backdrop-blur-xl bg-opacity-90 border-r border-white/30 shadow-2xl text-white transform transition-all duration-500 ease-out overflow-y-auto rounded-r-xl
        ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} lg:translate-x-0 lg:opacity-100 lg:static lg:inset-0`}
      style={{ 
        maxWidth: '100vw',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.95) 0%, rgba(124, 58, 237, 0.95) 35%, rgba(147, 51, 234, 0.95) 65%, rgba(219, 39, 119, 0.95) 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Sticky header for sidebar */}
      <div className="flex items-center justify-between h-20 shadow-xl px-6 border-b border-white/20 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl sticky top-0 z-10">
        <h1 className="text-2xl font-black bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent tracking-wide drop-shadow-2xl">Menu</h1>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="text-gray-200 hover:text-white hover:bg-white/20 hover:scale-110 focus:outline-none lg:hidden transition-all duration-300 rounded-xl p-2"
          aria-label="Close menu"
        >
          <HiX className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 flex flex-col py-6 space-y-3 px-3 min-h-0">
        {menuItems.map((item, index) => (
          <div 
            key={item.name}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {item.submenu ? (
              <>
                <button
                  onClick={() => toggleSubmenu(item.name)}
                  className={`flex items-center justify-between w-full px-5 py-4 rounded-xl transition-all duration-300 text-base font-semibold border border-transparent group relative overflow-hidden
                    ${openSubmenu[item.name] 
                      ? 'bg-white/10 text-white shadow-xl border-white/30 scale-105 backdrop-blur-xl' 
                      : 'hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:scale-105 text-gray-100 hover:text-white'
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex items-center relative z-10">
                    {item.emoji ? (
                      <span className="mr-4 text-2xl group-hover:scale-125 transition-transform duration-300" role="img" aria-label={item.name}>{item.emoji}</span>
                    ) : item.materialIcon ? (
                      <span className="material-icons mr-4 text-2xl group-hover:scale-125 transition-transform duration-300">{item.materialIcon}</span>
                    ) : item.icon ? (
                      <item.icon className="w-7 h-7 mr-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                    ) : null}
                    <span className="group-hover:translate-x-1 transition-transform duration-300 truncate">{item.name}</span>
                  </div>
                  <FiChevronDown className={`w-5 h-5 transition-all duration-300 group-hover:scale-125 ${openSubmenu[item.name] ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                {openSubmenu[item.name] && (
                  <div className="ml-8 mt-3 space-y-2 animate-fade-in">
                    {item.submenu.map((subItem, subIndex) => (
                      <NavLink
                        key={subItem.name}
                        to={subItem.route}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium border border-transparent group relative overflow-hidden
                            ${isActive 
                              ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-2xl font-bold ring-2 ring-white/30 border-white/20 scale-105 backdrop-blur-xl' 
                              : 'hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:scale-105 text-gray-200 hover:text-white'
                            }
                          `
                        }
                        style={{ animationDelay: `${subIndex * 30}ms` }}
                        onClick={() => setIsSidebarOpen(false)}
                        aria-current={({ isActive }) => isActive ? 'page' : undefined}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {subItem.icon && (
                          <subItem.icon className="w-5 h-5 mr-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                        )}
                        <span className="group-hover:translate-x-1 transition-transform duration-300 relative z-10 truncate">{subItem.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                key={item.name}
                to={item.route}
                className={({ isActive }) =>
                  `flex items-center px-5 py-4 rounded-xl transition-all duration-300 text-base font-semibold border border-transparent group relative overflow-hidden
                  ${isActive 
                    ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-2xl font-bold ring-2 ring-white/30 border-white/20 scale-105 backdrop-blur-xl' 
                    : 'hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:scale-105 text-gray-100 hover:text-white'
                  }
                  `
                }
                onClick={() => setIsSidebarOpen(false)}
                aria-current={({ isActive }) => isActive ? 'page' : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {item.emoji ? (
                  <span className="mr-4 text-2xl group-hover:scale-125 transition-transform duration-300 relative z-10" role="img" aria-label={item.name}>{item.emoji}</span>
                ) : item.materialIcon ? (
                  <span className="material-icons mr-4 text-2xl group-hover:scale-125 transition-transform duration-300 relative z-10">{item.materialIcon}</span>
                ) : item.icon ? (
                  <item.icon className="w-7 h-7 mr-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                ) : null}
                <span className="group-hover:translate-x-1 transition-transform duration-300 relative z-10 truncate">{item.name}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>
      <div className="px-4 pb-6 pt-4 sticky bottom-0 bg-gradient-to-t from-violet-900/95 via-purple-800/90 to-transparent backdrop-blur-xl">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-5 py-4 rounded-2xl transition-all duration-300 bg-gradient-to-r from-red-600/80 via-red-500/80 to-pink-600/80 hover:from-red-700 hover:via-red-600 hover:to-pink-700 hover:scale-105 text-white font-bold shadow-2xl border border-white/20 hover:border-white/40 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <FiLogOut className="w-6 h-6 mr-3 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-300 relative z-10" />
          <span className="group-hover:translate-x-1 transition-transform duration-300 relative z-10">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;