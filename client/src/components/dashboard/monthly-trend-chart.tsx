import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine } from "lucide-react";

interface MonthlyTrendChartProps {
  data: {
    date: string;
    hours: number;
    expenses?: number;
  }[];
  title?: string;
  onExport?: () => void;
}

export default function MonthlyTrendChart({ 
  data, 
  title = "Andamento Mensile", 
  onExport 
}: MonthlyTrendChartProps) {
  const [activeView, setActiveView] = useState<string>("hours");

  // Calcola il totale delle ore
  const totalHours = data.reduce((sum, item) => sum + item.hours, 0);
  
  // Calcola il totale delle spese se disponibili
  const totalExpenses = data.reduce((sum, item) => sum + (item.expenses || 0), 0);

  // Formatta i dati per il grafico
  const formattedData = data.map(item => {
    const day = new Date(item.date).getDate();
    return {
      ...item,
      // Estrai solo il giorno dalla data per l'etichetta dell'asse X
      day
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const originalData = data.find(d => new Date(d.date).getDate() === parseInt(label));
      const dateObj = originalData ? new Date(originalData.date) : new Date();
      const formattedDate = dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
      
      return (
        <div className="bg-white p-3 border rounded-md shadow-sm">
          <p className="font-medium text-sm">{formattedDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === "Ore" ? `${entry.value} ore` : 
               entry.name === "Spese" ? `€${entry.value.toFixed(2)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {onExport && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onExport}
              className="h-8 px-2 text-muted-foreground"
            >
              <ArrowDownToLine className="h-4 w-4 mr-1" />
              <span className="text-xs">Esporta</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hours" value={activeView} onValueChange={setActiveView}>
          <TabsList className="mb-4">
            <TabsTrigger value="hours">Ore Lavorate</TabsTrigger>
            {data.some(item => item.expenses !== undefined) && (
              <TabsTrigger value="expenses">Spese</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="hours" className="mt-0">
            <div className="text-xs text-muted-foreground mb-1">
              Totale: <span className="font-medium text-foreground">{totalHours.toFixed(1)} ore</span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066cc" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0066cc" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    fontSize={11}
                    tickMargin={8}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#0066cc" 
                    strokeWidth={2}
                    fill="url(#colorHours)" 
                    name="Ore"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          {data.some(item => item.expenses !== undefined) && (
            <TabsContent value="expenses" className="mt-0">
              <div className="text-xs text-muted-foreground mb-1">
                Totale: <span className="font-medium text-foreground">€{totalExpenses.toFixed(2)}</span>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={formattedData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      fontSize={11}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      fontSize={11}
                      tickMargin={8}
                      domain={[0, 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#colorExpenses)" 
                      name="Spese"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}