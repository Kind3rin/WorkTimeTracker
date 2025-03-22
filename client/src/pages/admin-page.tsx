import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "@/components/admin/user-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Check, X, Info, Clock, UserCheck, Users, UserPlus, UserCog, Key, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type ColumnDef } from "@tanstack/react-table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Schema per la creazione di un nuovo utente
const newUserSchema = z.object({
  username: z.string().min(3, { message: "Username deve essere almeno 3 caratteri." }),
  fullName: z.string().min(3, { message: "Nome completo deve essere almeno 3 caratteri." }),
  password: z.string().min(6, { message: "Password deve essere almeno 6 caratteri." }),
  role: z.enum(["employee", "admin"]),
});

// Schema per la modifica del ruolo di un utente
const changeRoleSchema = z.object({
  userId: z.number(),
  role: z.enum(["employee", "admin"]),
});

// Schema per la generazione di una nuova password
const resetPasswordSchema = z.object({
  userId: z.number(),
});

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("timeEntries");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [showNewUserDialog, setShowNewUserDialog] = useState<boolean>(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState<boolean>(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Verifica se l'utente è un amministratore
  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <Card>
            <CardHeader>
              <CardTitle>Accesso negato</CardTitle>
              <CardDescription>
                Questa pagina è accessibile solo agli utenti con ruolo Amministratore.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Non hai i permessi necessari per visualizzare questa pagina.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Query per ottenere le richieste in base al tab selezionato
  const { data: pendingItems, isLoading, error } = useQuery({
    queryKey: ['/api/admin', selectedTab],
    queryFn: () => apiRequest("GET", `/api/admin/${selectedTab}`).then(res => res.json()),
    enabled: user?.role === "admin",
  });

  // Mutazione per approvare una richiesta
  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number, type: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/${type}/${id}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta approvata",
        description: "La richiesta è stata approvata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
      setDetailsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutazione per rifiutare una richiesta
  const rejectMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number, type: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/${type}/${id}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta rifiutata",
        description: "La richiesta è stata rifiutata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
      setDetailsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Definizione delle colonne della tabella per ogni tipo di richiesta
  const timeEntryColumns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => format(new Date(row.original.date), "dd/MM/yyyy"),
    },
    {
      accessorKey: "hours",
      header: "Ore",
    },
    {
      accessorKey: "projectId",
      header: "Progetto",
      cell: ({ row }) => `#${row.original.projectId}`,
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "pending" ? "outline" : row.original.status === "approved" ? "success" : "destructive"}>
          {row.original.status === "pending" ? "In attesa" : row.original.status === "approved" ? "Approvato" : "Rifiutato"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => {
          setSelectedItem({...row.original, type: "timesheet"});
          setDetailsOpen(true);
        }}>
          <Info className="h-4 w-4 mr-2" />
          Dettagli
        </Button>
      ),
    },
  ];

  const expenseColumns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => format(new Date(row.original.date), "dd/MM/yyyy"),
    },
    {
      accessorKey: "category",
      header: "Categoria",
    },
    {
      accessorKey: "amount",
      header: "Importo",
      cell: ({ row }) => `€ ${row.original.amount}`,
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "pending" ? "outline" : row.original.status === "approved" ? "success" : "destructive"}>
          {row.original.status === "pending" ? "In attesa" : row.original.status === "approved" ? "Approvato" : "Rifiutato"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => {
          setSelectedItem({...row.original, type: "expense"});
          setDetailsOpen(true);
        }}>
          <Info className="h-4 w-4 mr-2" />
          Dettagli
        </Button>
      ),
    },
  ];

  const tripColumns: ColumnDef<any>[] = [
    {
      accessorKey: "destination",
      header: "Destinazione",
    },
    {
      accessorKey: "startDate",
      header: "Data inizio",
      cell: ({ row }) => format(new Date(row.original.startDate), "dd/MM/yyyy"),
    },
    {
      accessorKey: "endDate",
      header: "Data fine",
      cell: ({ row }) => format(new Date(row.original.endDate), "dd/MM/yyyy"),
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "pending" ? "outline" : row.original.status === "approved" ? "success" : "destructive"}>
          {row.original.status === "pending" ? "In attesa" : row.original.status === "approved" ? "Approvato" : "Rifiutato"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => {
          setSelectedItem({...row.original, type: "trip"});
          setDetailsOpen(true);
        }}>
          <Info className="h-4 w-4 mr-2" />
          Dettagli
        </Button>
      ),
    },
  ];

  const leaveRequestColumns: ColumnDef<any>[] = [
    {
      accessorKey: "type",
      header: "Tipo",
    },
    {
      accessorKey: "startDate",
      header: "Data inizio",
      cell: ({ row }) => format(new Date(row.original.startDate), "dd/MM/yyyy"),
    },
    {
      accessorKey: "endDate",
      header: "Data fine",
      cell: ({ row }) => format(new Date(row.original.endDate), "dd/MM/yyyy"),
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "pending" ? "outline" : row.original.status === "approved" ? "success" : "destructive"}>
          {row.original.status === "pending" ? "In attesa" : row.original.status === "approved" ? "Approvato" : "Rifiutato"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => {
          setSelectedItem({...row.original, type: "leave"});
          setDetailsOpen(true);
        }}>
          <Info className="h-4 w-4 mr-2" />
          Dettagli
        </Button>
      ),
    },
  ];

  const sickLeaveColumns: ColumnDef<any>[] = [
    {
      accessorKey: "protocolNumber",
      header: "Protocollo",
    },
    {
      accessorKey: "startDate",
      header: "Data inizio",
      cell: ({ row }) => format(new Date(row.original.startDate), "dd/MM/yyyy"),
    },
    {
      accessorKey: "endDate",
      header: "Data fine",
      cell: ({ row }) => format(new Date(row.original.endDate), "dd/MM/yyyy"),
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "pending" ? "outline" : row.original.status === "approved" ? "success" : "destructive"}>
          {row.original.status === "pending" ? "In attesa" : row.original.status === "approved" ? "Approvato" : "Rifiutato"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => {
          setSelectedItem({...row.original, type: "sickleave"});
          setDetailsOpen(true);
        }}>
          <Info className="h-4 w-4 mr-2" />
          Dettagli
        </Button>
      ),
    },
  ];

  const usersQuery = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest("GET", `/api/admin/users`).then(res => res.json()),
  });

  // Form per creare un nuovo utente
  const newUserForm = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      username: "",
      fullName: "",
      password: "",
      role: "employee"
    }
  });

  // Mutazione per creare un nuovo utente
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newUserSchema>) => {
      const res = await apiRequest("POST", `/api/admin/users`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Utente creato",
        description: "L'utente è stato creato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowNewUserDialog(false);
      newUserForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutazione per cambiare il ruolo di un utente
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number, role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ruolo aggiornato",
        description: "Il ruolo dell'utente è stato aggiornato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowChangeRoleDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutazione per generare una nuova password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId }: { userId: number }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password resettata",
        description: `La nuova password temporanea è: ${data.temporaryPassword}`,
      });
      setShowResetPasswordDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Definizione delle colonne per la tabella utenti
  const userColumns: ColumnDef<any>[] = [
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "fullName",
      header: "Nome Completo",
    },
    {
      accessorKey: "role",
      header: "Ruolo",
      cell: ({ row }) => (
        <Badge variant={row.original.role === "admin" ? "success" : "default"}>
          {row.original.role === "admin" ? "Amministratore" : "Dipendente"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            setSelectedUserId(row.original.id);
            setShowChangeRoleDialog(true);
          }}>
            <UserCog className="h-4 w-4 mr-2" />
            Cambia Ruolo
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setSelectedUserId(row.original.id);
            setShowResetPasswordDialog(true);
          }}>
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
        </div>
      ),
    },
  ];

  const getUserName = (userId: number) => {
    if (usersQuery.isLoading || !usersQuery.data) return `User #${userId}`;
    const user = usersQuery.data.find((u: any) => u.id === userId);
    return user ? user.fullName : `User #${userId}`;
  };

  // Render the detail dialog based on the selected item
  const renderItemDetails = () => {
    if (!selectedItem) return null;

    const type = selectedItem.type;
    let detailsContent;

    switch (type) {
      case "timesheet":
        detailsContent = (
          <>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Data:</p>
                <p className="text-sm">{format(new Date(selectedItem.date), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ore:</p>
                <p className="text-sm">{selectedItem.hours}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Utente:</p>
                <p className="text-sm">{getUserName(selectedItem.userId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Progetto:</p>
                <p className="text-sm">#{selectedItem.projectId}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-sm font-medium">Descrizione:</p>
                <p className="text-sm">{selectedItem.description || "Nessuna descrizione disponibile"}</p>
              </div>
            </div>
          </>
        );
        break;
      case "expense":
        detailsContent = (
          <>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Data:</p>
                <p className="text-sm">{format(new Date(selectedItem.date), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Importo:</p>
                <p className="text-sm">€ {selectedItem.amount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Categoria:</p>
                <p className="text-sm">{selectedItem.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Utente:</p>
                <p className="text-sm">{getUserName(selectedItem.userId)}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-sm font-medium">Descrizione:</p>
                <p className="text-sm">{selectedItem.description || "Nessuna descrizione disponibile"}</p>
              </div>
              {selectedItem.receiptPath && (
                <div className="space-y-1 col-span-2">
                  <p className="text-sm font-medium">Ricevuta:</p>
                  <p className="text-sm">{selectedItem.receiptPath}</p>
                </div>
              )}
            </div>
          </>
        );
        break;
      case "trip":
        detailsContent = (
          <>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Destinazione:</p>
                <p className="text-sm">{selectedItem.destination}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Utente:</p>
                <p className="text-sm">{getUserName(selectedItem.userId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Data inizio:</p>
                <p className="text-sm">{format(new Date(selectedItem.startDate), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Data fine:</p>
                <p className="text-sm">{format(new Date(selectedItem.endDate), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-sm font-medium">Scopo:</p>
                <p className="text-sm">{selectedItem.purpose || "Nessuno scopo specificato"}</p>
              </div>
            </div>
          </>
        );
        break;
      case "leave":
        detailsContent = (
          <>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Tipo:</p>
                <p className="text-sm">{selectedItem.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Utente:</p>
                <p className="text-sm">{getUserName(selectedItem.userId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Data inizio:</p>
                <p className="text-sm">{format(new Date(selectedItem.startDate), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Data fine:</p>
                <p className="text-sm">{format(new Date(selectedItem.endDate), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-sm font-medium">Motivo:</p>
                <p className="text-sm">{selectedItem.reason || "Nessun motivo specificato"}</p>
              </div>
            </div>
          </>
        );
        break;
      case "sickleave":
        detailsContent = (
          <>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Numero Protocollo:</p>
                <p className="text-sm">{selectedItem.protocolNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Utente:</p>
                <p className="text-sm">{getUserName(selectedItem.userId)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Data inizio:</p>
                <p className="text-sm">{format(new Date(selectedItem.startDate), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Data fine:</p>
                <p className="text-sm">{format(new Date(selectedItem.endDate), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-sm font-medium">Note:</p>
                <p className="text-sm">{selectedItem.note || "Nessuna nota disponibile"}</p>
              </div>
            </div>
          </>
        );
        break;
      default:
        detailsContent = <p>Nessun dettaglio disponibile</p>;
    }

    return (
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Dettagli richiesta</DialogTitle>
            <DialogDescription>
              {selectedItem.status === "pending" ? 
                "Esamina i dettagli e approva o rifiuta la richiesta." :
                "Visualizza i dettagli della richiesta."}
            </DialogDescription>
          </DialogHeader>
          {detailsContent}
          <DialogFooter>
            {selectedItem.status === "pending" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => rejectMutation.mutate({ id: selectedItem.id, type: getMutationType(selectedItem.type) })}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rifiuta
                </Button>
                <Button 
                  onClick={() => approveMutation.mutate({ id: selectedItem.id, type: getMutationType(selectedItem.type) })}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approva
                </Button>
              </>
            )}
            {selectedItem.status !== "pending" && (
              <Button 
                variant="outline" 
                onClick={() => setDetailsOpen(false)}
              >
                Chiudi
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Helper per ottenere il tipo di mutazione corretto
  const getMutationType = (type: string) => {
    switch (type) {
      case "timesheet": return "timeEntries";
      case "expense": return "expenses";
      case "trip": return "trips";
      case "leave": return "leaveRequests";
      case "sickleave": return "sickLeaves";
      default: return "";
    }
  };

  // Render del loader per i dati
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render dell'errore
  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <Card>
            <CardHeader>
              <CardTitle>Errore</CardTitle>
              <CardDescription>
                Si è verificato un errore durante il caricamento dei dati
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{(error as Error).message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pannello Amministratore</CardTitle>
              <CardDescription>
                Gestisci e approva le richieste degli utenti
              </CardDescription>
            </div>
            <UserCheck className="h-8 w-8 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Tabs defaultValue="timeEntries" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="timeEntries">Timesheet</TabsTrigger>
            <TabsTrigger value="expenses">Spese</TabsTrigger>
            <TabsTrigger value="trips">Viaggi</TabsTrigger>
            <TabsTrigger value="leaveRequests">Permessi</TabsTrigger>
            <TabsTrigger value="sickLeaves">Malattie</TabsTrigger>
            <TabsTrigger value="users">Utenti</TabsTrigger>
          </TabsList>

          <TabsContent value="timeEntries">
          <Card>
            <CardHeader>
              <CardTitle>Richieste Timesheet</CardTitle>
              <CardDescription>
                Gestisci e approva le richieste di timesheet pendenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={timeEntryColumns}
                data={pendingItems || []}
                searchKey="status"
                searchPlaceholder="Filtra per stato..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Richieste Spese</CardTitle>
              <CardDescription>
                Gestisci e approva le richieste di rimborso spese pendenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={expenseColumns}
                data={pendingItems || []}
                searchKey="status"
                searchPlaceholder="Filtra per stato..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips">
          <Card>
            <CardHeader>
              <CardTitle>Richieste Viaggi</CardTitle>
              <CardDescription>
                Gestisci e approva le richieste di viaggio pendenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={tripColumns}
                data={pendingItems || []}
                searchKey="status"
                searchPlaceholder="Filtra per stato..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaveRequests">
          <Card>
            <CardHeader>
              <CardTitle>Richieste Permessi</CardTitle>
              <CardDescription>
                Gestisci e approva le richieste di permesso pendenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={leaveRequestColumns}
                data={pendingItems || []}
                searchKey="status"
                searchPlaceholder="Filtra per stato..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sickLeaves">
          <Card>
            <CardHeader>
              <CardTitle>Certificati Malattia</CardTitle>
              <CardDescription>
                Gestisci e approva i certificati di malattia pendenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={sickLeaveColumns}
                data={pendingItems || []}
                searchKey="status"
                searchPlaceholder="Filtra per stato..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Utenti</CardTitle>
              <CardDescription>
                Gestisci gli utenti del sistema, i loro ruoli e le loro password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog per la creazione di un nuovo utente */}
      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crea nuovo utente</DialogTitle>
            <DialogDescription>
              Inserisci i dati per creare un nuovo utente nel sistema.
            </DialogDescription>
          </DialogHeader>
          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
              <FormField
                control={newUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newUserForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password temporanea che l'utente dovrà cambiare al primo accesso.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ruolo</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="employee">Dipendente</option>
                        <option value="admin">Amministratore</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creazione in corso...
                    </>
                  ) : (
                    "Crea Utente"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog per cambiare ruolo */}
      <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cambia ruolo utente</DialogTitle>
            <DialogDescription>
              Seleziona il nuovo ruolo per l'utente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nuovo ruolo</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => {
                    if (selectedUserId) {
                      changeRoleMutation.mutate({ 
                        userId: selectedUserId, 
                        role: e.target.value 
                      });
                    }
                  }}
                  disabled={changeRoleMutation.isPending}
                >
                  <option disabled selected>Seleziona ruolo</option>
                  <option value="employee">Dipendente</option>
                  <option value="admin">Amministratore</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeRoleDialog(false)}>
              Annulla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per reset password */}
      <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler resettare la password di questo utente? Verrà generata una nuova password temporanea che l'utente dovrà cambiare al primo accesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedUserId) {
                  resetPasswordMutation.mutate({ userId: selectedUserId });
                }
              }}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resettando...
                </>
              ) : (
                "Resetta password"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {renderItemDetails()}
      </div>
    </div>
  );
}