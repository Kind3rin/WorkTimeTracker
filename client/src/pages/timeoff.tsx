import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO, differenceInDays, addDays, isFuture, isPast, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, Filter, Loader2, Plus, Check, X, Info, Clock } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Form schema for new leave request
const leaveRequestSchema = z.object({
  startDate: z.string().min(1, { message: "La data di inizio è obbligatoria" }),
  endDate: z.string().min(1, { message: "La data di fine è obbligatoria" }),
  type: z.string().min(1, { message: "Il tipo di assenza è obbligatorio" }),
  reason: z.string().optional(),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "La data di fine deve essere successiva alla data di inizio",
  path: ["endDate"],
});

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

export default function TimeOff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Get all leave requests
  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ["/api/leave-requests"],
    enabled: !!user,
  });

  // Form setup
  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      startDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      type: "",
      reason: "",
    },
  });

  // Leave request mutation
  const leaveRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/leave-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta inviata",
        description: "La richiesta di assenza è stata inviata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setIsDialogOpen(false);
      form.reset({
        startDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        type: "",
        reason: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio della richiesta.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: LeaveRequestFormValues) {
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per inviare una richiesta.",
        variant: "destructive",
      });
      return;
    }
    
    leaveRequestMutation.mutate({
      userId: user.id,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      type: data.type,
      reason: data.reason || "",
      status: "pending",
    });
  }

  const today = new Date();
  
  // Split leave requests into upcoming, ongoing, and past
  const upcomingLeaves = leaveRequests.filter(leave => 
    new Date(leave.startDate) > today && leave.status !== 'rejected'
  );
  const ongoingLeaves = leaveRequests.filter(leave => 
    new Date(leave.startDate) <= today && 
    new Date(leave.endDate) >= today && 
    leave.status !== 'rejected'
  );
  const pastLeaves = leaveRequests.filter(leave => 
    new Date(leave.endDate) < today || leave.status === 'rejected'
  );
  
  // Get active leaves based on tab
  const getActiveLeaves = () => {
    switch (activeTab) {
      case "upcoming":
        return upcomingLeaves;
      case "ongoing":
        return ongoingLeaves;
      case "past":
        return pastLeaves;
      default:
        return leaveRequests;
    }
  };
  
  // Filter leaves
  const filteredLeaves = getActiveLeaves()
    .filter(leave => {
      // Filter by type
      const matchesType = !filterType || leave.type === filterType;
      return matchesType;
    })
    .sort((a, b) => {
      if (activeTab === "past") {
        // For past leaves, show most recent first
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      } else {
        // For upcoming and ongoing leaves, show soonest first
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
    });

  // Leave types
  const leaveTypes = [
    { value: "vacation", label: "Ferie" },
    { value: "sick_leave", label: "Malattia" },
    { value: "personal_leave", label: "Permesso Personale" },
  ];

  // Get leave type label
  const getLeaveTypeLabel = (type: string) => {
    const typeObj = leaveTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : "Sconosciuto";
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approvato</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rifiutato</Badge>;
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

  // Calculate leave statistics
  const calculateLeaveStats = () => {
    // Define annual allowances
    const annualAllowances = {
      vacation: 25, // Annual vacation days
      sick_leave: 15, // Sick leave days
      personal_leave: 5, // Personal leave days
    };
    
    // Initialize counters
    const used = {
      vacation: 0,
      sick_leave: 0,
      personal_leave: 0,
    };
    
    // Calculate used days for approved and pending requests
    leaveRequests.forEach(leave => {
      if (leave.status !== 'rejected' && leave.type in used) {
        const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
        used[leave.type as keyof typeof used] += days;
      }
    });
    
    // Calculate remaining days
    const remaining = {
      vacation: Math.max(0, annualAllowances.vacation - used.vacation),
      sick_leave: Math.max(0, annualAllowances.sick_leave - used.sick_leave),
      personal_leave: Math.max(0, annualAllowances.personal_leave - used.personal_leave),
    };
    
    // Calculate percentages used
    const percentages = {
      vacation: Math.min(100, Math.round((used.vacation / annualAllowances.vacation) * 100)),
      sick_leave: Math.min(100, Math.round((used.sick_leave / annualAllowances.sick_leave) * 100)),
      personal_leave: Math.min(100, Math.round((used.personal_leave / annualAllowances.personal_leave) * 100)),
    };
    
    return { used, remaining, percentages, annualAllowances };
  };
  
  const leaveStats = calculateLeaveStats();
  
  // Get icon for leave type
  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'vacation':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'sick_leave':
        return <Clock className="h-5 w-5 text-red-500" />;
      case 'personal_leave':
        return <Info className="h-5 w-5 text-amber-500" />;
      default:
        return <Calendar className="h-5 w-5 text-neutral-500" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      
      <div className="lg:ml-64 flex-1 min-h-screen">
        <div className="p-6">
          <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Ferie e Permessi</h1>
              <p className="text-neutral-500">Gestione delle assenze, ferie e permessi</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Richiesta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Richiedi Assenza</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo di Assenza</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona il tipo di assenza" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {leaveTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {field.value && (
                            <FormDescription>
                              Giorni rimanenti: {leaveStats.remaining[field.value as keyof typeof leaveStats.remaining] || 0}
                            </FormDescription>
                          )}
                          
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
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo (opzionale)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descrivi il motivo della richiesta" />
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
                    disabled={leaveRequestMutation.isPending}
                  >
                    {leaveRequestMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      "Invia Richiesta"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </header>
          
          {/* Leave balances */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Ferie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-500">Utilizzati: {leaveStats.used.vacation} giorni</span>
                  <span className="text-sm font-semibold">{leaveStats.remaining.vacation} rimasti</span>
                </div>
                <Progress value={leaveStats.percentages.vacation} className="h-2" />
                <p className="text-xs text-neutral-500 mt-2">Su un totale di {leaveStats.annualAllowances.vacation} giorni annuali</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-red-500" />
                  Malattia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-500">Utilizzati: {leaveStats.used.sick_leave} giorni</span>
                  <span className="text-sm font-semibold">{leaveStats.remaining.sick_leave} rimasti</span>
                </div>
                <Progress value={leaveStats.percentages.sick_leave} className="h-2" />
                <p className="text-xs text-neutral-500 mt-2">Su un totale di {leaveStats.annualAllowances.sick_leave} giorni annuali</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium flex items-center">
                  <Info className="h-5 w-5 mr-2 text-amber-500" />
                  Permessi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-500">Utilizzati: {leaveStats.used.personal_leave} giorni</span>
                  <span className="text-sm font-semibold">{leaveStats.remaining.personal_leave} rimasti</span>
                </div>
                <Progress value={leaveStats.percentages.personal_leave} className="h-2" />
                <p className="text-xs text-neutral-500 mt-2">Su un totale di {leaveStats.annualAllowances.personal_leave} giorni annuali</p>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="upcoming" className="px-4">
                Pianificate ({upcomingLeaves.length})
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="px-4">
                In Corso ({ongoingLeaves.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="px-4">
                Passate ({pastLeaves.length})
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <Select onValueChange={(val) => setFilterType(val)} value={filterType || ""}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-neutral-400" />
                    <SelectValue placeholder="Filtra per tipo" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti i tipi</SelectItem>
                  {leaveTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Tabs>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => (
                  <Card key={leave.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {getLeaveTypeIcon(leave.type)}
                          <CardTitle className="text-lg ml-2">{getLeaveTypeLabel(leave.type)}</CardTitle>
                        </div>
                        {getStatusBadge(leave.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                          <span>{format(new Date(leave.startDate), "dd/MM/yyyy", { locale: it })} - {format(new Date(leave.endDate), "dd/MM/yyyy", { locale: it })}</span>
                        </div>
                        <div className="text-sm text-neutral-500">
                          <span className="font-medium">Durata:</span> {getDuration(leave.startDate, leave.endDate)}
                        </div>
                        {leave.reason && (
                          <div className="text-sm">
                            <span className="font-medium">Motivo:</span> {leave.reason}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    {leave.status === "pending" && isFuture(new Date(leave.startDate)) && (
                      <CardFooter className="pt-2 border-t flex justify-end">
                        <Button variant="outline" size="sm" className="h-8 text-red-500 mr-2">
                          <X className="h-4 w-4 mr-1" />
                          Annulla
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex justify-center py-10 text-neutral-500">
                  Nessuna assenza trovata {activeTab === "upcoming" ? "pianificata" : activeTab === "ongoing" ? "in corso" : "passata"}
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
