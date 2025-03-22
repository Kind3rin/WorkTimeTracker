import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy', { locale: it });
}

export function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}

export function getStatusTranslation(status: string) {
  switch (status) {
    case 'approved':
      return 'Approvato';
    case 'rejected':
      return 'Rifiutato';
    case 'pending':
    default:
      return 'In attesa';
  }
}
