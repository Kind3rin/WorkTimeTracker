import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

// Schema per validare il form di cambio password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "La password attuale è obbligatoria",
  }),
  newPassword: z.string().min(6, {
    message: "La nuova password deve essere di almeno 6 caratteri",
  }),
  confirmPassword: z.string().min(6, {
    message: "La conferma password deve essere di almeno 6 caratteri",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordDialog() {
  const { user, changePasswordMutation } = useAuth();
  const [open, setOpen] = useState(true);
  
  // Se l'utente non ha bisogno di cambiare password, non mostriamo il dialog
  if (!user?.needsPasswordChange) {
    return null;
  }

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  function onSubmit(data: ChangePasswordFormValues) {
    // Estraiamo i dati rilevanti e inviamo la richiesta
    const { confirmPassword, ...passwordData } = data;
    changePasswordMutation.mutate(passwordData, {
      onSuccess: () => setOpen(false)
    });
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambio password richiesto</DialogTitle>
          <DialogDescription>
            Per motivi di sicurezza, è necessario cambiare la password temporanea.
            Inserisci la tua password attuale e scegli una nuova password sicura.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password attuale</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Inserisci la password attuale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuova password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Inserisci la nuova password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conferma nuova password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Conferma la nuova password" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aggiornamento in corso...
                </>
              ) : (
                "Cambia password"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}