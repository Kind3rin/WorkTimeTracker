import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import { 
  BarChart as BarChartIcon, 
  CalendarIcon, 
  Download, 
  FileText, 
  Loader2, 
  PieChart, 
  Sliders, 
  UserIcon, 
  DollarSign, 
  Clock,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("activity");
  const [reportPeriod, setReportPeriod] = useState("current-month");
  
  // Get current date and period dates
  const today = new Date();
  const currentMonth = today;
  const lastMonth = subMonths(today, 1);
  
  // Function to get start and end dates based on selected period
  const getPeriodDates = () => {
    let start, end;
    
    switch (reportPeriod) {
      case "current-month":
        start = startOfMonth(currentMonth);
        end = endOfMonth(currentMonth);
        break;
      case "last-month":
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "last-3-months":
        start = startOfMonth(subMonths(today, 2));
        end = endOfMonth(currentMonth);
        break;
      case "year-to-date":
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      default:
        start = startOfMonth(currentMonth);
        end = endOfMonth(currentMonth);
    }
    
    return { start, end };
  };
  
  const { start: periodStart, end: periodEnd } = getPeriodDates();
  
  // Fetch data for the selected period
  const { data: timeEntries = [], isLoading: isLoadingTimeEntries } = useQuery({
    queryKey: ["/api/time-entries/range", { startDate: periodStart.toISOString(), endDate: periodEnd.toISOString() }],
    enabled: !!user && reportType === "activity",
  });
  
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["/api/expenses/range", { startDate: periodStart.toISOString(), endDate: periodEnd.toISOString() }],
    enabled: !!user && reportType === "expense",
  });
  
  const { data: leaveRequests = [], isLoading: isLoadingLeaves } = useQuery({
    queryKey: ["/api/leave-requests/range", { startDate: periodStart.toISOString(), endDate: periodEnd.toISOString() }],
    enabled: !!user && reportType === "leave",
  });
  
  // Fetch projects and activity types for filtering and charts
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });
  
  const { data: activityTypes = [] } = useQuery({
    queryKey: ["/api/activity-types"],
    enabled: !!user,
  });
  
  // Process data for charts based on report type
  const isLoading = isLoadingTimeEntries || isLoadingExpenses || isLoadingLeaves;
  
  // Activity report processing
  const activityData = () => {
    // Project distribution
    const projectDistribution = projects.map(project => {
      const projectHours = timeEntries
        .filter(entry => entry.projectId === project.id)
        .reduce((sum, entry) => sum + Number(entry.hours), 0);
      
      return {
        name: project.name,
        hours: parseFloat(projectHours.toFixed(1)),
      };
    }).filter(item => item.hours > 0);
    
    // Activity type distribution
    const activityTypeDistribution = activityTypes
      .filter(type => type.category === 'work')
      .map(type => {
        const typeHours = timeEntries
          .filter(entry => entry.activityTypeId === type.id)
          .reduce((sum, entry) => sum + Number(entry.hours), 0);
        
        return {
          name: type.name,
          hours: parseFloat(typeHours.toFixed(1)),
        };
      }).filter(item => item.hours > 0);
    
    // Total hours
    const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    
    return {
      projectDistribution,
      activityTypeDistribution,
      totalHours: parseFloat(totalHours.toFixed(1)),
    };
  };
  
  // Expense report processing
  const expenseData = () => {
    // Category distribution
    const categoryMap = {
      travel: "Viaggi",
      meal: "Pasti",
      accommodation: "Alloggio",
      other: "Altro",
    };
    
    const categoryDistribution = Object.entries(categoryMap).map(([key, label]) => {
      const categoryAmount = expenses
        .filter(expense => expense.category === key)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);
      
      return {
        name: label,
        value: parseFloat(categoryAmount.toFixed(2)),
      };
    }).filter(item => item.value > 0);
    
    // Total amount
    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    return {
      categoryDistribution,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  };
  
  // Leave report processing
  const leaveData = () => {
    // Leave type distribution
    const typeMap = {
      vacation: "Ferie",
      sick_leave: "Malattia",
      personal_leave: "Permessi",
    };
    
    const typeDistribution = Object.entries(typeMap).map(([key, label]) => {
      const typeDays = leaveRequests
        .filter(leave => leave.type === key && leave.status !== 'rejected')
        .reduce((sum, leave) => {
          const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
          return sum + days;
        }, 0);
      
      return {
        name: label,
        days: typeDays,
      };
    }).filter(item => item.days > 0);
    
    // Total days
    const totalDays = typeDistribution.reduce((sum, item) => sum + item.days, 0);
    
    return {
      typeDistribution,
      totalDays,
    };
  };
  
  // Prepare report data based on selected type
  let reportData: any = {};
  let pieChartData: any[] = [];
  
  if (!isLoading) {
    switch (reportType) {
      case "activity":
        reportData = activityData();
        pieChartData = reportData.projectDistribution;
        break;
      case "expense":
        reportData = expenseData();
        pieChartData = reportData.categoryDistribution;
        break;
      case "leave":
        reportData = leaveData();
        pieChartData = reportData.typeDistribution;
        break;
    }
  }
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  // Handle report download
  const handleDownloadReport = () => {
    toast({
      title: "Download avviato",
      description: "Il report sarà pronto a breve. La funzionalità di esportazione è in fase di implementazione.",
    });
  };
  
  // Format period label
  const getPeriodLabel = () => {
    switch (reportPeriod) {
      case "current-month":
        return format(currentMonth, "MMMM yyyy", { locale: it });
      case "last-month":
        return format(lastMonth, "MMMM yyyy", { locale: it });
      case "last-3-months":
        return `Ultimi 3 mesi (${format(subMonths(today, 2), "MMM", { locale: it })} - ${format(today, "MMM yyyy", { locale: it })})`;
      case "year-to-date":
        return `Anno ${today.getFullYear()} ad oggi`;
      default:
        return format(currentMonth, "MMMM yyyy", { locale: it });
    }
  };
  
  // Get report title and description
  const getReportInfo = () => {
    switch (reportType) {
      case "activity":
        return {
          title: "Report Attività",
          description: "Analisi delle ore lavorate per progetti e tipi di attività",
          icon: <Clock className="h-6 w-6" />,
        };
      case "expense":
        return {
          title: "Report Spese",
          description: "Analisi delle spese per categoria",
          icon: <DollarSign className="h-6 w-6" />,
        };
      case "leave":
        return {
          title: "Report Assenze",
          description: "Analisi delle ferie, permessi e malattie",
          icon: <Calendar className="h-6 w-6" />,
        };
      default:
        return {
          title: "Report",
          description: "Analisi dei dati",
          icon: <BarChartIcon className="h-6 w-6" />,
        };
    }
  };
  
  const reportInfo = getReportInfo();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      
      <div className="lg:ml-64 flex-1 min-h-screen">
        <div className="p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-800">Report</h1>
            <p className="text-neutral-500">Visualizza e genera report sulle tue attività lavorative</p>
          </header>
          
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {reportInfo.icon}
                  <div className="ml-3">
                    <CardTitle>{reportInfo.title}</CardTitle>
                    <CardDescription>{reportInfo.description}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={handleDownloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Esporta PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="sm:w-64">
                  <Select onValueChange={setReportType} value={reportType}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-neutral-400" />
                        <SelectValue placeholder="Tipo di report" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activity">Attività e Ore</SelectItem>
                      <SelectItem value="expense">Spese</SelectItem>
                      <SelectItem value="leave">Assenze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="sm:w-64">
                  <Select onValueChange={setReportPeriod} value={reportPeriod}>
                    <SelectTrigger>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-neutral-400" />
                        <SelectValue placeholder="Periodo" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Mese corrente</SelectItem>
                      <SelectItem value="last-month">Mese precedente</SelectItem>
                      <SelectItem value="last-3-months">Ultimi 3 mesi</SelectItem>
                      <SelectItem value="year-to-date">Anno ad oggi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <div>
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Riepilogo per il periodo: {getPeriodLabel()}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {reportType === "activity" && (
                        <>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-neutral-500 mb-1">Ore totali registrate</p>
                                <p className="text-3xl font-bold text-primary-500">{reportData.totalHours}</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-neutral-500 mb-1">Progetti attivi</p>
                                <p className="text-3xl font-bold text-primary-500">{reportData.projectDistribution.length}</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-neutral-500 mb-1">Media giornaliera</p>
                                <p className="text-3xl font-bold text-primary-500">
                                  {(reportData.totalHours / Math.max(1, timeEntries.length)).toFixed(1)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      
                      {reportType === "expense" && (
                        <>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-neutral-500 mb-1">Spese totali</p>
                                <p className="text-3xl font-bold text-primary-500">€{reportData.totalAmount}</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-neutral-500 mb-1">Categorie di spesa</p>
                                <p className="text-3xl font-bold text-primary-500">{reportData.categoryDistribution.length}</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-neutral-500 mb-1">Media per spesa</p>
                                <p className="text-3xl font-bold text-primary-500">
                                  €{(reportData.totalAmount / Math.max(1, expenses.length)).toFixed(2)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      
                      {reportType === "leave" && (
                        <>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-neutral-500 mb-1">Giorni totali di assenza</p>
                                <p className="text-3xl font-bold text-primary-500">{reportData.totalDays}</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-neutral-500 mb-1">Tipi di assenza</p>
                                <p className="text-3xl font-bold text-primary-500">{reportData.typeDistribution.length}</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-neutral-500 mb-1">Media durata</p>
                                <p className="text-3xl font-bold text-primary-500">
                                  {(reportData.totalDays / Math.max(1, leaveRequests.length)).toFixed(1)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pie Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Distribuzione per {reportType === "activity" ? "progetto" : 
                                           reportType === "expense" ? "categoria" : "tipo"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {pieChartData.length > 0 ? (
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={pieChartData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={true}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey={reportType === "leave" ? "days" : reportType === "expense" ? "value" : "hours"}
                                >
                                  {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value) => [
                                    `${value} ${reportType === "leave" ? "giorni" : 
                                              reportType === "expense" ? "€" : "ore"}`, 
                                    ""
                                  ]} 
                                />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-[300px] flex items-center justify-center text-neutral-500">
                            Nessun dato disponibile per visualizzare il grafico
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Bar Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {reportType === "activity" && "Distribuzione per tipo di attività"}
                          {reportType === "expense" && "Spese per categoria"}
                          {reportType === "leave" && "Assenze per tipo"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(reportType === "activity" ? reportData.activityTypeDistribution : 
                          reportType === "expense" ? reportData.categoryDistribution :
                          reportData.typeDistribution).length > 0 ? (
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={reportType === "activity" ? reportData.activityTypeDistribution : 
                                      reportType === "expense" ? reportData.categoryDistribution :
                                      reportData.typeDistribution}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip 
                                  formatter={(value) => [
                                    `${value} ${reportType === "leave" ? "giorni" : 
                                              reportType === "expense" ? "€" : "ore"}`, 
                                    ""
                                  ]} 
                                />
                                <Legend />
                                <Bar 
                                  dataKey={reportType === "leave" ? "days" : reportType === "expense" ? "value" : "hours"} 
                                  fill="#0066cc" 
                                  name={reportType === "leave" ? "Giorni" : reportType === "expense" ? "Importo (€)" : "Ore"}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-[300px] flex items-center justify-center text-neutral-500">
                            Nessun dato disponibile per visualizzare il grafico
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <footer className="mt-10 border-t py-6 px-6 text-center text-neutral-500 text-sm">
          <p>&copy; 2023 WorkTrack - Sistema di Gestione Attività Lavorative. Tutti i diritti riservati.</p>
        </footer>
      </div>
    </div>
  );
}
