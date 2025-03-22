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

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Calendar className="h-10 w-10 text-primary-500" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-800">WorkTrack</h1>
            <p className="mt-2 text-neutral-500">Gestione attività lavorative, diarie, trasferte e note spese</p>
          </div>

          <div className="w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">Accedi</h2>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Inserisci il tuo username" />
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
                        <Input type="password" {...field} placeholder="Inserisci la tua password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      
      {/* Info Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-500 text-white">
        <div className="w-full p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6">Sistema di Gestione Attività Lavorative</h2>
          <p className="mb-8">Gestisci facilmente tutti gli aspetti della tua attività lavorativa in un'unica piattaforma.</p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Consuntivi di Lavoro</h3>
                <p className="text-primary-50">Registra facilmente le tue ore di lavoro e attività quotidiane.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Note Spese</h3>
                <p className="text-primary-50">Gestisci e tieni traccia di tutte le tue spese lavorative.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Trasferte</h3>
                <p className="text-primary-50">Pianifica, registra e gestisci le tue trasferte aziendali.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ferie e Permessi</h3>
                <p className="text-primary-50">Tieni traccia delle tue ferie, permessi e giorni di malattia.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <BarChart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Report</h3>
                <p className="text-primary-50">Genera report dettagliati sulle tue attività lavorative.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
