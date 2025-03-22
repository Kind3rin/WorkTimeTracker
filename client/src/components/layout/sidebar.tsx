import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { navItems, settingsItems } from "@/lib/constants";
import { getUserInitials } from "@/lib/utils";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-mobile";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Close sidebar on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const sidebarToggle = document.getElementById("open-sidebar");
      
      if (
        isMobile &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        sidebarToggle !== event.target
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMobile]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // This function is called by the TopBar component
  window.toggleSidebar = toggleSidebar;

  return (
    <div 
      id="sidebar" 
      className={cn(
        "sidebar fixed md:relative z-30 w-64 h-full bg-white shadow-md flex-shrink-0 flex flex-col",
        isMobile && "transform -translate-x-full transition-transform duration-300 ease-in-out",
        isMobile && isSidebarOpen && "transform translate-x-0"
      )}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <i className="ri-briefcase-line text-white"></i>
          </div>
          <h1 className="ml-2 text-lg font-semibold">WorkTrack Pro</h1>
        </div>
        {isMobile && (
          <button 
            id="close-sidebar" 
            className="text-neutral-dark"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        )}
      </div>
      
      {user && (
        <div className="p-4 border-b bg-neutral-lightest">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white font-semibold">
              <span>{getUserInitials(user.name)}</span>
            </div>
            <div className="ml-3">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-neutral-medium">{user.role}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-y-auto flex-grow">
        <nav className="py-2">
          <p className="px-4 py-2 text-xs font-semibold text-neutral-medium uppercase">Menu principale</p>
          
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
            >
              <a 
                className={cn(
                  "sidebar-link flex items-center px-4 py-2 text-sm hover:bg-neutral-lightest",
                  location === item.path && "active bg-neutral-lightest border-l-3 border-primary"
                )}
              >
                <i className={`ri-${item.icon} mr-3 text-lg`}></i>
                <span>{item.name}</span>
              </a>
            </Link>
          ))}
          
          <div className="border-t my-2"></div>
          
          <p className="px-4 py-2 text-xs font-semibold text-neutral-medium uppercase">Impostazioni</p>
          
          {settingsItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
            >
              <a 
                className={cn(
                  "sidebar-link flex items-center px-4 py-2 text-sm hover:bg-neutral-lightest",
                  location === item.path && "active bg-neutral-lightest border-l-3 border-primary"
                )}
              >
                <i className={`ri-${item.icon} mr-3 text-lg`}></i>
                <span>{item.name}</span>
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <button 
          className="flex items-center text-sm text-neutral-dark hover:text-error"
          onClick={handleLogout}
        >
          <i className="ri-logout-box-line mr-2"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
