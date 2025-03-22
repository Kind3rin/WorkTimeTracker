import { useState } from "react";
import { User } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, UserPlus, Shield, Key } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Validation schema for new user
const newUserSchema = z.object({
  username: z.string().min(3, "Username deve essere di almeno 3 caratteri"),
  fullName: z.string().min(2, "Nome completo richiesto"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
  role: z.enum(["employee", "admin"])
});

// User role change schema
const changeRoleSchema = z.object({
  role: z.enum(["employee", "admin"])
});

type NewUserFormValues = z.infer<typeof newUserSchema>;
type ChangeRoleFormValues = z.infer<typeof changeRoleSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  // Form for adding a new user
  const newUserForm = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      username: "",
      fullName: "",
      password: "",
      role: "employee"
    }
  });

  // Form for changing user role
  const changeRoleForm = useForm<ChangeRoleFormValues>({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: {
      role: "employee"
    }
  });

  // Query to get all users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return await response.json();
    }
  });

  // Mutation to create a new user
  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUserFormValues) => {
      const res = await apiRequest("POST", "/api/admin/users", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utente creato",
        description: "Il nuovo utente è stato creato con successo",
      });
      setIsCreateDialogOpen(false);
      newUserForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Errore durante la creazione dell'utente: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation to change user role
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Ruolo aggiornato",
        description: "Il ruolo dell'utente è stato aggiornato con successo",
      });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      changeRoleForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Errore durante l'aggiornamento del ruolo: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation to reset user password
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password resettata",
        description: "La password è stata resettata con successo",
      });
      setTemporaryPassword(data.temporaryPassword);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Errore durante il reset della password: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmitNewUser = (data: NewUserFormValues) => {
    createUserMutation.mutate(data);
  };

  const onChangeRole = (data: ChangeRoleFormValues) => {
    if (!selectedUser) return;
    
    changeRoleMutation.mutate({
      userId: selectedUser.id,
      role: data.role
    });
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    changeRoleForm.reset({ role: user.role });
    setIsRoleDialogOpen(true);
  };

  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setTemporaryPassword(null);
    setIsResetPasswordDialogOpen(true);
  };

  const resetPassword = () => {
    if (!selectedUser) return;
    resetPasswordMutation.mutate(selectedUser.id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
        <p>Si è verificato un errore durante il caricamento degli utenti. Riprova più tardi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestione Utenti</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuovo Utente
        </Button>
      </div>

      {/* Users Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === "admin" ? "default" : "outline"}
                    >
                      {user.role === "admin" ? "Amministratore" : "Dipendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mr-2"
                      onClick={() => openRoleDialog(user)}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Ruolo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openResetPasswordDialog(user)}
                    >
                      <Key className="h-4 w-4 mr-1" />
                      Reset Password
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Nessun utente trovato
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create user dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crea nuovo utente</DialogTitle>
          </DialogHeader>
          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit(onSubmitNewUser)} className="space-y-4">
              <FormField
                control={newUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
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
                      <Input placeholder="Nome e Cognome" {...field} />
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
                    <FormLabel>Password temporanea</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Ruolo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="employee" id="employee" />
                          <Label htmlFor="employee">Dipendente</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="admin" />
                          <Label htmlFor="admin">Amministratore</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Crea Utente
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Cambia ruolo utente: {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          <Form {...changeRoleForm}>
            <form onSubmit={changeRoleForm.handleSubmit(onChangeRole)} className="space-y-4">
              <FormField
                control={changeRoleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Ruolo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="employee" id="change-employee" />
                          <Label htmlFor="change-employee">Dipendente</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="change-admin" />
                          <Label htmlFor="change-admin">Amministratore</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsRoleDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={changeRoleMutation.isPending}
                >
                  {changeRoleMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salva
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reset password per {selectedUser?.username}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {!temporaryPassword ? (
                "Sei sicuro di voler resettare la password di questo utente? Verrà generata una nuova password temporanea."
              ) : (
                <div className="mt-2">
                  <p className="font-medium">Password temporanea generata:</p>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md font-mono text-center">
                    {temporaryPassword}
                  </div>
                  <p className="mt-3 text-sm">
                    Copia questa password e consegnala all'utente. Dovrà cambiarla al primo accesso.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Chiudi</AlertDialogCancel>
            {!temporaryPassword && (
              <AlertDialogAction onClick={resetPassword} disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reset Password
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}