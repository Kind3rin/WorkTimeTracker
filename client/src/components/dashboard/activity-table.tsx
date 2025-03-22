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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">{caption}</h2>
        {showViewAll && (
          <Button 
            variant="ghost" 
            className="text-primary-500 hover:text-primary-600 hover:bg-transparent text-sm font-medium"
            onClick={onViewAll}
          >
            Vedi Tutte
          </Button>
        )}
      </div>
      
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-neutral-500 text-sm font-medium">Data</TableHead>
              <TableHead className="text-neutral-500 text-sm font-medium">Attività</TableHead>
              <TableHead className="text-neutral-500 text-sm font-medium">Ore</TableHead>
              <TableHead className="text-neutral-500 text-sm font-medium">Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayActivities.length > 0 ? (
              displayActivities.map((activity) => (
                <TableRow key={activity.id} className="border-b text-sm">
                  <TableCell className="py-3 text-neutral-500">{formatDate(activity.date)}</TableCell>
                  <TableCell className="py-3">{activity.activity}</TableCell>
                  <TableCell className="py-3">{activity.hours}</TableCell>
                  <TableCell className="py-3">{getStatusBadge(activity.status)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-neutral-500">
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
