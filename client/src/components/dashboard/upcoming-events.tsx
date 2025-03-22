import { useQuery } from "@tanstack/react-query";
import { Travel, Leave } from "@shared/schema";
import { Link } from "wouter";
import { getStatusBadgeColor, getStatusTranslation, formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Event = {
  id: number;
  type: 'travel' | 'leave';
  title: string;
  startDate: Date;
  endDate: Date | null;
  time?: string;
  status: string;
  badge: string;
};

export default function UpcomingEvents() {
  const { data: travels, isLoading: travelsLoading } = useQuery<Travel[]>({
    queryKey: ["/api/travels"],
  });

  const { data: leaves, isLoading: leavesLoading } = useQuery<Leave[]>({
    queryKey: ["/api/leaves"],
  });

  const isLoading = travelsLoading || leavesLoading;

  // Combine and sort events
  const getEvents = (): Event[] => {
    const events: Event[] = [];
    
    if (travels) {
      travels.forEach(travel => {
        events.push({
          id: travel.id,
          type: 'travel',
          title: `Trasferta ${travel.destination} - ${travel.purpose}`,
          startDate: new Date(travel.startDate),
          endDate: new Date(travel.endDate),
          time: "08:00 - 17:00",
          status: travel.status,
          badge: "Trasferta"
        });
      });
    }
    
    if (leaves) {
      leaves.forEach(leave => {
        let badge = "Permesso";
        if (leave.type === "vacation") badge = "Ferie";
        if (leave.type === "sick") badge = "Malattia";
        
        events.push({
          id: leave.id,
          type: 'leave',
          title: badge,
          startDate: new Date(leave.startDate),
          endDate: new Date(leave.endDate),
          status: leave.status,
          badge
        });
      });
    }
    
    // Sort by date (ascending)
    return events
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 4); // Take the next 4 events
  };

  const upcomingEvents = getEvents();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Prossimi Eventi</h2>
        <Link href="/calendar">
          <a className="text-primary text-sm hover:underline">Calendario completo</a>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-52">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => {
              const day = format(event.startDate, "dd", { locale: it });
              const month = format(event.startDate, "MMM", { locale: it }).toUpperCase();
              
              let badgeClass = "bg-neutral-medium bg-opacity-10 text-neutral-medium";
              if (event.badge === "Trasferta") badgeClass = "bg-primary-light bg-opacity-10 text-primary-light";
              if (event.badge === "Ferie") badgeClass = "bg-success bg-opacity-10 text-success";
              if (event.badge === "Malattia") badgeClass = "bg-error bg-opacity-10 text-error";
              
              return (
                <div key={`${event.type}-${event.id}`} className="flex p-3 border rounded-md hover:bg-neutral-lightest">
                  <div className="mr-3 text-center">
                    <div className="font-bold text-primary">{day}</div>
                    <div className="text-xs text-neutral-medium">{month}</div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold">{event.title}</h3>
                    <div className="text-xs text-neutral-medium flex items-center mt-1">
                      <i className={`ri-${event.time ? "time" : "calendar"}-line mr-1`}></i>
                      <span>
                        {event.time || 
                          (event.endDate 
                            ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
                            : formatDate(event.startDate)
                          )
                        }
                      </span>
                    </div>
                  </div>
                  <div className="self-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${badgeClass}`}>
                      {event.badge}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-6 text-neutral-medium">
              Nessun evento programmato.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
