import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Search, Filter, Loader2, Plus } from "lucide-react";
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

// Form schema for new time entry
const timeEntrySchema = z.object({
  date: z.string().min(1, { message: "La data è obbligatoria" }),
  projectId: z.string().min(1, { message: "Il progetto è obbligatorio" }),
  activityTypeId: z.string().min(1, { message: "Il tipo di attività è obbligatorio" }),
  description: z.string().min(1, { message: "La descrizione è obbligatoria" }),
  hours: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) <= 24,
    { message: "Le ore devono essere maggiori di 0 e non superiori a 24" }
  ),
});

type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;

export default function Timesheet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get projects for filter and form
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  // Get activity types for form
  const { data: activityTypes = [] } = useQuery({
    queryKey: ["/api/activity-types"],
    enabled: !!user,
  });

  // Get time entries for the current month
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ["/api/time-entries/range", { startDate: monthStart.toISOString(), endDate: monthEnd.toISOString() }],
    enabled: !!user,
  });

  // Form setup
  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      projectId: "",
      activityTypeId: "",
      description: "",
      hours: "",
    },
  });

  // Time entry mutation
  const timeEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/time-entries", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Attività registrata",
        description: "L'attività è stata registrata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/range"] });
      setIsDialogOpen(false);
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        projectId: "",
        activityTypeId: "",
        description: "",
        hours: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la registrazione dell'attività.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: TimeEntryFormValues) {
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per registrare un'attività.",
        variant: "destructive",
      });
      return;
    }
    
    timeEntryMutation.mutate({
      userId: user.id,
      date: data.date, // send as string
      projectId: parseInt(data.projectId),
      activityTypeId: parseInt(data.activityTypeId),
      description: data.description,
      hours: data.hours, // send as string
      status: "pending",
    });
  }

  // Filter time entries
  const filteredTimeEntries = timeEntries
    .filter(entry => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        entry.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by project
      const matchesProject = !filterProject || entry.projectId.toString() === filterProject;
      
      return matchesSearch && matchesProject;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate total hours
  const totalHours = filteredTimeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

  // Navigation functions
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Get project name by id
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Progetto sconosciuto";
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

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      
      <div className="lg:ml-64 flex-1 min-h-screen">
        <div className="p-6">
          <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Consuntivi</h1>
              <p className="text-neutral-500">Gestione delle attività lavorative e ore registrate</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Attività
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registra Nuova Attività</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Progetto</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona un progetto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="activityTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo di Attività</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona un tipo di attività" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activityTypes.filter(type => type.category === 'work').map(type => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrizione</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Descrivi brevemente l'attività" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ore</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.5" min="0" max="24" {...field} placeholder="8.0" />
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
                    disabled={timeEntryMutation.isPending}
                  >
                    {timeEntryMutation.isPending ? (
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
          
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="mx-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary-500" />
                    <span className="font-medium">
                      {format(currentMonth, "MMMM yyyy", { locale: it })}
                    </span>
                  </div>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle>Ore totali: {totalHours.toFixed(1)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Cerca attività..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="sm:w-64">
                  <Select onValueChange={(val) => setFilterProject(val)} value={filterProject || ""}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-neutral-400" />
                        <SelectValue placeholder="Filtra per progetto" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i progetti</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Progetto</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Ore</TableHead>
                        <TableHead>Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTimeEntries.length > 0 ? (
                        filteredTimeEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{format(new Date(entry.date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>{getProjectName(entry.projectId)}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>{Number(entry.hours).toFixed(1)}</TableCell>
                            <TableCell>{getStatusBadge(entry.status)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-neutral-500">
                            Nessuna attività trovata per questo mese
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <footer className="mt-10 border-t py-6 px-6 text-center text-neutral-500 text-sm">
          <p>&copy; 2023 WorkTrack - Sistema di Gestione Attività Lavorative. Tutti i diritti riservati.</p>
        </footer>
      </div>
    </div>
  );
}
