import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Loader2 
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import SummaryCard from "@/components/dashboard/summary-card";
import ActivityTable, { Activity } from "@/components/dashboard/activity-table";
import QuickEntryForm from "@/components/dashboard/quick-entry-form";
import WeeklyChart from "@/components/dashboard/weekly-chart";
import UpcomingEvents from "@/components/dashboard/upcoming-events";
import { addDays, format, parseISO, startOfWeek, endOfWeek, startOfMonth, differenceInDays, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch time entries for this month
  const now = new Date();
  const monthStart = startOfMonth(now);
  
  // Fetch weekly time entries
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  console.log("Dashboard - Start fetching data, user:", user?.id);
  
  // Set a realistic default for time entries to avoid loading states on empty data
  const defaultTimeEntries = [];
  const { data: timeEntries = defaultTimeEntries, isLoading: isLoadingTimeEntries, error: timeEntriesError } = useQuery({
    queryKey: ["/api/time-entries/range", { startDate: monthStart.toISOString(), endDate: now.toISOString() }],
    enabled: !!user,
    retry: 1, // Reduce retries for faster failure
  });
  
  // Fetch expenses for this month
  const defaultExpenses = [];
  const { data: expenses = defaultExpenses, isLoading: isLoadingExpenses, error: expensesError } = useQuery({
    queryKey: ["/api/expenses/range", { startDate: monthStart.toISOString(), endDate: now.toISOString() }],
    enabled: !!user,
    retry: 1,
  });
  
  // Fetch leave requests for vacation data
  const defaultLeaveRequests = [];
  const { data: leaveRequests = defaultLeaveRequests, isLoading: isLoadingLeave, error: leaveError } = useQuery({
    queryKey: ["/api/leave-requests"],
    enabled: !!user,
    retry: 1,
  });
  
  // Fetch upcoming trips
  const defaultTrips = [];
  const { data: trips = defaultTrips, isLoading: isLoadingTrips, error: tripsError } = useQuery({
    queryKey: ["/api/trips"],
    enabled: !!user,
    retry: 1,
  });
  
  // Debug info to help diagnose loading issues
  useEffect(() => {
    console.log("Dashboard loading state:", {
      isLoadingTimeEntries,
      isLoadingExpenses,
      isLoadingLeave,
      isLoadingTrips,
      timeEntriesError,
      expensesError,
      leaveError,
      tripsError
    });
  }, [isLoadingTimeEntries, isLoadingExpenses, isLoadingLeave, isLoadingTrips, 
      timeEntriesError, expensesError, leaveError, tripsError]);
  
  // Process weekly time data for chart
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return {
      date: format(day, "yyyy-MM-dd"),
      hours: 0,
    };
  });
  
  const weeklyTimeData = weekDays.map(day => {
    const dayEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return format(entryDate, "yyyy-MM-dd") === day.date;
    });
    
    return {
      ...day,
      hours: dayEntries.reduce((sum, entry) => sum + Number(entry.hours), 0),
    };
  });
  
  // Calculate total monthly hours
  const totalMonthlyHours = timeEntries.reduce((sum, entry) => {
    return sum + Number(entry.hours);
  }, 0);
  
  // Calculate total weekly hours
  const totalWeeklyHours = weeklyTimeData.reduce((sum, day) => sum + day.hours, 0);
  
  // Calculate remaining vacation days
  const totalVacationDays = 25; // Example: 25 vacation days per year
  const usedVacationDays = leaveRequests
    .filter(request => request.type === "vacation" && request.status !== "rejected")
    .reduce((sum, request) => {
      return sum + differenceInDays(new Date(request.endDate), new Date(request.startDate)) + 1;
    }, 0);
  
  const remainingVacationDays = totalVacationDays - usedVacationDays;
  
  // Find next business trip
  const upcomingTrips = trips
    .filter(trip => new Date(trip.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const nextTrip = upcomingTrips.length > 0 ? upcomingTrips[0] : null;
  
  // Prepare recent activities
  const recentActivities: Activity[] = timeEntries
    .map(entry => ({
      id: entry.id,
      date: entry.date,
      activity: entry.description,
      hours: Number(entry.hours),
      status: entry.status as 'pending' | 'approved' | 'rejected',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  // Prepare upcoming events
  const upcomingEvents = [
    ...(nextTrip ? [{
      id: nextTrip.id,
      date: nextTrip.startDate,
      title: `Trasferta ${nextTrip.destination}`,
      description: `${format(new Date(nextTrip.startDate), "dd/MM")} - ${format(new Date(nextTrip.endDate), "dd/MM")}${nextTrip.purpose ? ` - ${nextTrip.purpose}` : ''}`,
      status: nextTrip.status === "approved" ? "confirmed" : "pending",
    }] : []),
    ...leaveRequests
      .filter(request => new Date(request.startDate) > now)
      .map(request => ({
        id: request.id,
        date: request.startDate,
        title: request.type === "vacation" ? "Ferie" : request.type === "sick_leave" ? "Malattia" : "Permesso",
        description: `${format(new Date(request.startDate), "dd/MM")} - ${format(new Date(request.endDate), "dd/MM")}${request.reason ? ` - ${request.reason}` : ''}`,
        status: request.status === "approved" ? "confirmed" : "pending",
      }))
  ]
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  .slice(0, 4);
  
  // Example data for previous month comparison
  const previousMonthPercentChange = 7.2;
  const previousMonthExpensesChange = -3.8;
  
  const handleExportReport = () => {
    toast({
      title: "Esportazione Report",
      description: "Funzionalità di esportazione in fase di implementazione.",
    });
  };
  
  const isLoading = isLoadingTimeEntries || isLoadingExpenses || isLoadingLeave || isLoadingTrips;
  
  // Imposta un timeout di 10 secondi per evitare il caricamento infinito
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Timeout del caricamento della dashboard attivato");
        setLoadingTimeout(true);
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }
  
  // Calculate monthly expense total
  const totalMonthlyExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      
      <div className="lg:ml-64 flex-1 min-h-screen">
        <div className="p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
            <p className="text-neutral-500">Benvenuto nel tuo pannello di controllo delle attività lavorative</p>
          </header>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard
              title="Ore Registrate (Mese)"
              value={`${totalMonthlyHours.toFixed(1)}`}
              icon={<Clock className="h-6 w-6" />}
              changeValue={`+${previousMonthPercentChange}% rispetto al mese scorso`}
              changeType="positive"
            />
            
            <SummaryCard
              title="Note Spese (Mese)"
              value={`€${totalMonthlyExpenses.toFixed(2)}`}
              icon={<DollarSign className="h-6 w-6" />}
              changeValue={`${previousMonthExpensesChange}% rispetto al mese scorso`}
              changeType="negative"
            />
            
            <SummaryCard
              title="Ferie Rimanenti"
              value={`${remainingVacationDays} giorni`}
              icon={<Calendar className="h-6 w-6" />}
              infoText="Scadenza: 31/12/2023"
            />
            
            <SummaryCard
              title="Prossima Trasferta"
              value={nextTrip ? `${nextTrip.destination}, ${format(new Date(nextTrip.startDate), "dd/MM")}-${format(new Date(nextTrip.endDate), "dd/MM")}` : "Nessuna programmata"}
              icon={<MapPin className="h-6 w-6" />}
              infoText={nextTrip ? (nextTrip.status === "approved" ? "Confermata" : "Conferma richiesta") : undefined}
            />
          </div>
          
          {/* Recent Activities and Quick Entry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <ActivityTable 
                activities={recentActivities} 
                caption="Attività Recenti"
                showViewAll={true}
                onViewAll={() => navigate("/timesheet")}
              />
            </div>
            
            {/* Quick Entry Form */}
            <div>
              <QuickEntryForm />
            </div>
          </div>
          
          {/* Weekly Work Hours Chart and Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Work Hours Chart */}
            <div className="lg:col-span-2">
              <WeeklyChart 
                data={weeklyTimeData}
                totalHours={totalWeeklyHours}
                onExport={handleExportReport}
              />
            </div>
            
            {/* Upcoming Events */}
            <div>
              <UpcomingEvents events={upcomingEvents} />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-10 border-t py-6 px-6 text-center text-neutral-500 text-sm">
          <p>&copy; 2023 WorkTrack - Sistema di Gestione Attività Lavorative. Tutti i diritti riservati.</p>
        </footer>
      </div>
    </div>
  );
}
