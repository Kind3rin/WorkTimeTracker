import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, Bell, HelpCircle, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

declare global {
  interface Window {
    toggleSidebar?: () => void;
  }
}

export default function TopBar() {
  const [notifications] = useState(3);
  const isMobile = useIsMobile();
  
  const handleToggleSidebar = () => {
    if (window.toggleSidebar) {
      window.toggleSidebar();
    }
  };

  return (
    <header className={`bg-white border-b h-16 flex items-center px-4 shadow-sm z-10 ${isMobile ? 'mt-14' : ''}`}>
      <button 
        id="open-sidebar" 
        className="lg:hidden mr-4 text-neutral-800 focus:outline-none"
        onClick={handleToggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="relative flex-grow max-w-md mx-4 hidden md:block">
        <Input 
          type="text" 
          placeholder="Cerca..." 
          className="pl-10 h-10 focus:border-primary-500"
        />
        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
      </div>
      
      <div className="ml-auto flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative p-2 mx-1 hover:bg-neutral-100 rounded-full"
        >
          <div className="relative">
            <Bell className="h-5 w-5 text-neutral-800" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </div>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative p-2 mx-1 hover:bg-neutral-100 rounded-full"
        >
          <HelpCircle className="h-5 w-5 text-neutral-800" />
        </Button>
      </div>
    </header>
  );
}
