import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface ActivityDistributionProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  title?: string;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  index,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
  index: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Su dispositivi mobili o con pezzi piccoli della torta, mostriamo solo le percentuali più grandi
  const minPercentToShow = window.innerWidth < 640 ? 0.08 : 0.05;

  return percent > minPercentToShow ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={window.innerWidth < 640 ? 10 : 12}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default function ActivityDistributionChart({ data, title = "Distribuzione Attività" }: ActivityDistributionProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Custom label renderer that accesses the isMobile state
  const CustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Mostriamo solo le percentuali più grandi in base alla dimensione del display
    const minPercentToShow = isMobile ? 0.08 : 0.05;
    
    return percent > minPercentToShow ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={isMobile ? 10 : 12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-0 sm:pb-2 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
        <CardTitle className="text-base sm:text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 md:px-6 pb-2 sm:pb-4 md:pb-6">
        <div className="h-[200px] sm:h-[220px] md:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={isMobile ? (data.length > 4 ? 60 : 70) : (data.length > 5 ? 70 : 80)}
                innerRadius={isMobile ? (data.length > 4 ? 25 : 0) : (data.length > 5 ? 30 : 0)}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} ore`, name]}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: isMobile ? '12px' : '14px',
                  padding: isMobile ? '6px' : '8px'
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={isMobile ? 5 : 6}
                formatter={(value) => <span className="text-xs sm:text-sm truncate">{value}</span>}
                wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}