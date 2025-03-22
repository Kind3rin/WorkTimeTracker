import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import StatsCard from "@/components/dashboard/stats-card";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentTimesheet from "@/components/dashboard/recent-timesheet";
import UpcomingEvents from "@/components/dashboard/upcoming-events";
import ExpenseReports from "@/components/dashboard/expense-reports";
import ProjectStatus from "@/components/dashboard/project-status";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState("august");
  
  const months = [
    { value: "august", label: "Agosto 2023" },
    { value: "july", label: "Luglio 2023" },
    { value: "june", label: "Giugno 2023" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        <TopBar />
        
        <main className="flex-grow overflow-y-auto p-4 md:p-6 bg-neutral-lightest">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-neutral-medium text-sm">Benvenuto, {user?.name}. Ecco il riepilogo delle tue attività.</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40 mr-2">
                  <SelectValue placeholder="Seleziona periodo" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button className="flex items-center">
                <i className="ri-add-line mr-1"></i>
                <span>Nuova Attività</span>
              </Button>
            </div>
          </div>
          
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Ore Lavorate"
              value="154.5h"
              icon="time-line"
              trend={{
                value: "+2.5% rispetto al mese scorso",
                positive: true
              }}
              borderColor="border-primary"
              iconBgClass="bg-primary bg-opacity-10 text-primary"
            />
            
            <StatsCard
              title="Ferie Disponibili"
              value="12 giorni"
              icon="calendar-event-line"
              footnote="Aggiornato al 15/08/2023"
              borderColor="border-success"
              iconBgClass="bg-success bg-opacity-10 text-success"
            />
            
            <StatsCard
              title="Note Spese"
              value="€320.75"
              icon="money-euro-circle-line"
              footnote="2 in attesa di approvazione"
              borderColor="border-warning"
              iconBgClass="bg-warning bg-opacity-10 text-warning"
            />
            
            <StatsCard
              title="Trasferte"
              value="3"
              icon="flight-takeoff-line"
              footnote="Prossima: Milano, 27/08"
              borderColor="border-primary-light"
              iconBgClass="bg-primary-light bg-opacity-10 text-primary-light"
            />
          </div>
          
          {/* Quick Actions */}
          <QuickActions />
          
          {/* Recent Timesheet / Upcoming Events Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RecentTimesheet />
            <UpcomingEvents />
          </div>
          
          {/* Expense Reports / Projects Status Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseReports />
            <ProjectStatus />
          </div>
        </main>
      </div>
    </div>
  );
}
