import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

interface Event {
  id: number;
  date: string;
  title: string;
  description: string;
  status: "pending" | "confirmed" | "urgent" | "info";
}

interface UpcomingEventsProps {
  events: Event[];
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confermato</Badge>;
      case "urgent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgente</Badge>;
      case "info":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Informativo</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Attesa</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-medium">Prossimi Eventi</h2>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map((event) => {
              const date = parseISO(event.date);
              return (
                <div key={event.id} className="flex items-start p-3 rounded-lg hover:bg-neutral-50">
                  <div className="flex-shrink-0 bg-primary-100 text-primary-700 rounded-lg w-12 h-12 flex flex-col items-center justify-center mr-4">
                    <span className="text-xs font-medium">{format(date, "MMM", { locale: it }).toUpperCase()}</span>
                    <span className="text-lg font-bold">{format(date, "dd")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-neutral-800">{event.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">{event.description}</p>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(event.status)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-neutral-500">
              Nessun evento programmato
            </div>
          )}
        </div>
      </div>
      
      <div className="px-6 py-3 bg-neutral-50 border-t">
        <Link href="/calendar">
          <Button variant="ghost" className="w-full text-primary-500 hover:text-primary-600 hover:bg-transparent text-sm font-medium">
            Visualizza Calendario Completo
          </Button>
        </Link>
      </div>
    </div>
  );
}
