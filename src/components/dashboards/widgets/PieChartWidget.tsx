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
  const { metric } = widget.metric_config;

  // Generate sample data for demo (usually would have breakdown by campaign/ad set)
  const chartData = generateSampleData(data.value);

  return (
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="70%"
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
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
            formatter={(value: number) => [formatValue(value, metric), ""]}
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

// Helper to generate sample breakdown data
function generateSampleData(totalValue: number) {
  const segments = ["Campaña A", "Campaña B", "Campaña C", "Otras"];
  const weights = [0.4, 0.25, 0.2, 0.15];
  
  return segments.map((name, i) => ({
    name,
    value: totalValue * weights[i] * (0.8 + Math.random() * 0.4),
  }));
}
