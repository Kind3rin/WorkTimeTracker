import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Timesheet from "@/pages/timesheet";
import Expenses from "@/pages/expenses";
import Trips from "@/pages/trips";
import TimeOff from "@/pages/timeoff";
import SickleavePage from "@/pages/sickleave-page";
import Reports from "@/pages/reports";
import SettingsPage from "@/pages/settings-page";
import AdminPage from "@/pages/admin-page";
import InvitationPage from "@/pages/invitation-page";
import { ChangePasswordDialog } from "@/components/change-password-dialog";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/timesheet" component={Timesheet} />
      <ProtectedRoute path="/expenses" component={Expenses} />
      <ProtectedRoute path="/trips" component={Trips} />
      <ProtectedRoute path="/timeoff" component={TimeOff} />
      <ProtectedRoute path="/sickleave" component={SickleavePage} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/invitation/:token" component={InvitationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <ChangePasswordDialog />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
