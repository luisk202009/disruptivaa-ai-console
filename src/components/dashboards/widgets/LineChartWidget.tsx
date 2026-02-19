import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { Widget } from "@/hooks/useWidgets";
import { MetricData, useMetaMetrics } from "@/hooks/useMetaMetrics";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

interface LineChartWidgetProps {
  widget: Widget;
  data: MetricData;
}

export const LineChartWidget = ({ widget, data }: LineChartWidgetProps) => {
  const { formatValue } = useMetaMetrics();
  const { t } = useTranslation();
  const { metric, currency: configCurrency } = widget.metric_config;
  const currency = data.currency || configCurrency || "USD";

  const currentPoints = data.data_points || [];
  const previousPoints = data.previous_data_points || [];

  const chartData = useMemo(() => {
    return currentPoints.map((dp, i) => ({
      date: dp.date,
      value: dp.value,
      previousValue: previousPoints[i]?.value ?? undefined,
    }));
  }, [currentPoints, previousPoints]);

  if (chartData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <AlertTriangle size={24} />
        <p className="text-sm text-center">Sin datos disponibles para el período seleccionado</p>
      </div>
    );
  }

  const hasPrevious = previousPoints.length > 0;

  return (
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
            tickFormatter={(value) => formatValue(value, metric, currency)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => {
              const label = name === "previousValue"
                ? t("comparison.previousPeriod")
                : t("comparison.currentPeriod");
              return [formatValue(value, metric, currency), label];
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          {hasPrevious && (
            <Line
              type="monotone"
              dataKey="previousValue"
              stroke="#6B7280"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              strokeOpacity={0.6}
              dot={false}
              activeDot={false}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary-company, hsl(var(--primary)))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "var(--primary-company, hsl(var(--primary)))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
