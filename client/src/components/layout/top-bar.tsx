import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

declare global {
  interface Window {
    toggleSidebar?: () => void;
  }
}

export default function TopBar() {
  const [notifications] = useState(3);
  
  const handleToggleSidebar = () => {
    if (window.toggleSidebar) {
      window.toggleSidebar();
    }
  };

  return (
    <header className="bg-white border-b h-14 flex items-center px-4 shadow-sm z-10">
      <button 
        id="open-sidebar" 
        className="md:hidden mr-4 text-neutral-dark"
        onClick={handleToggleSidebar}
      >
        <i className="ri-menu-line text-xl"></i>
      </button>
      
      <div className="relative flex-grow max-w-md mx-4 hidden md:block">
        <Input 
          type="text" 
          placeholder="Cerca..." 
          className="pl-8"
        />
        <i className="ri-search-line absolute left-2.5 top-2.5 text-neutral-medium"></i>
      </div>
      
      <div className="ml-auto flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative p-2 mx-1 hover:bg-neutral-lightest rounded-full"
        >
          <i className="ri-notification-3-line text-lg"></i>
          {notifications > 0 && (
            <span className="absolute top-1 right-1 bg-error text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {notifications}
            </span>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative p-2 mx-1 hover:bg-neutral-lightest rounded-full"
        >
          <i className="ri-question-line text-lg"></i>
        </Button>
      </div>
    </header>
  );
}
