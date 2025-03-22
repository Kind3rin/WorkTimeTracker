import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import DashboardPage from "@/pages/dashboard-page";
import TimesheetPage from "@/pages/timesheet-page";
import ExpensesPage from "@/pages/expenses-page";
import TravelPage from "@/pages/travel-page";
import LeavePage from "@/pages/leave-page";
import SickleavePage from "@/pages/sickleave-page";
import ReportsPage from "@/pages/reports-page";
import AuthPage from "@/pages/auth-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/timesheet" component={TimesheetPage} />
      <ProtectedRoute path="/expenses" component={ExpensesPage} />
      <ProtectedRoute path="/travel" component={TravelPage} />
      <ProtectedRoute path="/leave" component={LeavePage} />
      <ProtectedRoute path="/sickleave" component={SickleavePage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
