import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { format, parseISO, subDays, startOfWeek, endOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { useState, useEffect } from "react";

interface WeeklyChartProps {
  data: {
    date: string;
    hours: number;
  }[];
  totalHours: number;
  onExport?: () => void;
}

export default function WeeklyChart({ data, totalHours, onExport }: WeeklyChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check initially
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  // Format day names
  const chartData = data.map((item) => {
    const date = parseISO(item.date);
    return {
      ...item,
      day: format(date, "EEE", { locale: it }),
      fullDay: format(date, "EEEE", { locale: it }),
    };
  });

  const getBarColor = (hours: number) => {
    if (hours === 0) return "#e5e7eb";
    return "#0066cc";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 h-full">
      <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Ore Lavorative Settimanali</h2>
      
      <div className="h-52 sm:h-56 md:h-64 overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 15,
              right: 10,
              left: -15,
              bottom: 15,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              fontSize={10}
              tickMargin={6}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickCount={5}
              domain={[0, 'auto']} 
              fontSize={10}
              width={25}
            />
            <Tooltip
              formatter={(value) => [`${value} ore`, "Ore Lavorate"]}
              labelFormatter={(value) => `${value}`}
              cursor={{ fill: 'rgba(0, 102, 204, 0.1)' }}
              contentStyle={{ fontSize: '12px', padding: '8px' }}
            />
            <Bar 
              dataKey="hours" 
              fill="#0066cc" 
              radius={[4, 4, 0, 0]}
              barSize={isMobile ? 25 : 40}
              name="Ore Lavorate"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <span className="text-xs sm:text-sm text-neutral-500">Totale Settimanale:</span>
          <span className="ml-1 font-medium text-sm sm:text-base">{totalHours} ore</span>
        </div>
        <div className="self-end sm:self-auto">
          {onExport && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary-500 hover:text-primary-600 hover:bg-transparent text-xs sm:text-sm font-medium h-8 px-2"
              onClick={onExport}
            >
              <span className="hidden sm:inline">Esporta Report</span>
              <span className="sm:hidden">Esporta</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
