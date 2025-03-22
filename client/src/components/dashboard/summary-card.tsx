import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  changeValue?: string;
  changeType?: "positive" | "negative" | "neutral";
  infoText?: string;
}

export default function SummaryCard({
  title,
  value,
  icon,
  changeValue,
  changeType = "neutral",
  infoText,
}: SummaryCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-500";
      case "negative":
        return "text-red-500";
      default:
        return "text-neutral-500";
    }
  };

  const getChangeIcon = () => {
    if (changeType === "positive") {
      return <ArrowUp className="h-4 w-4 mr-1" />;
    } else if (changeType === "negative") {
      return <ArrowDown className="h-4 w-4 mr-1" />;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-2">
          <p className="text-neutral-500 text-xs sm:text-sm font-medium truncate">{title}</p>
          <h3 className="text-base sm:text-lg md:text-xl font-semibold mt-0.5 sm:mt-1 truncate">{value}</h3>
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-500 flex-shrink-0">
          {icon}
        </div>
      </div>
      <div className="mt-2">
        {changeValue ? (
          <span className={`${getChangeColor()} text-[10px] sm:text-xs md:text-sm font-medium flex items-center flex-wrap`}>
            {getChangeIcon()}
            <span className="truncate">{changeValue}</span>
          </span>
        ) : infoText ? (
          <span className="text-neutral-500 text-[10px] sm:text-xs md:text-sm font-medium truncate block">{infoText}</span>
        ) : null}
      </div>
    </div>
  );
}
