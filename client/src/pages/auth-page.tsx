import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Calendar, Clock, DollarSign, MapPin, BarChart } from "lucide-react";
import { insertUserSchema } from "@shared/schema";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

// Registration form schema
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      role: "employee",
    },
  });
  
  // Redirect se l'utente è già autenticato
  if (user) {
    return <Redirect to="/" />;
  }
  
  // Mostra un loader durante il caricamento dell'utente
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  function onRegisterSubmit(data: RegisterFormValues) {
    // Remove confirmPassword before submitting
    const { confirmPassword, ...userData } = data;
    // Ensure role is set to employee
    registerMutation.mutate({
      ...userData,
      role: "employee"
    });
  }



  // Per salvare l'ID dell'azienda nel localStorage quando l'utente accede
  useEffect(() => {
    // Recupera il parametro companyId dall'URL se presente
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('companyId');
    
    if (companyId) {
      localStorage.setItem('companyId', companyId);
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
      {/* Form Section - Ottimizzato per Mobile */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Calendar className="h-10 w-10 text-primary-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">WorkTracker Pro</h1>
            <p className="mt-2 text-sm sm:text-base text-neutral-500">Gestione attività lavorative, diarie, trasferte e note spese</p>
          </div>

          <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Accedi</h2>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Inserisci il tuo username"
                          className="h-11" // Aumentato per il tocco mobile
                          autoComplete="username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          placeholder="Inserisci la tua password"
                          className="h-11" // Aumentato per il tocco mobile 
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base" // Aumentato per il tocco mobile
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Accesso in corso...
                    </>
                  ) : (
                    "Accedi"
                  )}
                </Button>
              </form>
            </Form>
            <p className="mt-4 text-sm text-center text-gray-500">
              Per ottenere le credenziali di accesso, contatta l'amministratore del sistema.
            </p>
          </div>
        </div>
      </div>
      
      {/* Info Section with Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-400 text-white">
        {/* SVG Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#smallGrid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Calendar and Clock SVG Illustration */}
        <div className="absolute inset-0 flex items-center justify-center opacity-80">
          <svg width="70%" height="70%" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
            {/* Calendar */}
            <rect x="150" y="100" width="400" height="350" rx="20" fill="white" />
            <rect x="150" y="100" width="400" height="60" rx="20" fill="#f8fafc" />
            <rect x="150" y="160" width="400" height="1" fill="#e2e8f0" />
            
            {/* Calendar Header */}
            <text x="350" y="140" fontSize="24" textAnchor="middle" fill="#334155">MARZO 2025</text>
            
            {/* Calendar Days */}
            <text x="190" y="200" fontSize="16" textAnchor="middle" fill="#64748b">LUN</text>
            <text x="240" y="200" fontSize="16" textAnchor="middle" fill="#64748b">MAR</text>
            <text x="290" y="200" fontSize="16" textAnchor="middle" fill="#64748b">MER</text>
            <text x="340" y="200" fontSize="16" textAnchor="middle" fill="#64748b">GIO</text>
            <text x="390" y="200" fontSize="16" textAnchor="middle" fill="#64748b">VEN</text>
            <text x="440" y="200" fontSize="16" textAnchor="middle" fill="#64748b">SAB</text>
            <text x="490" y="200" fontSize="16" textAnchor="middle" fill="#64748b">DOM</text>
            
            {/* Calendar Grid */}
            <g fill="#334155">
              {/* Week 1 */}
              <text x="190" y="250" fontSize="18" textAnchor="middle">1</text>
              <text x="240" y="250" fontSize="18" textAnchor="middle">2</text>
              <text x="290" y="250" fontSize="18" textAnchor="middle">3</text>
              <text x="340" y="250" fontSize="18" textAnchor="middle">4</text>
              <text x="390" y="250" fontSize="18" textAnchor="middle">5</text>
              <text x="440" y="250" fontSize="18" textAnchor="middle">6</text>
              <text x="490" y="250" fontSize="18" textAnchor="middle">7</text>
              
              {/* Week 2 */}
              <text x="190" y="300" fontSize="18" textAnchor="middle">8</text>
              <text x="240" y="300" fontSize="18" textAnchor="middle">9</text>
              <text x="290" y="300" fontSize="18" textAnchor="middle">10</text>
              <text x="340" y="300" fontSize="18" textAnchor="middle">11</text>
              <text x="390" y="300" fontSize="18" textAnchor="middle">12</text>
              <text x="440" y="300" fontSize="18" textAnchor="middle">13</text>
              <text x="490" y="300" fontSize="18" textAnchor="middle">14</text>
              
              {/* Week 3 */}
              <text x="190" y="350" fontSize="18" textAnchor="middle">15</text>
              <text x="240" y="350" fontSize="18" textAnchor="middle">16</text>
              <text x="290" y="350" fontSize="18" textAnchor="middle">17</text>
              <text x="340" y="350" fontSize="18" textAnchor="middle">18</text>
              <text x="390" y="350" fontSize="18" textAnchor="middle">19</text>
              <text x="440" y="350" fontSize="18" textAnchor="middle">20</text>
              <text x="490" y="350" fontSize="18" textAnchor="middle">21</text>
              
              {/* Current Date Highlight */}
              <circle cx="340" cy="350" r="22" fill="#0ea5e9" opacity="0.2" />
              <circle cx="340" cy="350" r="18" stroke="#0ea5e9" strokeWidth="2" fill="none" />
            </g>
            
            {/* Clock */}
            <circle cx="600" cy="200" r="120" fill="white" stroke="#e2e8f0" strokeWidth="10" />
            <circle cx="600" cy="200" r="10" fill="#334155" />
            
            {/* Clock hands */}
            <line x1="600" y1="200" x2="600" y2="120" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
            <line x1="600" y1="200" x2="660" y2="240" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
            
            {/* Clock ticks */}
            <line x1="600" y1="80" x2="600" y2="100" stroke="#64748b" strokeWidth="4" />
            <line x1="720" y1="200" x2="700" y2="200" stroke="#64748b" strokeWidth="4" />
            <line x1="600" y1="320" x2="600" y2="300" stroke="#64748b" strokeWidth="4" />
            <line x1="480" y1="200" x2="500" y2="200" stroke="#64748b" strokeWidth="4" />
            
            {/* Time marks */}
            <text x="600" y="70" fontSize="24" textAnchor="middle" fill="#334155">12</text>
            <text x="730" y="208" fontSize="24" textAnchor="middle" fill="#334155">3</text>
            <text x="600" y="340" fontSize="24" textAnchor="middle" fill="#334155">6</text>
            <text x="470" y="208" fontSize="24" textAnchor="middle" fill="#334155">9</text>
            
            {/* Task Icons */}
            <circle cx="240" cy="350" r="12" fill="#10b981" opacity="0.8" />
            <rect x="380" y="248" width="20" height="4" rx="2" fill="#f43f5e" />
            <rect x="380" y="256" width="20" height="4" rx="2" fill="#f43f5e" />
          </svg>
        </div>
        
        {/* Content Over Image */}
        <div className="relative w-full p-10 flex flex-col justify-end z-10 bg-gradient-to-t from-primary-600 via-primary-600/70 to-transparent h-full">
          <h2 className="text-3xl font-bold mb-6">Sistema di Gestione Attività Lavorative</h2>
          <p className="mb-8">Gestisci facilmente tutti gli aspetti della tua attività lavorativa in un'unica piattaforma.</p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="mr-4 mt-1 p-2 bg-white/20 rounded-full">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Consuntivi di Lavoro</h3>
                <p className="text-primary-50 text-sm">Registra facilmente le ore di lavoro.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 mt-1 p-2 bg-white/20 rounded-full">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Note Spese</h3>
                <p className="text-primary-50 text-sm">Gestisci tutte le spese lavorative.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 mt-1 p-2 bg-white/20 rounded-full">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Trasferte</h3>
                <p className="text-primary-50 text-sm">Pianifica e gestisci trasferte.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 mt-1 p-2 bg-white/20 rounded-full">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ferie e Permessi</h3>
                <p className="text-primary-50 text-sm">Gestisci ferie e malattie.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
