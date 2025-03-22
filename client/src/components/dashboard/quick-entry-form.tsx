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
  const { data: activityTypes = [] } = useQuery({
    queryKey: ["/api/activity-types"],
    staleTime: Infinity,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
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
    
    timeEntryMutation.mutate({
      userId: user.id,
      date: new Date(data.date),
      projectId: parseInt(data.projectId),
      activityTypeId: parseInt(data.activityTypeId),
      description: data.description || "",
      hours: parseFloat(data.hours),
      status: "pending",
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-medium">Registra Attività</h2>
      </div>
      
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Descrivi brevemente l'attività..." {...field} />
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
                    <Input 
                      type="number" 
                      step="0.5" 
                      min="0" 
                      max="24" 
                      placeholder="8.0" 
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
