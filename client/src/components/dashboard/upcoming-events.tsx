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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b">
        <h2 className="text-base sm:text-lg font-medium">Prossimi Eventi</h2>
      </div>
      
      <div className="p-2 sm:p-4">
        <div className="space-y-2 sm:space-y-4">
          {events.length > 0 ? (
            events.map((event) => {
              const date = parseISO(event.date);
              return (
                <div key={event.id} className="flex items-start p-2 sm:p-3 rounded-lg hover:bg-neutral-50">
                  <div className="flex-shrink-0 bg-primary-100 text-primary-700 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center mr-2 sm:mr-4">
                    <span className="text-xs font-medium">{format(date, "MMM", { locale: it }).toUpperCase()}</span>
                    <span className="text-sm sm:text-lg font-bold">{format(date, "dd")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-medium text-neutral-800 line-clamp-1">{event.title}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5 sm:mt-1 line-clamp-2">{event.description}</p>
                  </div>
                  <div className="ml-2 sm:ml-4 flex-shrink-0">
                    {getStatusBadge(event.status)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 sm:py-6 text-neutral-500 text-xs sm:text-sm">
              Nessun evento programmato
            </div>
          )}
        </div>
      </div>
      
      <div className="px-3 sm:px-6 py-2 sm:py-3 bg-neutral-50 border-t mt-auto">
        <Link href="/calendar">
          <Button variant="ghost" size="sm" className="w-full text-primary-500 hover:text-primary-600 hover:bg-transparent text-xs sm:text-sm font-medium">
            Visualizza Calendario Completo
          </Button>
        </Link>
      </div>
    </div>
  );
}
