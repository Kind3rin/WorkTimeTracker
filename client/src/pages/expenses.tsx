import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, Search, Filter, Loader2, Plus, Receipt, Trash2, Download, Eye } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

// Form schema for new expense
const expenseSchema = z.object({
  date: z.string().min(1, { message: "La data è obbligatoria" }),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "L'importo deve essere maggiore di 0" }
  ),
  category: z.string().min(1, { message: "La categoria è obbligatoria" }),
  description: z.string().min(1, { message: "La descrizione è obbligatoria" }),
  tripId: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function Expenses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get trips for the form
  const { data: trips = [] } = useQuery({
    queryKey: ["/api/trips"],
    enabled: !!user,
  });

  // Get expenses for the current month
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/expenses/range", { startDate: monthStart.toISOString(), endDate: monthEnd.toISOString() }],
    enabled: !!user,
  });

  // Form setup
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      amount: "",
      category: "",
      description: "",
      tripId: "",
    },
  });

  // Expense categories
  const expenseCategories = [
    { value: "travel", label: "Viaggi" },
    { value: "meal", label: "Pasti" },
    { value: "accommodation", label: "Alloggio" },
    { value: "other", label: "Altro" },
  ];

  // Expense mutation
  const expenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/expenses", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Spesa registrata",
        description: "La spesa è stata registrata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/range"] });
      setIsDialogOpen(false);
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        amount: "",
        category: "",
        description: "",
        tripId: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la registrazione della spesa.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ExpenseFormValues) {
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per registrare una spesa.",
        variant: "destructive",
      });
      return;
    }
    
    expenseMutation.mutate({
      userId: user.id,
      date: data.date, // send as string, not as Date object
      amount: data.amount, // send as string, not as parsed float
      category: data.category,
      description: data.description,
      tripId: data.tripId ? parseInt(data.tripId) : null,
      status: "pending",
    });
  }

  // Filter expenses
  const filteredExpenses = expenses
    .filter(expense => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by category
      const matchesCategory = !filterCategory || expense.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate total amount
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Navigation functions
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Get category label
  const getCategoryLabel = (category: string) => {
    const categoryObj = expenseCategories.find(c => c.value === category);
    return categoryObj ? categoryObj.label : "Sconosciuta";
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

  // Get trip destination
  const getTripDestination = (tripId: number | null) => {
    if (!tripId) return null;
    const trip = trips.find(t => t.id === tripId);
    return trip ? trip.destination : null;
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      
      <div className="lg:ml-64 flex-1 min-h-screen">
        <div className="p-6">
          <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Note Spese</h1>
              <p className="text-neutral-500">Gestione delle spese e trasferte</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Spesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registra Nuova Spesa</DialogTitle>
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
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Importo (€)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona una categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {expenseCategories.map(category => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
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
                            <Textarea {...field} placeholder="Descrivi brevemente la spesa" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tripId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trasferta (opzionale)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Collega a una trasferta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nessuna trasferta</SelectItem>
                              {trips.map(trip => (
                                <SelectItem key={trip.id} value={trip.id.toString()}>
                                  {trip.destination} ({format(new Date(trip.startDate), "dd/MM/yyyy")})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                    disabled={expenseMutation.isPending}
                  >
                    {expenseMutation.isPending ? (
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
                    <CalendarIcon className="h-5 w-5 mr-2 text-primary-500" />
                    <span className="font-medium">
                      {format(currentMonth, "MMMM yyyy", { locale: it })}
                    </span>
                  </div>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle>Totale: €{totalAmount.toFixed(2)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Cerca spese..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="sm:w-64">
                  <Select onValueChange={(val) => setFilterCategory(val)} value={filterCategory || ""}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-neutral-400" />
                        <SelectValue placeholder="Filtra per categoria" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le categorie</SelectItem>
                      {expenseCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
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
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Trasferta</TableHead>
                        <TableHead>Importo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="w-[100px]">Ricevuta</TableHead>
                        <TableHead className="w-[80px]">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.length > 0 ? (
                        filteredExpenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{format(new Date(expense.date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                            <TableCell>
                              {getTripDestination(expense.tripId) || <span className="text-neutral-400">-</span>}
                            </TableCell>
                            <TableCell>€{Number(expense.amount).toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(expense.status)}</TableCell>
                            <TableCell>
                              {expense.receiptPath ? (
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Download className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-neutral-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Dettagli Nota Spesa</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <div className="font-medium text-sm">Data</div>
                                        <div>{format(new Date(expense.date), "dd/MM/yyyy")}</div>
                                      </div>
                                      <div>
                                        <div className="font-medium text-sm">Importo</div>
                                        <div>€{Number(expense.amount).toFixed(2)}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm">Categoria</div>
                                      <div>{getCategoryLabel(expense.category)}</div>
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm">Descrizione</div>
                                      <div>{expense.description}</div>
                                    </div>
                                    {expense.tripId && (
                                      <div>
                                        <div className="font-medium text-sm">Trasferta Collegata</div>
                                        <div>{getTripDestination(expense.tripId)}</div>
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-medium text-sm">Stato</div>
                                      <div>{getStatusBadge(expense.status)}</div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => {}}>Chiudi</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-neutral-500">
                            Nessuna spesa trovata per questo mese
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
