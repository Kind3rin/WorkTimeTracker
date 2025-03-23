import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Clock, 
  DollarSign, 
  MapPin, 
  Calendar,
  Activity,
  BarChart,
  Menu
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  
  const mainLinks = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/timesheet", icon: Clock, label: "Consuntivi" },
    { href: "/expenses", icon: DollarSign, label: "Spese" },
    { href: "/trips", icon: MapPin, label: "Trasferte" },
  ];
  
  const moreLinks = [
    { href: "/timeoff", icon: Calendar, label: "Ferie" },
    { href: "/sickleave", icon: Activity, label: "Malattia" },
    { href: "/reports", icon: BarChart, label: "Report" },
  ];

  if (user?.role === "admin") {
    moreLinks.push({ href: "/admin", icon: BarChart, label: "Admin" });
  }

  const toggleMoreMenu = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen);
  };

  return (
    <>
      {/* Overlay for More Menu */}
      {isMoreMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsMoreMenuOpen(false)}
        />
      )}
    
      {/* More Menu */}
      <div 
        className={`fixed bottom-16 right-0 left-0 bg-white rounded-t-xl shadow-lg transform transition-transform duration-200 ease-out z-50 ${
          isMoreMenuOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-4 grid grid-cols-3 gap-4">
          {moreLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              onClick={() => setIsMoreMenuOpen(false)}
            >
              <div className={`flex flex-col items-center justify-center p-3 rounded-md ${
                location === link.href ? 'bg-primary-50 text-primary-500' : 'text-neutral-600'
              }`}>
                <link.icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 lg:hidden">
        <div className="flex items-center justify-around h-16">
          {mainLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex flex-col items-center">
                <div className={`p-1.5 ${location === link.href ? 'text-primary-500' : 'text-neutral-500'}`}>
                  <link.icon className="h-6 w-6" />
                </div>
                <span className={`text-xs mt-0.5 ${location === link.href ? 'font-medium text-primary-500' : 'text-neutral-500'}`}>
                  {link.label}
                </span>
              </div>
            </Link>
          ))}
          
          <button 
            onClick={toggleMoreMenu}
            className="flex flex-col items-center"
          >
            <div className={`p-1.5 ${isMoreMenuOpen ? 'text-primary-500' : 'text-neutral-500'}`}>
              <Menu className="h-6 w-6" />
            </div>
            <span className={`text-xs mt-0.5 ${isMoreMenuOpen ? 'font-medium text-primary-500' : 'text-neutral-500'}`}>
              Altro
            </span>
          </button>
        </div>
      </div>
    </>
  );
}