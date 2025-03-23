import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search, Bell, HelpCircle, Menu, MoreHorizontal, User, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

declare global {
  interface Window {
    toggleSidebar?: () => void;
  }
}

export default function TopBar() {
  const [notifications] = useState(3);
  const isMobile = useIsMobile();
  const { user, logoutMutation } = useAuth();
  const [companyName, setCompanyName] = useState<string>("Azienda");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  
  // Caricare le informazioni dell'azienda (in una implementazione reale questo arriverebbe da un'API)
  useEffect(() => {
    // Simula il caricamento dei dati dell'azienda (in produzione verrebbe da un'API)
    const loadCompanyInfo = () => {
      const companyId = localStorage.getItem('companyId') || 'default';
      // In una implementazione reale, queste informazioni verrebbero recuperate da un endpoint API
      // come /api/companies/{companyId}
      setCompanyName(companyId === 'default' ? 'WorkTracker Pro' : `${companyId} Workforce`);
      // Il logo potrebbe essere un URL a un asset o un SVG inline
      setCompanyLogo(null);
    };
    
    loadCompanyInfo();
  }, []);

  const handleToggleSidebar = () => {
    if (window.toggleSidebar) {
      window.toggleSidebar();
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Ottenere le iniziali dell'utente per l'avatar
  const getUserInitials = (): string => {
    if (!user || !user.fullName) return '?';
    
    const nameParts = user.fullName.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
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
      
      {/* Logo o nome dell'azienda */}
      <div className="flex items-center">
        {companyLogo ? (
          <img src={companyLogo} alt={companyName} className="h-8 mr-2" />
        ) : (
          <span className="text-lg font-semibold text-primary-600">{companyName}</span>
        )}
      </div>
      
      <div className="relative flex-grow max-w-md mx-4 hidden md:block">
        <Input 
          type="text" 
          placeholder="Cerca..." 
          className="pl-10 h-10 focus:border-primary-500"
        />
        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
      </div>
      
      <div className="ml-auto flex items-center space-x-1">
        {/* Notifiche */}
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
        
        {/* Aiuto */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative p-2 mx-1 hover:bg-neutral-100 rounded-full hidden md:flex"
        >
          <HelpCircle className="h-5 w-5 text-neutral-800" />
        </Button>
        
        {/* Menu utente con dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-100 text-primary-700">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>Il mio account</span>
                <span className="text-xs text-muted-foreground">{user?.fullName}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profilo</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Esci</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
