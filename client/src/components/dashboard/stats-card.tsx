import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  footnote?: string;
  borderColor: string;
  iconBgClass: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  footnote,
  borderColor,
  iconBgClass,
}: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm p-4 border-l-4", borderColor)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-neutral-medium text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-1 flex items-center",
              trend.positive ? "text-success" : "text-error"
            )}>
              <i className={cn(
                "mr-1",
                trend.positive ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"
              )}></i>
              <span>{trend.value}</span>
            </p>
          )}
          {footnote && !trend && (
            <p className="text-xs text-neutral-medium mt-1">{footnote}</p>
          )}
        </div>
        <div className={cn("p-2 rounded-full", iconBgClass)}>
          <i className={cn(`ri-${icon} text-xl`)}></i>
        </div>
      </div>
    </div>
  );
}
