import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BarChart, 
  LogOut, 
  Menu, 
  X, 
  Settings, 
  DollarSign,
  LayoutDashboard,
  Activity,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(true);
    }
  }, [isMobile]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 lg:hidden bg-white shadow-sm py-3 px-4 flex items-center justify-between z-20">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(!isOpen)}
              className="text-neutral-800 focus:outline-none -ml-2"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <span className="ml-2 text-lg font-semibold text-primary-500">WorkTrack</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative p-2 hover:bg-neutral-100 rounded-full"
            >
              <div className="relative">
                <Calendar className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </div>
            </Button>
            <Avatar className="h-8 w-8 bg-primary-500 text-white">
              <AvatarFallback>{user ? getInitials(user.fullName || user.username) : "U"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-lg font-semibold text-primary-500">WorkTrack</span>
            </div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-neutral-500 lg:hidden">
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex flex-col items-center py-4">
                <Avatar className="w-20 h-20 bg-primary-500 text-white mb-2">
                  <AvatarFallback className="text-xl">{user ? getInitials(user.fullName || user.username) : "U"}</AvatarFallback>
                </Avatar>
                <h3 className="font-medium">{user?.fullName || user?.username}</h3>
                <p className="text-sm text-neutral-500">{user?.role || "Employee"}</p>
              </div>
              
              <nav className="mt-4 space-y-1">
                <Link href="/" onClick={closeSidebar}>
                  <div className={`flex items-center px-4 py-4 rounded-lg font-medium ${location === "/" ? "text-primary-500 bg-primary-50" : "text-neutral-800 hover:bg-neutral-50"}`}>
                    <LayoutDashboard className={`h-5 w-5 mr-3 ${location === "/" ? "text-primary-500" : "text-neutral-500"}`} />
                    <span>Dashboard</span>
                  </div>
                </Link>
                
                <Link href="/timesheet" onClick={closeSidebar}>
                  <div className={`flex items-center px-4 py-4 rounded-lg font-medium ${location === "/timesheet" ? "text-primary-500 bg-primary-50" : "text-neutral-800 hover:bg-neutral-50"}`}>
                    <Clock className={`h-5 w-5 mr-3 ${location === "/timesheet" ? "text-primary-500" : "text-neutral-500"}`} />
                    <span>Consuntivi</span>
                  </div>
                </Link>
                
                <Link href="/expenses" onClick={closeSidebar}>
                  <div className={`flex items-center px-4 py-4 rounded-lg font-medium ${location === "/expenses" ? "text-primary-500 bg-primary-50" : "text-neutral-800 hover:bg-neutral-50"}`}>
                    <DollarSign className={`h-5 w-5 mr-3 ${location === "/expenses" ? "text-primary-500" : "text-neutral-500"}`} />
                    <span>Note Spese</span>
                  </div>
                </Link>
                
                <Link href="/trips" onClick={closeSidebar}>
                  <div className={`flex items-center px-4 py-4 rounded-lg font-medium ${location === "/trips" ? "text-primary-500 bg-primary-50" : "text-neutral-800 hover:bg-neutral-50"}`}>
                    <MapPin className={`h-5 w-5 mr-3 ${location === "/trips" ? "text-primary-500" : "text-neutral-500"}`} />
                    <span>Trasferte</span>
                  </div>
                </Link>
                
                <Link href="/timeoff" onClick={closeSidebar}>
                  <div className={`flex items-center px-4 py-4 rounded-lg font-medium ${location === "/timeoff" ? "text-primary-500 bg-primary-50" : "text-neutral-800 hover:bg-neutral-50"}`}>
                    <Calendar className={`h-5 w-5 mr-3 ${location === "/timeoff" ? "text-primary-500" : "text-neutral-500"}`} />
                    <span>Ferie e Permessi</span>
                  </div>
                </Link>
                
                <Link href="/sickleave" onClick={closeSidebar}>
                  <div className={`flex items-center px-4 py-4 rounded-lg font-medium ${location === "/sickleave" ? "text-primary-500 bg-primary-50" : "text-neutral-800 hover:bg-neutral-50"}`}>
                    <Activity className={`h-5 w-5 mr-3 ${location === "/sickleave" ? "text-primary-500" : "text-neutral-500"}`} />
                    <span>Malattia</span>
                  </div>
                </Link>
                
                <Link href="/reports" onClick={closeSidebar}>
                  <div className={`flex items-center px-4 py-4 rounded-lg font-medium ${location === "/reports" ? "text-primary-500 bg-primary-50" : "text-neutral-800 hover:bg-neutral-50"}`}>
                    <BarChart className={`h-5 w-5 mr-3 ${location === "/reports" ? "text-primary-500" : "text-neutral-500"}`} />
                    <span>Report</span>
                  </div>
                </Link>
                
                {user?.role === "admin" && (
                  <Link href="/admin" onClick={closeSidebar}>
                    <div className={`flex items-center px-4 py-4 rounded-lg font-medium ${location === "/admin" ? "text-primary-500 bg-primary-50" : "text-neutral-800 hover:bg-neutral-50"}`}>
                      <ShieldCheck className={`h-5 w-5 mr-3 ${location === "/admin" ? "text-primary-500" : "text-neutral-500"}`} />
                      <span>Amministrazione</span>
                    </div>
                  </Link>
                )}
              </nav>
            </div>
          </div>
          
          <div className="p-4 border-t">
            <Link href="/settings" onClick={closeSidebar}>
              <div className="flex items-center px-4 py-4 text-neutral-800 rounded-lg hover:bg-neutral-50">
                <Settings className="h-5 w-5 mr-3 text-neutral-500" />
                <span>Impostazioni</span>
              </div>
            </Link>
            
            <div 
              className="flex items-center px-4 py-4 text-neutral-800 rounded-lg hover:bg-neutral-50 cursor-pointer mt-1"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3 text-neutral-500" />
              <span>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
