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

interface WeeklyChartProps {
  data: {
    date: string;
    hours: number;
  }[];
  totalHours: number;
  onExport?: () => void;
}

export default function WeeklyChart({ data, totalHours, onExport }: WeeklyChartProps) {
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">Ore Lavorative Settimanali</h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickCount={5}
              domain={[0, 'auto']} 
            />
            <Tooltip
              formatter={(value) => [`${value} ore`, "Ore Lavorate"]}
              labelFormatter={(value) => `${value}`}
              cursor={{ fill: 'rgba(0, 102, 204, 0.1)' }}
            />
            <Bar 
              dataKey="hours" 
              fill="#0066cc" 
              radius={[4, 4, 0, 0]}
              barSize={40}
              name="Ore Lavorate"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div>
          <span className="text-sm text-neutral-500">Totale Settimanale:</span>
          <span className="ml-1 font-medium">{totalHours} ore</span>
        </div>
        <div>
          <Button 
            variant="ghost" 
            className="text-primary-500 hover:text-primary-600 hover:bg-transparent text-sm font-medium"
            onClick={onExport}
          >
            Esporta Report
          </Button>
        </div>
      </div>
    </div>
  );
}
