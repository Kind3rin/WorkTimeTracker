import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Leave, insertLeaveSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate, getStatusBadgeColor, getStatusTranslation, getLeaveTypeTranslation } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInBusinessDays } from "date-fns";
import { cn } from "@/lib/utils";
import { leaveTypes } from "@/lib/constants";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  type: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().optional(),
}).refine(data => data.startDate <= data.endDate, {
  message: "La data di fine deve essere successiva alla data di inizio",
  path: ["endDate"]
});

export default function LeavePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [leaveToEdit, setLeaveToEdit] = useState<Leave | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<Leave | null>(null);
  
  const { toast } = useToast();

  const { data: leaves, isLoading } = useQuery<Leave[]>({
    queryKey: ["/api/leaves"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      startDate: new Date(),
      endDate: new Date(),
      reason: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/leaves", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      setIsAddModalOpen(false);
      form.reset();
      toast({
        title: "Richiesta inviata",
        description: "La richiesta di ferie/permesso è stata inviata con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof formSchema> }) => {
      const res = await apiRequest("PUT", `/api/leaves/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      setLeaveToEdit(null);
      form.reset();
      toast({
        title: "Richiesta aggiornata",
        description: "La richiesta è stata aggiornata con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leaves/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      setLeaveToDelete(null);
      toast({
        title: "Richiesta eliminata",
        description: "La richiesta è stata eliminata con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditModal = (leave: Leave) => {
    setLeaveToEdit(leave);
    form.reset({
      type: leave.type,
      startDate: new Date(leave.startDate),
      endDate: new Date(leave.endDate),
      reason: leave.reason || "",
    });
  };

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    if (leaveToEdit) {
      updateMutation.mutate({ id: leaveToEdit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (leaveToDelete) {
      deleteMutation.mutate(leaveToDelete.id);
    }
  };

  // Calculate the duration in days
  const calculateDuration = (startDate: Date, endDate: Date): number => {
    return differenceInBusinessDays(endDate, startDate) + 1;
  };

  const columns: ColumnDef<Leave>[] = [
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => <div>{getLeaveTypeTranslation(row.original.type)}</div>,
    },
    {
      accessorKey: "startDate",
      header: "Data inizio",
      cell: ({ row }) => <div>{formatDate(row.original.startDate)}</div>,
    },
    {
      accessorKey: "endDate",
      header: "Data fine",
      cell: ({ row }) => <div>{formatDate(row.original.endDate)}</div>,
    },
    {
      id: "duration",
      header: "Durata",
      cell: ({ row }) => {
        const duration = calculateDuration(
          new Date(row.original.startDate),
          new Date(row.original.endDate)
        );
        return <div>{duration} {duration === 1 ? "giorno" : "giorni"}</div>;
      },
    },
    {
      accessorKey: "reason",
      header: "Motivo",
      cell: ({ row }) => <div>{row.original.reason || "-"}</div>,
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <div>
          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(row.original.status)}`}>
            {getStatusTranslation(row.original.status)}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditModal(row.original)}
            disabled={row.original.status === "approved"}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={row.original.status === "approved"}
                onClick={() => setLeaveToDelete(row.original)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. La richiesta verrà rimossa permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Elimina</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        <TopBar />
        
        <main className="flex-grow overflow-y-auto p-4 md:p-6 bg-neutral-lightest">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Ferie e Permessi</h1>
              <p className="text-neutral-medium text-sm">Gestisci le tue richieste di ferie e permessi</p>
            </div>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <i className="ri-add-line mr-1"></i>
                  <span>Nuova Richiesta</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuova Richiesta</DialogTitle>
                  <DialogDescription>
                    Inserisci i dettagli della tua richiesta di ferie o permesso
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo di richiesta</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {leaveTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data inizio</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>Seleziona data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
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
                            <FormLabel>Data fine</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>Seleziona data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
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
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo (opzionale)</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {(createMutation.isPending || updateMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {leaveToEdit ? "Aggiorna" : "Invia richiesta"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Edit Dialog */}
            <Dialog open={leaveToEdit !== null} onOpenChange={(open) => !open && setLeaveToEdit(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifica Richiesta</DialogTitle>
                  <DialogDescription>
                    Modifica i dettagli della tua richiesta
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo di richiesta</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {leaveTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data inizio</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>Seleziona data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
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
                            <FormLabel>Data fine</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>Seleziona data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
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
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo (opzionale)</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Aggiorna
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={leaves || []} 
              searchKey="reason"
              searchPlaceholder="Cerca per motivo..."
            />
          )}
        </main>
      </div>
    </div>
  );
}
