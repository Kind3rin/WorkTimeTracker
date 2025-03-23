import { Switch, Route, useLocation } from "wouter";
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
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNav from "@/components/layout/bottom-nav";

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

function MobileBottomNavWrapper() {
  const isMobile = useIsMobile();
  // Implementazione semplificata per evitare errori di compatibilità
  const showBottomNav = isMobile;

  return showBottomNav ? <BottomNav /> : null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <MobileBottomNavWrapper />
        <ChangePasswordDialog />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
