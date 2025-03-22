import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Check, X, Info, Clock, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type ColumnDef } from "@tanstack/react-table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("timesheets");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  // Verifica se l'utente è un amministratore
  if (user?.role !== "admin") {
    return (
      <div className="container mx-auto py-10">
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
    );
  }

  // Query per ottenere le richieste in base al tab selezionato
  const { data: pendingItems, isLoading, error } = useQuery({
    queryKey: ['/api/admin', selectedTab],
    queryFn: () => apiRequest("GET", `/api/admin/${selectedTab}`).then(res => res.json()),
  });

  // Mutazione per approvare una richiesta
  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number, type: string }) => {
      const res = await apiRequest("POST", `/api/admin/${type}/approve/${id}`);
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
      const res = await apiRequest("POST", `/api/admin/${type}/reject/${id}`);
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
      <div className="container mx-auto py-10">
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
    );
  }

  return (
    <div className="container mx-auto py-10">
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

      <Tabs defaultValue="timesheets" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="timesheets">Timesheet</TabsTrigger>
          <TabsTrigger value="expenses">Spese</TabsTrigger>
          <TabsTrigger value="trips">Viaggi</TabsTrigger>
          <TabsTrigger value="leaveRequests">Permessi</TabsTrigger>
          <TabsTrigger value="sickLeaves">Malattie</TabsTrigger>
        </TabsList>

        <TabsContent value="timesheets">
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
      </Tabs>

      {renderItemDetails()}
    </div>
  );
}