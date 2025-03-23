import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export interface Activity {
  id: number;
  date: string;
  activity: string;
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface ActivityTableProps {
  activities: Activity[];
  caption?: string;
  limit?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export default function ActivityTable({ 
  activities, 
  caption = "Recent Activities", 
  limit,
  showViewAll = false,
  onViewAll
}: ActivityTableProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approvato</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rifiutato</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Attesa</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      <div className="sticky top-0 z-10 bg-white px-3 sm:px-6 py-3 sm:py-4 border-b flex justify-between items-center">
        <h2 className="text-base sm:text-lg font-medium">{caption}</h2>
        {showViewAll && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary-500 hover:text-primary-600 hover:bg-transparent text-xs sm:text-sm font-medium h-8 px-2"
            onClick={onViewAll}
          >
            <span className="hidden sm:inline">Vedi Tutte</span>
            <span className="sm:hidden">Vedi</span>
          </Button>
        )}
      </div>
      
      {/* Mobile View - Card Layout - Ottimizzato per touch */}
      <div className="block md:hidden overflow-auto">
        {displayActivities.length > 0 ? (
          <div className="divide-y">
            {displayActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="p-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
                role="button"
                tabIndex={0}
                aria-label={`Attività: ${activity.activity}`}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-500">{formatDate(activity.date)}</span>
                  <span className="text-xs font-semibold bg-neutral-100 px-2 py-0.5 rounded-full">{activity.hours} ore</span>
                </div>
                <p className="text-sm font-medium mb-3 line-clamp-2">{activity.activity}</p>
                <div>{getStatusBadge(activity.status)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500 text-sm">
            <div className="mb-2">📅</div>
            <p>Nessuna attività registrata</p>
            <p className="text-xs mt-1">Le attività appariranno qui una volta inserite</p>
          </div>
        )}
      </div>
      
      {/* Desktop View - Table Layout */}
      <div className="hidden md:block p-2 sm:p-4 md:p-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-neutral-500 text-xs sm:text-sm font-medium py-2 px-2 sm:px-4">Data</TableHead>
              <TableHead className="text-neutral-500 text-xs sm:text-sm font-medium py-2 px-2 sm:px-4">Attività</TableHead>
              <TableHead className="text-neutral-500 text-xs sm:text-sm font-medium py-2 px-2 sm:px-4">Ore</TableHead>
              <TableHead className="text-neutral-500 text-xs sm:text-sm font-medium py-2 px-2 sm:px-4">Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayActivities.length > 0 ? (
              displayActivities.map((activity) => (
                <TableRow key={activity.id} className="border-b text-xs sm:text-sm hover:bg-neutral-50 transition-colors">
                  <TableCell className="py-2 sm:py-3 px-2 sm:px-4 text-neutral-500 whitespace-nowrap">{formatDate(activity.date)}</TableCell>
                  <TableCell className="py-2 sm:py-3 px-2 sm:px-4 max-w-[100px] sm:max-w-[300px] truncate">{activity.activity}</TableCell>
                  <TableCell className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">{activity.hours}</TableCell>
                  <TableCell className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">{getStatusBadge(activity.status)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-3 sm:py-4 text-neutral-500 text-xs sm:text-sm">
                  Nessuna attività registrata
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
