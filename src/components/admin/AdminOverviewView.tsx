import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Layers,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AdminOverviewView: React.FC = () => {
  const { orders, formatCurrency } = useStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'completed'),
    [orders]
  );

  const totalGrossRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.grandTotal, 0),
    [completedOrders]
  );

  const totalGrossProfit = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.grossProfit, 0),
    [completedOrders]
  );

  const totalCOGS = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.totalCost, 0),
    [completedOrders]
  );

  const totalTax = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.taxTotal, 0),
    [completedOrders]
  );

  const totalOrdersCount = completedOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalGrossRevenue / totalOrdersCount : 0;
  const profitMargin =
    totalGrossRevenue > 0
      ? ((totalGrossProfit / totalGrossRevenue) * 100).toFixed(1)
      : '0.0';

  // Minimal Chart Data
  const chartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : 30;
    const daysMap: Record<string, { label: string; revenue: number; profit: number }> = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      daysMap[key] = { label: key, revenue: 0, profit: 0 };
    }

    completedOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (daysMap[key]) {
        daysMap[key].revenue += o.grandTotal;
        daysMap[key].profit += o.grossProfit;
      }
    });

    return Object.values(daysMap);
  }, [completedOrders, timeRange]);

  return (
    <div className="space-y-4">
      {/* Small Rectangle Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Gross Sales */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gross Sales
            </span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight block">
            {formatCurrency(totalGrossRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {totalOrdersCount} orders
          </span>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Gross Profit
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-lg font-black text-blue-600 tracking-tight block">
            {formatCurrency(totalGrossProfit)}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
            {profitMargin}% margin
          </span>
        </div>

        {/* Orders & Ticket */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Orders & Ticket
            </span>
            <Receipt className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight block">
            {totalOrdersCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Avg: {formatCurrency(avgOrderValue)}
          </span>
        </div>

        {/* Cost & Tax */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cost & Tax
            </span>
            <Layers className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight block">
            {formatCurrency(totalCOGS)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Tax: {formatCurrency(totalTax)}
          </span>
        </div>
      </div>

      {/* Minimal Graph with Small Buttons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">
            Revenue Trend
          </h3>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(val) => `£${val}`} />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    formatCurrency(val),
                    name === 'revenue' ? 'Revenue' : 'Profit',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#FFF',
                    border: 'none',
                    fontSize: '11px',
                    padding: '6px 10px',
                  }}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[3, 3, 0, 0]} name="revenue" />
                <Bar dataKey="profit" fill="#3B82F6" radius={[3, 3, 0, 0]} name="profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No sales logged
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
