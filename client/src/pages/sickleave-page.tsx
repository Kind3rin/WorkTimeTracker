import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Calendar, Clock, FilePenLine, FileText, Trash2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Schema per la richiesta di malattia
const sickLeaveSchema = z.object({
  userId: z.number(),
  startDate: z.date({
    required_error: "La data di inizio è obbligatoria",
  }),
  endDate: z.date({
    required_error: "La data di fine è obbligatoria",
  }),
  protocolNumber: z.string().min(1, { message: "Il numero di protocollo è obbligatorio" }),
  note: z.string().optional(),
  status: z.string().default("pending"),
}).refine(data => {
  return data.endDate >= data.startDate;
}, {
  message: "La data di fine deve essere successiva o uguale alla data di inizio",
  path: ["endDate"],
});

// Tipo per il form della richiesta di malattia
type SickLeaveFormValues = z.infer<typeof sickLeaveSchema>;

// Tipo per la richiesta di malattia recuperata
interface SickLeave {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  protocolNumber: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function SickleavePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentSickLeave, setCurrentSickLeave] = useState<SickLeave | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Query per recuperare le richieste di malattia
  const { data: sickLeaves = [], isLoading } = useQuery<SickLeave[]>({
    queryKey: ['/api/sickleaves', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/sickleaves?userId=${user?.id}`);
      if (!res.ok) throw new Error('Errore nel recupero delle richieste di malattia');
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Mutation per creare una nuova richiesta di malattia
  const createMutation = useMutation({
    mutationFn: async (data: SickLeaveFormValues) => {
      const res = await apiRequest('POST', '/api/sickleaves', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sickleaves', user?.id] });
      toast({
        title: "Richiesta inviata",
        description: "La richiesta di malattia è stata inviata con successo.",
      });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation per aggiornare una richiesta di malattia
  const updateMutation = useMutation({
    mutationFn: async (data: SickLeaveFormValues & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest('PATCH', `/api/sickleaves/${id}`, rest);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sickleaves', user?.id] });
      toast({
        title: "Richiesta aggiornata",
        description: "La richiesta di malattia è stata aggiornata con successo.",
      });
      setIsFormOpen(false);
      setIsEditing(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation per eliminare una richiesta di malattia
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/sickleaves/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sickleaves', user?.id] });
      toast({
        title: "Richiesta eliminata",
        description: "La richiesta di malattia è stata eliminata con successo.",
      });
      setIsDeleteAlertOpen(false);
      setCurrentSickLeave(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Inizializzazione del form
  const form = useForm<SickLeaveFormValues>({
    resolver: zodResolver(sickLeaveSchema),
    defaultValues: {
      userId: user?.id || 0,
      note: "",
      status: "pending",
    },
  });

  // Funzione per aprire il form di modifica
  const openEditModal = (sickLeave: SickLeave) => {
    form.reset({
      userId: user?.id || 0,
      startDate: new Date(sickLeave.startDate),
      endDate: new Date(sickLeave.endDate),
      protocolNumber: sickLeave.protocolNumber,
      note: sickLeave.note || "",
      status: sickLeave.status,
    });
    setCurrentSickLeave(sickLeave);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  // Funzione per aprire il dettaglio di una richiesta
  const openDetailModal = (sickLeave: SickLeave) => {
    setCurrentSickLeave(sickLeave);
    setIsDetailOpen(true);
  };

  // Funzione per aprire il dialogo di conferma eliminazione
  const openDeleteAlert = (sickLeave: SickLeave) => {
    setCurrentSickLeave(sickLeave);
    setIsDeleteAlertOpen(true);
  };

  // Funzione per calcolare la durata della malattia
  const calculateDuration = (startDate: Date, endDate: Date): number => {
    return differenceInDays(endDate, startDate) + 1;
  };

  // Funzione di gestione dell'invio del form
  const onSubmit = (data: SickLeaveFormValues) => {
    if (isEditing && currentSickLeave) {
      updateMutation.mutate({ ...data, id: currentSickLeave.id });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filtra le richieste di malattia in base al tab attivo
  const filteredSickLeaves = sickLeaves.filter(sickLeave => {
    if (activeTab === "all") return true;
    return sickLeave.status === activeTab;
  });

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      
      <div className="lg:ml-64 flex-1">
        <TopBar />
        
        <div className="p-6">
          <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Malattia</h1>
              <p className="text-neutral-500">Gestisci le tue richieste di malattia</p>
            </div>
            
            <Button onClick={() => {
              form.reset({
                userId: user?.id || 0,
                note: "",
                status: "pending",
              });
              setIsEditing(false);
              setIsFormOpen(true);
            }} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nuova richiesta
            </Button>
          </header>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
              <TabsTrigger value="all">Tutte</TabsTrigger>
              <TabsTrigger value="pending">In attesa</TabsTrigger>
              <TabsTrigger value="approved">Approvate</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : filteredSickLeaves.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-800 mb-1">Nessuna richiesta di malattia trovata</h3>
                    <p className="text-neutral-500 mb-4">Non hai ancora inserito richieste di malattia in questa categoria.</p>
                    <Button onClick={() => {
                      form.reset({
                        userId: user?.id || 0,
                        note: "",
                        status: "pending",
                      });
                      setIsEditing(false);
                      setIsFormOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova richiesta
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredSickLeaves.map((sickLeave) => (
                    <Card key={sickLeave.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg mb-1">
                              Malattia - Prot. {sickLeave.protocolNumber}
                            </CardTitle>
                            <CardDescription>
                              Richiesta del {format(new Date(sickLeave.createdAt), "d MMMM yyyy", { locale: it })}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={
                              sickLeave.status === "approved" ? "default" :
                              sickLeave.status === "rejected" ? "destructive" : "outline"
                            }
                            className={sickLeave.status === "approved" ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {sickLeave.status === "pending" ? "In attesa" :
                             sickLeave.status === "approved" ? "Approvata" : "Respinta"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-0">
                        <div className="space-y-3">
                          <div className="flex items-center text-neutral-600">
                            <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                            <span className="text-sm">Dal {format(new Date(sickLeave.startDate), "d MMM yyyy", { locale: it })} al {format(new Date(sickLeave.endDate), "d MMM yyyy", { locale: it })}</span>
                          </div>
                          <div className="flex items-center text-neutral-600">
                            <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                            <span className="text-sm">
                              {calculateDuration(new Date(sickLeave.startDate), new Date(sickLeave.endDate))} {
                                calculateDuration(new Date(sickLeave.startDate), new Date(sickLeave.endDate)) === 1 ? "giorno" : "giorni"
                              }
                            </span>
                          </div>
                          {sickLeave.note && (
                            <div className="text-sm text-neutral-500 line-clamp-2">
                              {sickLeave.note}
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 flex justify-between">
                        <Button variant="ghost" size="sm" onClick={() => openDetailModal(sickLeave)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Dettagli
                        </Button>
                        {sickLeave.status === "pending" && (
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(sickLeave)}>
                              <FilePenLine className="h-4 w-4 mr-2" />
                              Modifica
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openDeleteAlert(sickLeave)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Dialog per creazione/modifica richiesta di malattia */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifica richiesta di malattia" : "Nuova richiesta di malattia"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifica i dettagli della richiesta di malattia" : "Inserisci i dettagli della tua richiesta di malattia"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="protocolNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero di protocollo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Inserisci il numero di protocollo" />
                    </FormControl>
                    <FormDescription>
                      Inserisci il numero di protocollo fornito dal medico
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data di inizio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "d MMMM yyyy", { locale: it })
                              ) : (
                                <span>Seleziona data</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("2023-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data di fine</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "d MMMM yyyy", { locale: it })
                              ) : (
                                <span>Seleziona data</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const startDate = form.getValues("startDate");
                              return !startDate || date < new Date("2023-01-01");
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Inserisci eventuali note aggiuntive"
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Aggiornamento..." : "Invio..."}
                    </>
                  ) : (
                    isEditing ? "Aggiorna richiesta" : "Invia richiesta"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog per visualizzare i dettagli */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Dettagli richiesta di malattia</DialogTitle>
            <DialogDescription>
              Visualizza i dettagli completi della richiesta
            </DialogDescription>
          </DialogHeader>
          
          {currentSickLeave && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-500">Stato</span>
                <Badge 
                  variant={
                    currentSickLeave.status === "approved" ? "default" :
                    currentSickLeave.status === "rejected" ? "destructive" : "outline"
                  }
                  className={currentSickLeave.status === "approved" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {currentSickLeave.status === "pending" ? "In attesa" :
                   currentSickLeave.status === "approved" ? "Approvata" : "Respinta"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-neutral-500">Data inizio</span>
                  <p>{format(new Date(currentSickLeave.startDate), "d MMMM yyyy", { locale: it })}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-neutral-500">Data fine</span>
                  <p>{format(new Date(currentSickLeave.endDate), "d MMMM yyyy", { locale: it })}</p>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-neutral-500">Durata</span>
                <p>{calculateDuration(new Date(currentSickLeave.startDate), new Date(currentSickLeave.endDate))} {
                  calculateDuration(new Date(currentSickLeave.startDate), new Date(currentSickLeave.endDate)) === 1 ? "giorno" : "giorni"
                }</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-neutral-500">Numero protocollo</span>
                <p>{currentSickLeave.protocolNumber}</p>
              </div>
              
              {currentSickLeave.note && (
                <div>
                  <span className="text-sm font-medium text-neutral-500">Note</span>
                  <p className="whitespace-pre-wrap">{currentSickLeave.note}</p>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium text-neutral-500">Data richiesta</span>
                <p>{format(new Date(currentSickLeave.createdAt), "d MMMM yyyy", { locale: it })}</p>
              </div>
              
              <DialogFooter className="mt-6">
                <Button onClick={() => setIsDetailOpen(false)}>
                  Chiudi
                </Button>
                {currentSickLeave.status === "pending" && (
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => {
                      setIsDetailOpen(false);
                      openEditModal(currentSickLeave);
                    }}>
                      <FilePenLine className="h-4 w-4 mr-2" />
                      Modifica
                    </Button>
                    <Button variant="destructive" onClick={() => {
                      setIsDetailOpen(false);
                      openDeleteAlert(currentSickLeave);
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog di conferma eliminazione */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questa richiesta?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La richiesta di malattia verrà rimossa definitivamente dal sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => currentSickLeave && deleteMutation.mutate(currentSickLeave.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                "Elimina"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}