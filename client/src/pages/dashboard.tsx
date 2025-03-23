import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Loader2,
  BarChart3,
  LucideBarChart
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import SummaryCard from "@/components/dashboard/summary-card";
import ActivityTable, { Activity } from "@/components/dashboard/activity-table";
import QuickEntryForm from "@/components/dashboard/quick-entry-form";
import WeeklyChart from "@/components/dashboard/weekly-chart";
import ActivityDistributionChart from "@/components/dashboard/activity-distribution-chart";
import MonthlyTrendChart from "@/components/dashboard/monthly-trend-chart";
import UpcomingEvents from "@/components/dashboard/upcoming-events";
import { addDays, format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, subDays } from "date-fns";
import { it } from 'date-fns/locale';
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
  
  // Definizione delle interfacce per i dati
  interface TimeEntry {
    id: number;
    date: string;
    description: string;
    hours: number;
    activityTypeId: number;
    status: 'pending' | 'approved' | 'rejected';
  }
  
  interface Expense {
    id: number;
    date: string;
    amount: number;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
  }
  
  interface LeaveRequest {
    id: number;
    startDate: string;
    endDate: string;
    type: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
  }
  
  interface Trip {
    id: number;
    startDate: string;
    endDate: string;
    destination: string;
    purpose?: string;
    status: 'pending' | 'approved' | 'rejected';
  }

  // Set a realistic default for time entries to avoid loading states on empty data
  // Recupera l'ID dell'azienda per filtrare i dati in base all'azienda
  const companyId = localStorage.getItem('companyId') || 'default';
  
  // Fetch consuntivi con parametri specifici per azienda
  const defaultTimeEntries: TimeEntry[] = [];
  const { data: timeEntries = defaultTimeEntries, isLoading: isLoadingTimeEntries, error: timeEntriesError } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries/range", { 
      startDate: monthStart.toISOString(), 
      endDate: now.toISOString(),
      companyId // Aggiunto per filtrare i dati per azienda specifica 
    }],
    enabled: !!user,
    retry: 1, // Reduce retries for faster failure
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch spese con parametri specifici per azienda
  const defaultExpenses: Expense[] = [];
  const { data: expenses = defaultExpenses, isLoading: isLoadingExpenses, error: expensesError } = useQuery<Expense[]>({
    queryKey: ["/api/expenses/range", { 
      startDate: monthStart.toISOString(), 
      endDate: now.toISOString(),
      companyId // Aggiunto per filtrare i dati per azienda specifica
    }],
    enabled: !!user,
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch richieste ferie con parametri specifici per azienda
  const defaultLeaveRequests: LeaveRequest[] = [];
  const { data: leaveRequests = defaultLeaveRequests, isLoading: isLoadingLeave, error: leaveError } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", { companyId }], // Aggiunto per filtrare i dati per azienda specifica
    enabled: !!user,
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch trasferte con parametri specifici per azienda
  const defaultTrips: Trip[] = [];
  const { data: trips = defaultTrips, isLoading: isLoadingTrips, error: tripsError } = useQuery<Trip[]>({
    queryKey: ["/api/trips", { companyId }], // Aggiunto per filtrare i dati per azienda specifica
    enabled: !!user,
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false,
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
  
  // Parametri configurabili per ferie e permessi
  const totalVacationDays = 25; // Giorni totali di ferie all'anno (dovrebbe provenire dalle configurazioni utente)
  const totalLeaveHours = 40; // Ore totali di permesso (dovrebbe provenire dalle configurazioni utente)
  
  // Calcolo delle ferie utilizzate in giorni
  const usedVacationDays = leaveRequests
    .filter(request => request.type === "vacation" && request.status !== "rejected")
    .reduce((sum, request) => {
      return sum + differenceInDays(new Date(request.endDate), new Date(request.startDate)) + 1;
    }, 0);
  
  // Calcolo permessi utilizzati (convertiti in ore)
  const usedLeaveHours = leaveRequests
    .filter(request => request.type === "leave" && request.status !== "rejected")
    .reduce((sum, request) => {
      // Calcolo ore di permesso usate
      const days = differenceInDays(new Date(request.endDate), new Date(request.startDate)) + 1;
      return sum + (days * 8); // Assume 8 ore per giorno lavorativo
    }, 0);
  
  const remainingVacationDays = totalVacationDays - usedVacationDays;
  const remainingLeaveHours = totalLeaveHours - usedLeaveHours;
  
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
  
  // Event interface type to match UpcomingEvents component
  interface EventItem {
    id: number;
    date: string;
    title: string;
    description: string;
    status: "pending" | "confirmed" | "urgent" | "info";
  }

  // Prepare upcoming events
  const upcomingEvents: EventItem[] = [
    ...(nextTrip ? [{
      id: nextTrip.id,
      date: nextTrip.startDate,
      title: `Trasferta ${nextTrip.destination}`,
      description: `${format(new Date(nextTrip.startDate), "dd/MM")} - ${format(new Date(nextTrip.endDate), "dd/MM")}${nextTrip.purpose ? ` - ${nextTrip.purpose}` : ''}`,
      status: nextTrip.status === "approved" ? "confirmed" as const : "pending" as const,
    }] : []),
    ...leaveRequests
      .filter(request => new Date(request.startDate) > now)
      .map(request => ({
        id: request.id,
        date: request.startDate,
        title: request.type === "vacation" ? "Ferie" : request.type === "sick_leave" ? "Malattia" : "Permesso",
        description: `${format(new Date(request.startDate), "dd/MM")} - ${format(new Date(request.endDate), "dd/MM")}${request.reason ? ` - ${request.reason}` : ''}`,
        status: request.status === "approved" ? "confirmed" as const : "pending" as const,
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
  
  // Imposta un timeout di 5 secondi per evitare il caricamento infinito
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Timeout del caricamento della dashboard attivato");
        setLoadingTimeout(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // Forza il rendering anche in caso di errori nel caricamento dati
  useEffect(() => {
    if (timeEntriesError || expensesError || leaveError || tripsError) {
      console.error("Errori nel caricamento dei dati:", {
        timeEntriesError,
        expensesError,
        leaveError,
        tripsError
      });
      setLoadingTimeout(true);
    }
  }, [timeEntriesError, expensesError, leaveError, tripsError]);
  
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
  
  // Prepara i dati per il grafico a torta della distribuzione delle attività
  // Raggruppa le time entries per tipo di attività e calcola le ore totali
  const activityTypeHours = timeEntries.reduce((acc, entry) => {
    // Utilizziamo l'ID del tipo di attività come chiave
    const activityTypeId = entry.activityTypeId.toString();
    if (!acc[activityTypeId]) {
      acc[activityTypeId] = {
        hours: 0,
        activityTypeId: entry.activityTypeId
      };
    }
    acc[activityTypeId].hours += Number(entry.hours);
    return acc;
  }, {} as Record<string, { hours: number, activityTypeId: number }>);
  
  // Colori per i tipi di attività
  const activityColors = [
    "#0ea5e9", // Blue
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f97316", // Orange
  ];

  // Dati per il grafico a torta della distribuzione delle attività
  const activityDistributionData = Object.values(activityTypeHours).map((item, index) => ({
    name: `Attività ${item.activityTypeId}`,
    value: item.hours,
    color: activityColors[index % activityColors.length]
  }));
  
  // Dati per il grafico dell'andamento mensile
  // Crea un array con tutti i giorni del mese
  const monthlyDaysRange = eachDayOfInterval({
    start: startOfMonth(now),
    end: now
  });
  
  // Inizializza i dati con zero ore per ogni giorno
  const monthlyTrendData = monthlyDaysRange.map(day => ({
    date: format(day, "yyyy-MM-dd"),
    hours: 0,
    expenses: 0
  }));
  
  // Popola le ore per ogni giorno
  timeEntries.forEach(entry => {
    const entryDate = format(new Date(entry.date), "yyyy-MM-dd");
    const dayIndex = monthlyTrendData.findIndex(d => d.date === entryDate);
    if (dayIndex !== -1) {
      monthlyTrendData[dayIndex].hours += Number(entry.hours);
    }
  });
  
  // Popola le spese per ogni giorno
  expenses.forEach(expense => {
    const expenseDate = format(new Date(expense.date), "yyyy-MM-dd");
    const dayIndex = monthlyTrendData.findIndex(d => d.date === expenseDate);
    if (dayIndex !== -1) {
      monthlyTrendData[dayIndex].expenses += Number(expense.amount);
    }
  });
  
  return (
    <div className="flex min-h-screen bg-neutral-50 flex-col lg:flex-row overflow-hidden">
      <Sidebar />
      
      <div className="lg:ml-64 flex-1 min-h-screen overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-6">
          <header className="mb-4 md:mb-6 lg:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-neutral-800">Dashboard</h1>
              <p className="text-sm md:text-base text-neutral-500">
                {companyId && companyId !== 'default' ? (
                  `Dashboard ${companyId}`
                ) : (
                  "Benvenuto nel tuo pannello di controllo delle attività lavorative"
                )}
              </p>
            </div>
            <div className="mt-3 md:mt-0">
              <div className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(now, "d MMMM yyyy")}
              </div>
            </div>
          </header>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
            <SummaryCard
              title="Ore Registrate (Mese)"
              value={`${totalMonthlyHours.toFixed(1)}`}
              icon={<Clock className="h-5 w-5 md:h-6 md:w-6" />}
              changeValue={`+${previousMonthPercentChange}% rispetto al mese scorso`}
              changeType="positive"
            />
            
            <SummaryCard
              title="Note Spese (Mese)"
              value={`€${totalMonthlyExpenses.toFixed(2)}`}
              icon={<DollarSign className="h-5 w-5 md:h-6 md:w-6" />}
              changeValue={`${previousMonthExpensesChange}% rispetto al mese scorso`}
              changeType="negative"
            />
            
            <SummaryCard
              title="Ferie Rimanenti"
              value={`${remainingVacationDays} giorni`}
              icon={<Calendar className="h-5 w-5 md:h-6 md:w-6" />}
              infoText="Scadenza: 31/12/2023"
            />
            
            <SummaryCard
              title="Permessi Rimanenti"
              value={`${remainingLeaveHours} ore`}
              icon={<Calendar className="h-5 w-5 md:h-6 md:w-6" />}
              infoText="Aggiornato al giorno corrente"
            />
            
            <SummaryCard
              title="Prossima Trasferta"
              value={nextTrip ? `${nextTrip.destination}, ${format(new Date(nextTrip.startDate), "dd/MM")}-${format(new Date(nextTrip.endDate), "dd/MM")}` : "Nessuna programmata"}
              icon={<MapPin className="h-5 w-5 md:h-6 md:w-6" />}
              infoText={nextTrip ? (nextTrip.status === "approved" ? "Confermata" : "Conferma richiesta") : undefined}
            />
          </div>
          
          {/* Recent Activities and Quick Entry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Recent Activities */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <ActivityTable 
                activities={recentActivities} 
                caption="Attività Recenti"
                showViewAll={true}
                onViewAll={() => navigate("/timesheet")}
              />
            </div>
            
            {/* Quick Entry Form */}
            <div className="order-1 lg:order-2 mb-4 lg:mb-0">
              <QuickEntryForm />
            </div>
          </div>
          
          {/* Charts Section - Mobile First Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Left Column - Mobile: Full Width, Desktop: 2/3 Width */}
            <div className="xl:col-span-2 space-y-6">
              {/* Monthly Trend Chart */}
              <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium mb-4">Andamento Mensile</h3>
                <div className="min-h-[300px] min-w-[600px] sm:min-w-0">
                  <MonthlyTrendChart 
                    data={monthlyTrendData}
                    title=""
                    onExport={handleExportReport}
                  />
                </div>
              </div>

              {/* Weekly Chart */}
              <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium mb-4">Ore Settimanali</h3>
                <div className="min-h-[300px] min-w-[600px] sm:min-w-0">
                  <WeeklyChart 
                    data={weeklyTimeData}
                    totalHours={totalWeeklyHours}
                    onExport={handleExportReport}
                  />
                </div>
              </div>
              
              {/* Upcoming Events - Mobile: Bottom, Desktop: Bottom Left */}
              <div className="bg-white rounded-lg shadow">
                <UpcomingEvents events={upcomingEvents} />
              </div>
            </div>
            
            {/* Right Column - Mobile: Full Width, Desktop: 1/3 Width */}
            <div className="space-y-6">
              {/* Activity Distribution Chart */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium mb-4">Distribuzione Attività</h3>
                <div className="min-h-[300px]">
                  <ActivityDistributionChart 
                    data={activityDistributionData}
                    title=""
                  />
                </div>
              </div>
              
              {/* Recent Activities - Shown in right column on desktop */}
              <div className="bg-white rounded-lg shadow p-4 hidden xl:block">
                <h3 className="text-lg font-medium mb-4">Attività Recenti</h3>
                <ActivityTable 
                  activities={recentActivities.slice(0, 3)} 
                  caption=""
                  showViewAll={true}
                  onViewAll={() => navigate("/timesheet")}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-6 md:mt-10 border-t py-4 md:py-6 px-3 sm:px-4 md:px-6 text-center text-neutral-500 text-xs md:text-sm">
          <p>&copy; 2023 WorkTrack - Sistema di Gestione Attività Lavorative. Tutti i diritti riservati.</p>
        </footer>
      </div>
    </div>
  );
}
