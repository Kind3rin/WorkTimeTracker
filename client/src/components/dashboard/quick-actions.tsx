import { quickActions } from "@/lib/constants";
import { Link } from "wouter";

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">Azioni Rapide</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.path}>
            <a className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-neutral-lightest transition-colors">
              <div className={`w-10 h-10 rounded-full ${action.bgClass} flex items-center justify-center mb-2`}>
                <i className={`ri-${action.icon} text-xl`}></i>
              </div>
              <span className="text-sm">{action.name}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
