import { useQuery } from "@tanstack/react-query";
import { TimeEntry } from "@shared/schema";
import { Link } from "wouter";
import { getStatusBadgeColor, getStatusTranslation, formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function RecentTimesheet() {
  const { data: timeEntries, isLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  const recentEntries = timeEntries?.slice(0, 5) || [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Consuntivi Recenti</h2>
        <Link href="/timesheet">
          <a className="text-primary text-sm hover:underline">Vedi tutti</a>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-52">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-medium">
                <th className="pb-2 font-semibold">Data</th>
                <th className="pb-2 font-semibold">Progetto</th>
                <th className="pb-2 font-semibold">Ore</th>
                <th className="pb-2 font-semibold">Stato</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.length > 0 ? (
                recentEntries.map((entry, index) => (
                  <tr key={entry.id} className={index < recentEntries.length - 1 ? "border-b" : ""}>
                    <td className="py-2">{formatDate(entry.date)}</td>
                    <td className="py-2">Project ID: {entry.projectId}</td>
                    <td className="py-2">{entry.hours}h</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(entry.status)}`}>
                        {getStatusTranslation(entry.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-neutral-medium">
                    Nessun consuntivo recente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
