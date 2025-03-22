import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { MapPin, Search, Filter, Loader2, Plus, Calendar, ChevronRight } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema for new trip
const tripSchema = z.object({
  destination: z.string().min(1, { message: "La destinazione è obbligatoria" }),
  startDate: z.string().min(1, { message: "La data di inizio è obbligatoria" }),
  endDate: z.string().min(1, { message: "La data di fine è obbligatoria" }),
  purpose: z.string().min(1, { message: "Lo scopo della trasferta è obbligatorio" }),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "La data di fine deve essere successiva alla data di inizio",
  path: ["endDate"],
});

type TripFormValues = z.infer<typeof tripSchema>;

export default function Trips() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Get all trips
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: !!user,
  });

  // Form setup
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      destination: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      purpose: "",
    },
  });

  // Trip mutation
  const tripMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/trips", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Trasferta registrata",
        description: "La trasferta è stata registrata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setIsDialogOpen(false);
      form.reset({
        destination: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        purpose: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la registrazione della trasferta.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: TripFormValues) {
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per registrare una trasferta.",
        variant: "destructive",
      });
      return;
    }
    
    tripMutation.mutate({
      userId: user.id,
      destination: data.destination,
      startDate: data.startDate, // send as string, not as Date object
      endDate: data.endDate, // send as string, not as Date object
      purpose: data.purpose,
      status: "pending",
    });
  }

  const today = new Date();
  
  // Split trips into upcoming, ongoing, and past
  const upcomingTrips = trips.filter(trip => new Date(trip.startDate) > today);
  const ongoingTrips = trips.filter(trip => 
    new Date(trip.startDate) <= today && new Date(trip.endDate) >= today
  );
  const pastTrips = trips.filter(trip => new Date(trip.endDate) < today);
  
  // Get active trips based on tab
  const getActiveTrips = () => {
    switch (activeTab) {
      case "upcoming":
        return upcomingTrips;
      case "ongoing":
        return ongoingTrips;
      case "past":
        return pastTrips;
      default:
        return trips;
    }
  };
  
  // Filter trips
  const filteredTrips = getActiveTrips()
    .filter(trip => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status
      const matchesStatus = !filterStatus || trip.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (activeTab === "past") {
        // For past trips, show most recent first
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      } else {
        // For upcoming and ongoing trips, show soonest first
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
    });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approvato</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rifiutato</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completato</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Attesa</Badge>;
    }
  };
  
  // Calculate duration
  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = differenceInDays(end, start) + 1;
    return days === 1 ? "1 giorno" : `${days} giorni`;
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      
      <div className="lg:ml-64 flex-1 min-h-screen">
        <div className="p-6">
          <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Trasferte</h1>
              <p className="text-neutral-500">Gestione delle trasferte e missioni</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Trasferta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registra Nuova Trasferta</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destinazione</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Es. Milano" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data di inizio</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data di fine</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scopo della trasferta</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descrivi lo scopo della trasferta" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="mr-2">Annulla</Button>
                  </DialogClose>
                  <Button 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={tripMutation.isPending}
                  >
                    {tripMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      "Salva"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </header>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="upcoming" className="px-4">
                In Programma ({upcomingTrips.length})
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="px-4">
                In Corso ({ongoingTrips.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="px-4">
                Passate ({pastTrips.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Cerca trasferte..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sm:w-64">
              <Select onValueChange={(val) => setFilterStatus(val)} value={filterStatus || ""}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-neutral-400" />
                    <SelectValue placeholder="Filtra per stato" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="pending">In Attesa</SelectItem>
                  <SelectItem value="approved">Approvato</SelectItem>
                  <SelectItem value="rejected">Rifiutato</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => (
                  <Card key={trip.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-primary-500" />
                          <CardTitle className="text-lg">{trip.destination}</CardTitle>
                        </div>
                        {getStatusBadge(trip.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                          <span>{format(new Date(trip.startDate), "dd/MM/yyyy", { locale: it })} - {format(new Date(trip.endDate), "dd/MM/yyyy", { locale: it })}</span>
                        </div>
                        <div className="text-sm text-neutral-500">
                          <span className="font-medium">Durata:</span> {getDuration(trip.startDate, trip.endDate)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Scopo:</span> {trip.purpose}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 border-t flex justify-end">
                      <Button variant="ghost" size="sm" className="text-primary-500">
                        Dettagli
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex justify-center py-10 text-neutral-500">
                  Nessuna trasferta trovata {activeTab === "upcoming" ? "in programma" : activeTab === "ongoing" ? "in corso" : "passata"}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <footer className="mt-10 border-t py-6 px-6 text-center text-neutral-500 text-sm">
          <p>&copy; 2023 WorkTrack - Sistema di Gestione Attività Lavorative. Tutti i diritti riservati.</p>
        </footer>
      </div>
    </div>
  );
}
