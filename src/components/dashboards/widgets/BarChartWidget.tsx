import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { Widget } from "@/hooks/useWidgets";
import { MetricData, useMetaMetrics } from "@/hooks/useMetaMetrics";

interface BarChartWidgetProps {
  widget: Widget;
  data: MetricData;
}

export const BarChartWidget = ({ widget, data }: BarChartWidgetProps) => {
  const { formatValue } = useMetaMetrics();
  const { metric } = widget.metric_config;

  // Generate sample data if no data_points
  const chartData = data.data_points?.length
    ? data.data_points
    : generateSampleData(data.value);

  return (
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatValue(value, metric)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [formatValue(value, metric), widget.title]}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
          />
          <Bar
            dataKey="value"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Helper to generate sample data for demo
function generateSampleData(baseValue: number) {
  const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  return days.map((date, i) => ({
    date,
    value: baseValue * (0.5 + Math.random() * 0.8) * ((i + 3) / 7),
  }));
}
