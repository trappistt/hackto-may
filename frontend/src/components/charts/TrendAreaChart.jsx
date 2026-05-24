import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart.jsx";
import { cn } from "@/lib/utils";

/**
 * Gradient area chart — styled after ui.corr.sh area-chart (recharts + token colors).
 */
export default function TrendAreaChart({
  data,
  chartConfig,
  xKey = "month",
  className,
  valueFormatter = (v) => v.toLocaleString("en-CA"),
  yTickFormatter
}) {
  const seriesKeys = Object.keys(chartConfig);

  return (
    <ChartContainer config={chartConfig} className={cn("aspect-[5/3]", className)}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {seriesKeys.map((key) => (
            <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--color-${key})`} stopOpacity={0.35} />
              <stop offset="100%" stopColor={`var(--color-${key})`} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={48}
          tickFormatter={yTickFormatter}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => valueFormatter(Number(value))}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {seriesKeys.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={chartConfig[key].label}
            stroke={`var(--color-${key})`}
            fill={`url(#fill-${key})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
