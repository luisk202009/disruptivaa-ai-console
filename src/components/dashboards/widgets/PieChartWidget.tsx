import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  Legend 
} from "recharts";
import { Widget } from "@/hooks/useWidgets";
import { MetricData, useMetaMetrics } from "@/hooks/useMetaMetrics";
import { AlertTriangle } from "lucide-react";

interface PieChartWidgetProps {
  widget: Widget;
  data: MetricData;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(27, 100%, 65%)", // lighter orange
  "hsl(27, 80%, 75%)",  // even lighter
  "hsl(var(--muted))",
  "hsl(var(--secondary))",
];

export const PieChartWidget = ({ widget, data }: PieChartWidgetProps) => {
  const { formatValue } = useMetaMetrics();
  const { metric, currency: configCurrency } = widget.metric_config;
  const currency = data.currency || configCurrency || "USD";

  // Only use real data_points - no fallback to mock data
  const chartData = data.data_points || [];

  if (chartData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <AlertTriangle size={24} />
        <p className="text-sm text-center">Sin datos disponibles para el período seleccionado</p>
      </div>
    );
  }

  // Transform data_points to pie chart format (group by date for now)
  const pieData = chartData.map((point, index) => ({
    name: point.date,
    value: point.value,
  }));

  return (
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="70%"
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [formatValue(value, metric, currency), ""]}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "10px" }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
