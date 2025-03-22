import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, UserCircle, Key, BellRing, PaletteIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema per il modulo del profilo
const profileFormSchema = z.object({
  fullName: z.string().min(1, { message: "Il nome completo è obbligatorio" }),
  email: z
    .string()
    .email({ message: "Inserisci un indirizzo email valido" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
});

// Schema per il modulo della password
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "La password attuale è obbligatoria" }),
    newPassword: z
      .string()
      .min(8, { message: "La password deve contenere almeno 8 caratteri" }),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Le password non corrispondono",
    path: ["confirmPassword"],
  });

// Schema per il modulo delle notifiche
const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyReports: z.boolean(),
  dueDateReminders: z.boolean(),
});

// Schema per il modulo delle preferenze
const preferencesFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["it", "en"]),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"]),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form per il profilo
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: "",
      phone: "",
      role: user?.role || "",
    },
  });

  // Form per la password
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Form per le notifiche
  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      dueDateReminders: true,
    },
  });

  // Form per le preferenze
  const preferencesForm = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      theme: "system",
      language: "it",
      dateFormat: "dd/MM/yyyy",
    },
  });

  // Funzione di salvataggio del profilo
  function onProfileSubmit(data: z.infer<typeof profileFormSchema>) {
    setIsSubmitting(true);
    // Simula un'operazione asincrona
    setTimeout(() => {
      toast({
        title: "Profilo aggiornato",
        description: "Le informazioni del profilo sono state aggiornate con successo.",
      });
      setIsSubmitting(false);
    }, 1500);
  }

  // Funzione di cambio password
  function onPasswordSubmit(data: z.infer<typeof passwordFormSchema>) {
    setIsSubmitting(true);
    // Simula un'operazione asincrona
    setTimeout(() => {
      toast({
        title: "Password aggiornata",
        description: "La password è stata modificata con successo.",
      });
      passwordForm.reset();
      setIsSubmitting(false);
    }, 1500);
  }

  // Funzione di salvataggio notifiche
  function onNotificationSubmit(data: z.infer<typeof notificationFormSchema>) {
    setIsSubmitting(true);
    // Simula un'operazione asincrona
    setTimeout(() => {
      toast({
        title: "Preferenze notifiche aggiornate",
        description: "Le preferenze di notifica sono state aggiornate con successo.",
      });
      setIsSubmitting(false);
    }, 1500);
  }

  // Funzione di salvataggio preferenze
  function onPreferencesSubmit(data: z.infer<typeof preferencesFormSchema>) {
    setIsSubmitting(true);
    // Simula un'operazione asincrona
    setTimeout(() => {
      toast({
        title: "Preferenze aggiornate",
        description: "Le preferenze dell'interfaccia sono state aggiornate con successo.",
      });
      setIsSubmitting(false);
    }, 1500);
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      
      <div className="lg:ml-64 flex-1 min-h-screen">
        <div className="p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-800">Impostazioni</h1>
            <p className="text-neutral-500">Gestisci le impostazioni dell'account</p>
          </header>
          
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 md:grid-cols-4 h-auto gap-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden md:inline">Profilo</span>
              </TabsTrigger>
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="hidden md:inline">Password</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                <span className="hidden md:inline">Notifiche</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <PaletteIcon className="h-4 w-4" />
                <span className="hidden md:inline">Preferenze</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Sezione Profilo */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profilo</CardTitle>
                  <CardDescription>
                    Gestisci le informazioni del tuo profilo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome completo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormDescription>
                              Questa email sarà utilizzata per le notifiche
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefono</FormLabel>
                            <FormControl>
                              <Input type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ruolo</FormLabel>
                            <FormControl>
                              <Input {...field} disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvataggio...
                          </>
                        ) : (
                          "Salva modifiche"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sezione Password */}
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Cambia password</CardTitle>
                  <CardDescription>
                    Aggiorna la tua password per mantenere sicuro il tuo account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password attuale</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nuova password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Deve contenere almeno 8 caratteri
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conferma nuova password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Aggiornamento...
                          </>
                        ) : (
                          "Cambia password"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sezione Notifiche */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notifiche</CardTitle>
                  <CardDescription>
                    Configura come desideri ricevere le notifiche
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Notifiche email</FormLabel>
                              <FormDescription>
                                Ricevi notifiche via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Notifiche push</FormLabel>
                              <FormDescription>
                                Ricevi notifiche push sul browser
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="weeklyReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Report settimanali</FormLabel>
                              <FormDescription>
                                Ricevi un report settimanale delle tue attività
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="dueDateReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Promemoria scadenze</FormLabel>
                              <FormDescription>
                                Ricevi promemoria per le scadenze imminenti
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvataggio...
                          </>
                        ) : (
                          "Salva preferenze"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sezione Preferenze */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferenze</CardTitle>
                  <CardDescription>
                    Personalizza l'aspetto e il comportamento dell'applicazione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                      <FormField
                        control={preferencesForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tema</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona un tema" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">Chiaro</SelectItem>
                                <SelectItem value="dark">Scuro</SelectItem>
                                <SelectItem value="system">Sistema</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Scegli il tema dell'interfaccia
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lingua</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona una lingua" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="it">Italiano</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Formato data</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona un formato data" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (31/12/2023)</SelectItem>
                                <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (12/31/2023)</SelectItem>
                                <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (2023-12-31)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Scegli come visualizzare le date nell'applicazione
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvataggio...
                          </>
                        ) : (
                          "Salva preferenze"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Footer */}
        <footer className="mt-10 border-t py-6 px-6 text-center text-neutral-500 text-sm">
          <p>&copy; 2023 WorkTrack - Sistema di Gestione Attività Lavorative. Tutti i diritti riservati.</p>
        </footer>
      </div>
    </div>
  );
}