import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeEntry, insertTimeEntrySchema } from "@shared/schema";

const quickEntrySchema = z.object({
  date: z.string().min(1, {
    message: "La data è obbligatoria",
  }),
  activityTypeId: z.string().min(1, {
    message: "Il tipo di attività è obbligatorio",
  }),
  projectId: z.string().min(1, {
    message: "Il progetto è obbligatorio",
  }),
  description: z.string().optional(),
  hours: z.string().min(1, {
    message: "Le ore sono obbligatorie",
  }),
});

type QuickEntryFormValues = z.infer<typeof quickEntrySchema>;

export default function QuickEntryForm() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch activity types
  const { data: activityTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/activity-types"],
    staleTime: Infinity,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    staleTime: Infinity,
  });

  // Set up form
  const form = useForm<QuickEntryFormValues>({
    resolver: zodResolver(quickEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      activityTypeId: "",
      projectId: "",
      description: "",
      hours: "",
    },
  });

  // Set up time entry mutation
  const timeEntryMutation = useMutation({
    mutationFn: async (data: Partial<TimeEntry>) => {
      const res = await apiRequest("POST", "/api/time-entries", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Attività registrata",
        description: "L'attività è stata registrata con successo.",
      });
      // Invalida tutte le query correlate
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/range"] });
      // Invalida anche le query della dashboard admin
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/time-entries"] });
      form.reset({
        date: new Date().toISOString().split("T")[0],
        activityTypeId: "",
        projectId: "",
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

  function onSubmit(data: QuickEntryFormValues) {
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per registrare un'attività.",
        variant: "destructive",
      });
      return;
    }
    
    // Convert date to string format expected by the schema
    timeEntryMutation.mutate({
      userId: user.id,
      date: data.date, // send as string
      projectId: parseInt(data.projectId),
      activityTypeId: parseInt(data.activityTypeId),
      description: data.description || "",
      hours: data.hours, // send as string
      status: "pending",
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm h-full">
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b">
        <h2 className="text-base sm:text-lg font-medium">Registra Attività</h2>
      </div>
      
      <div className="p-3 sm:p-4 md:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="space-y-1 sm:space-y-2">
                  <FormLabel className="text-xs sm:text-sm">Data</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-8 sm:h-9 text-xs sm:text-sm" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="activityTypeId"
              render={({ field }) => (
                <FormItem className="space-y-1 sm:space-y-2">
                  <FormLabel className="text-xs sm:text-sm">Tipo di Attività</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Seleziona un tipo di attività" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activityTypes.filter((type: {category: string}) => type.category === 'work').map((type: {id: number, name: string}) => (
                        <SelectItem key={type.id} value={type.id.toString()} className="text-xs sm:text-sm">
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem className="space-y-1 sm:space-y-2">
                  <FormLabel className="text-xs sm:text-sm">Progetto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Seleziona un progetto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project: {id: number, name: string}) => (
                        <SelectItem key={project.id} value={project.id.toString()} className="text-xs sm:text-sm">
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1 sm:space-y-2">
                  <FormLabel className="text-xs sm:text-sm">Descrizione</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="Descrivi brevemente l'attività..." 
                      className="h-8 sm:h-9 text-xs sm:text-sm" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem className="space-y-1 sm:space-y-2">
                  <FormLabel className="text-xs sm:text-sm">Ore</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.5" 
                      min="0" 
                      max="24" 
                      placeholder="8.0" 
                      className="h-8 sm:h-9 text-xs sm:text-sm" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full h-8 sm:h-9 text-xs sm:text-sm mt-2 sm:mt-3"
              disabled={timeEntryMutation.isPending}
            >
              {timeEntryMutation.isPending ? "Registrazione in corso..." : "Registra Attività"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
