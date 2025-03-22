import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, useRoute } from "wouter";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Schema per la validazione del modulo
const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, "La password deve contenere almeno 8 caratteri")
    .max(100, "La password non può superare i 100 caratteri"),
  confirmPassword: z.string()
    .min(8, "La password deve contenere almeno 8 caratteri")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function InvitationPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/invitation/:token");
  const token = params?.token;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string, username: string } | null>(null);
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Verifica validità del token all'avvio
  useEffect(() => {
    if (!token) {
      setError("Token di invito mancante");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await apiRequest("GET", `/api/invitation/${token}`);
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Token non valido o scaduto");
        }
        
        const data = await res.json();
        setUserInfo({
          name: data.user.fullName,
          username: data.user.username
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore durante la verifica del token");
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Gestione invio del form per impostare la nuova password
  const onSubmit = async (data: PasswordFormValues) => {
    try {
      setLoading(true);
      const res = await apiRequest("POST", `/api/invitation/${token}`, {
        newPassword: data.newPassword
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Errore durante l'impostazione della password");
      }

      setSuccess(true);
      // Reindirizza alla dashboard dopo 3 secondi
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'impostazione della password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Accetta l'invito</CardTitle>
          <CardDescription className="text-center">
            {loading ? "Verifica token in corso..." : 
             userInfo ? `Benvenuto, ${userInfo.name}!` : 
             "Imposta la tua nuova password per accedere"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Caricamento in corso...</span>
            </div>
          )}
          
          {error && !loading && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-500 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Successo</AlertTitle>
              <AlertDescription>
                Password impostata correttamente. Verrai reindirizzato alla dashboard tra pochi secondi...
              </AlertDescription>
            </Alert>
          )}
          
          {!loading && userInfo && !success && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-blue-700">
                    Il tuo nome utente è: <strong>{userInfo.username}</strong>
                  </p>
                </div>
                
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuova Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Inserisci la nuova password" 
                          autoComplete="new-password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conferma Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Conferma la nuova password" 
                          autoComplete="new-password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Attendere...
                    </>
                  ) : "Imposta Password e Accedi"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-xs text-gray-500 text-center">
            Questo link è valido per sole 24 ore. Se hai problemi, contatta l'amministratore.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}