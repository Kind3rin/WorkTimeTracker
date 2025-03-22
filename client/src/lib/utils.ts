import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";
import { it } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (!isValid(dateObj)) return "";
  
  return format(dateObj, "dd/MM/yyyy", { locale: it });
}

export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (!isValid(dateObj)) return "";
  
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: it });
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function getUserInitials(name: string | null | undefined): string {
  if (!name) return "";
  
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getStatusBadgeColor(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
    case "rimborsato":
    case "completed":
      return "bg-success bg-opacity-10 text-success";
    case "pending":
    case "in attesa":
    case "in corso":
    case "in_progress":
      return "bg-warning bg-opacity-10 text-warning";
    case "rejected":
    case "cancelled":
      return "bg-error bg-opacity-10 text-error";
    case "planning":
    case "pianificazione":
      return "bg-primary-light bg-opacity-10 text-primary-light";
    default:
      return "bg-neutral-medium bg-opacity-10 text-neutral-medium";
  }
}

export function getStatusTranslation(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
      return "In attesa";
    case "approved":
      return "Approvato";
    case "rejected":
      return "Respinto";
    case "in_progress":
      return "In corso";
    case "planning":
      return "Pianificazione";
    case "completed":
      return "Completato";
    case "cancelled":
      return "Annullato";
    case "on_hold":
      return "In sospeso";
    default:
      return status;
  }
}

export function getLeaveTypeTranslation(type: string): string {
  switch (type.toLowerCase()) {
    case "vacation":
      return "Ferie";
    case "sick":
      return "Malattia";
    case "time_off":
      return "Permesso";
    default:
      return type;
  }
}

export function getExpenseCategoryTranslation(category: string): string {
  switch (category.toLowerCase()) {
    case "restaurant":
      return "Ristorante";
    case "transport":
      return "Trasporto";
    case "hotel":
      return "Hotel";
    case "office":
      return "Ufficio";
    case "other":
      return "Altro";
    default:
      return category;
  }
}

export function getExpenseCategoryIcon(category: string): string {
  switch (category.toLowerCase()) {
    case "restaurant":
      return "restaurant-line";
    case "transport":
      return "train-line";
    case "hotel":
      return "hotel-line";
    case "office":
      return "building-line";
    default:
      return "money-euro-circle-line";
  }
}
