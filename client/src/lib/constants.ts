// Navigation items
export const navItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: "dashboard-line",
  },
  {
    name: "Consuntivi",
    path: "/timesheet",
    icon: "time-line",
  },
  {
    name: "Note Spese",
    path: "/expenses",
    icon: "money-euro-circle-line",
  },
  {
    name: "Trasferte",
    path: "/travel",
    icon: "flight-takeoff-line",
  },
  {
    name: "Ferie e Permessi",
    path: "/leave",
    icon: "calendar-event-line",
  },
  {
    name: "Malattie",
    path: "/sickleave",
    icon: "medicine-bottle-line",
  },
  {
    name: "Report",
    path: "/reports",
    icon: "file-chart-line",
  },
];

// User settings items
export const settingsItems = [
  {
    name: "Impostazioni",
    path: "/settings",
    icon: "settings-line",
  },
  {
    name: "Aiuto",
    path: "/help",
    icon: "question-line",
  },
];

// Quick actions for dashboard
export const quickActions = [
  {
    name: "Inserisci Ore",
    icon: "time-line",
    bgClass: "bg-primary bg-opacity-10 text-primary",
    path: "/timesheet/new",
  },
  {
    name: "Nuova Spesa",
    icon: "money-euro-circle-line",
    bgClass: "bg-success bg-opacity-10 text-success",
    path: "/expenses/new",
  },
  {
    name: "Pianifica Trasferta",
    icon: "flight-takeoff-line",
    bgClass: "bg-primary-light bg-opacity-10 text-primary-light",
    path: "/travel/new",
  },
  {
    name: "Richiedi Ferie",
    icon: "calendar-event-line",
    bgClass: "bg-warning bg-opacity-10 text-warning",
    path: "/leave/new",
  },
  {
    name: "Genera Report",
    icon: "file-chart-line",
    bgClass: "bg-error bg-opacity-10 text-error",
    path: "/reports/new",
  },
];

// Expense categories
export const expenseCategories = [
  "restaurant",
  "transport",
  "hotel",
  "office",
  "other",
];

// Leave types
export const leaveTypes = [
  { value: "vacation", label: "Ferie" },
  { value: "sick", label: "Malattia" },
  { value: "time_off", label: "Permesso" },
];

// Status options
export const statusOptions = [
  { value: "pending", label: "In attesa" },
  { value: "approved", label: "Approvato" },
  { value: "rejected", label: "Respinto" },
];

// Project status options
export const projectStatusOptions = [
  { value: "planning", label: "Pianificazione" },
  { value: "in_progress", label: "In corso" },
  { value: "completed", label: "Completato" },
  { value: "on_hold", label: "In sospeso" },
  { value: "cancelled", label: "Annullato" },
];
