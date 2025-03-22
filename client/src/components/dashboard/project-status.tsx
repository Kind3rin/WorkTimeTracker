import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Link } from "wouter";
import { getStatusBadgeColor, getStatusTranslation, formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function ProjectStatus() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const activeProjects = projects?.slice(0, 2) || [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Stato Progetti</h2>
        <Link href="/projects">
          <a className="text-primary text-sm hover:underline">Tutti i progetti</a>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {activeProjects.length > 0 ? (
            activeProjects.map((project) => (
              <div key={project.id} className="border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{project.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(project.status)}`}>
                    {getStatusTranslation(project.status)}
                  </span>
                </div>
                <p className="text-sm text-neutral-medium mb-2">Completamento: {project.progress}%</p>
                <div className="w-full bg-neutral-lightest rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-neutral-medium mt-2">
                  <span>Inizio: {formatDate(project.startDate)}</span>
                  <span>Fine prevista: {formatDate(project.endDate) || "Non definita"}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-6 text-neutral-medium">
              Nessun progetto attivo.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
