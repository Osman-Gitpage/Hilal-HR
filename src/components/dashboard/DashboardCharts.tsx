"use client";

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingUp, Banknote, Landmark } from "lucide-react";

interface ChartItem {
  donem: string;
  tutar: number;
}

interface FinanceItem {
  donem: string;
  gelir: number;
  gider: number;
}

interface DashboardChartsProps {
  payrollData: ChartItem[];
  financeData: FinanceItem[];
}

function formatTL(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardCharts({ payrollData, financeData }: DashboardChartsProps) {
  // Custom tooltips for nice styling
  const CustomPayrollTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border bg-background/95 backdrop-blur px-3 py-2.5 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-muted-foreground">{label}</p>
          <p className="font-bold text-emerald-600 dark:text-emerald-400">
            {formatTL(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomFinanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border bg-background/95 backdrop-blur px-3 py-2.5 shadow-xl text-xs space-y-1.5">
          <p className="font-semibold text-muted-foreground">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-4 justify-between">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.fill }}
                />
                <span className="text-muted-foreground font-medium">{p.name}:</span>
              </span>
              <span
                className="font-bold"
                style={{ color: p.fill }}
              >
                {formatTL(p.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payroll Trend Area Chart */}
      <Card className="shadow-xs hover:shadow-md transition-shadow duration-200 border-border/80">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Maaş Giderleri Trendi
            </CardTitle>
            <CardDescription className="text-xs">
              Son 6 ayın onaylı toplam maaş ve bordro ödemeleri
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="h-72 px-2 pb-2">
          {payrollData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Henüz onaylanmış bordro verisi bulunmuyor.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={payrollData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.627 0.194 149.214)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="oklch(0.627 0.194 149.214)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                <XAxis
                  dataKey="donem"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip content={<CustomPayrollTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tutar"
                  stroke="oklch(0.627 0.194 149.214)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPayroll)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Finance Income vs Expense Bar Chart */}
      <Card className="shadow-xs hover:shadow-md transition-shadow duration-200 border-border/80">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Landmark className="h-4 w-4 text-blue-500" />
              Gelir & Gider Karşılaştırması
            </CardTitle>
            <CardDescription className="text-xs">
              Son 6 ayda kesilen fatura ve cari işlemlerin nakit akışı
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="h-72 px-2 pb-2">
          {financeData.length === 0 || (financeData.every(d => d.gelir === 0 && d.gider === 0)) ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Henüz cari belge/fatura verisi bulunmuyor.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financeData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                <XAxis
                  dataKey="donem"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip content={<CustomFinanceTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 10 }}
                />
                <Bar
                  name="Gelir"
                  dataKey="gelir"
                  fill="oklch(0.538 0.176 220.088)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  name="Gider"
                  dataKey="gider"
                  fill="oklch(0.609 0.176 34.022)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
