import { Link } from "wouter";
import { 
  LayoutDashboard, 
  Clock, 
  DollarSign, 
  MapPin, 
  Calendar,
  Activity,
  BarChart,
  Menu,
  Settings,
  X,
  type LucideIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Interfaccia per le impostazioni utente
interface UserSettings {
  favoriteLinks: string[];
  companyTheme: any | null;
  companyModules: string[];
}

// Interfaccia per i link di navigazione
interface NavLink {
  id: string;
  href: string;
  icon: LucideIcon;
  label: string;
  isDefault: boolean;
}

export default function BottomNav() {
  // Usa window.location.pathname invece di useLocation per compatibilità
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { user } = useAuth();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  // Per il supporto multitenancy (diverse aziende)
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  // Carica le impostazioni dell'azienda e dell'utente
  useEffect(() => {
    // In futuro, queste potrebbero essere caricate da un'API con parametri specifici dell'azienda
    const loadCompanySettings = async () => {
      if (user) {
        try {
          // Questo sarebbe un endpoint API reale in produzione
          // Il companyId potrebbe essere incluso nelle informazioni dell'utente
          // o configurato all'avvio dell'app
          // Nota: user.companyId non esiste ancora nello schema, quindi usiamo localStorage o default
          const companyIdentifier = localStorage.getItem('companyId') || 'default';
          setCompanyId(companyIdentifier);
          
          // Simuliamo il caricamento di impostazioni personalizzate per questa azienda
          // In un'implementazione reale, queste verrebbero recuperate dal server
          // con un endpoint come /api/companies/{companyId}/settings
          
          // Per ora, imposta le impostazioni predefinite
          setUserSettings(prev => ({
            ...prev,
            // Le impostazioni potrebbero variare in base all'azienda
            companyModules: ['dashboard', 'timesheet', 'expenses', 'trips']
          }));
        } catch (error) {
          console.error("Errore nel caricamento delle impostazioni dell'azienda:", error);
        }
      }
    };
    
    loadCompanySettings();
  }, [user]);
  
  // Aggiorna il percorso quando cambia
  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Aggiorna all'inizio e quando cambia la posizione
    updatePath();
    window.addEventListener('popstate', updatePath);
    
    return () => {
      window.removeEventListener('popstate', updatePath);
    };
  }, []);
  
  // In futuro, queste impostazioni potrebbero essere caricate dalle preferenze utente salvate
  // e rese personalizzabili attraverso un'interfaccia utente dedicata
  const [userSettings, setUserSettings] = useState({
    favoriteLinks: [] as string[], // array di percorsi preferiti dell'utente
    companyTheme: null, // tema specifico dell'azienda (colori, logo, ecc.)
    companyModules: [] as string[] // moduli attivati per l'azienda specifica
  });
  
  // Definizione di tutti i link possibili (saranno filtrati in base a ruolo e attivazione dei moduli)
  const availableLinks = [
    { id: 'dashboard', href: "/", icon: LayoutDashboard, label: "Dashboard", isDefault: true, requiredModule: 'dashboard' },
    { id: 'timesheet', href: "/timesheet", icon: Clock, label: "Consuntivi", isDefault: true, requiredModule: 'timesheet' },
    { id: 'expenses', href: "/expenses", icon: DollarSign, label: "Spese", isDefault: true, requiredModule: 'expenses' },
    { id: 'trips', href: "/trips", icon: MapPin, label: "Trasferte", isDefault: true, requiredModule: 'trips' },
    { id: 'timeoff', href: "/timeoff", icon: Calendar, label: "Ferie", isDefault: false, requiredModule: 'timeoff' },
    { id: 'sickleave', href: "/sickleave", icon: Activity, label: "Malattia", isDefault: false, requiredModule: 'sickleave' },
    { id: 'reports', href: "/reports", icon: BarChart, label: "Report", isDefault: false, requiredModule: 'reports' },
    { id: 'settings', href: "/settings", icon: Settings, label: "Impostazioni", isDefault: false, requiredModule: null },
  ];
  
  // Filtra i link in base ai moduli abilitati per l'azienda
  const filteredByModules = availableLinks.filter(link => 
    link.requiredModule === null || 
    userSettings.companyModules.includes(link.requiredModule)
  );
  
  // Se l'utente ha preferenze salvate, usale, altrimenti usa i link predefiniti tra quelli disponibili
  const mainLinks = userSettings.favoriteLinks.length > 0
    ? filteredByModules.filter(link => userSettings.favoriteLinks.includes(link.id))
    : filteredByModules.filter(link => link.isDefault);
    
  // Tutti i link non presenti nella barra principale
  const allMainLinks = mainLinks.slice(0, 4); // Limitiamo a 4 link principali per non affollare la barra
  
  // Link aggiuntivi da mostrare nel menu "Altro"
  // Filtra i link che non sono nella barra principale ma che sono disponibili per l'utente
  // e sono abilitati per l'azienda corrente
  const moreLinks = filteredByModules
    .filter(link => !allMainLinks.some(mainLink => mainLink.href === link.href))
    .map(link => ({ 
      href: link.href, 
      icon: link.icon, 
      label: link.label 
    }));

  // Aggiunge link di amministrazione se l'utente è admin
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
                currentPath === link.href ? 'bg-primary-50 text-primary-500' : 'text-neutral-600'
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
          {allMainLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex flex-col items-center">
                <div className={`p-1.5 ${currentPath === link.href ? 'text-primary-500' : 'text-neutral-500'}`}>
                  <link.icon className="h-6 w-6" />
                </div>
                <span className={`text-xs mt-0.5 ${currentPath === link.href ? 'font-medium text-primary-500' : 'text-neutral-500'}`}>
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