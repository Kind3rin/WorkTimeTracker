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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        </div>
        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
          {icon}
        </div>
      </div>
      <div className="mt-2">
        {changeValue ? (
          <span className={`${getChangeColor()} text-sm font-medium flex items-center`}>
            {getChangeIcon()}
            {changeValue}
          </span>
        ) : infoText ? (
          <span className="text-neutral-500 text-sm font-medium">{infoText}</span>
        ) : null}
      </div>
    </div>
  );
}
