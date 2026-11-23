import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface DailySeriesPoint {
  date: string;
  label: string;
  activeUsers: number;
  avgMinutes: number;
}

interface AdminMiniChartsProps {
  dailySeries30d: DailySeriesPoint[];
}

export const AdminMiniCharts: React.FC<AdminMiniChartsProps> = ({ dailySeries30d }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
      <div
        id="chart-active-users-30d"
        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50"
      >
        <div className="text-[11px] font-extrabold text-slate-700 mb-1.5">
          Usuarios activos por día (30 días)
        </div>
        <div style={{ width: '100%', height: 135 }}>
          <ResponsiveContainer width="100%" height={135}>
            <BarChart data={dailySeries30d} margin={{ top: 4, right: 6, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={6} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(96,165,250,0.35)',
                  borderRadius: 10,
                  color: '#F8FAFC',
                  fontSize: 11,
                }}
                formatter={(value) => [`${value} usuarios`, 'Activos']}
              />
              <Bar dataKey="activeUsers" name="Activos" fill="#3B82F6" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        id="chart-avg-usage-30d"
        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50"
      >
        <div className="text-[11px] font-extrabold text-slate-700 mb-1.5">
          Uso promedio diario (min/usuario)
        </div>
        <div style={{ width: '100%', height: 135 }}>
          <ResponsiveContainer width="100%" height={135}>
            <AreaChart data={dailySeries30d} margin={{ top: 4, right: 6, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAvgMin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={6} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(52,211,153,0.35)',
                  borderRadius: 10,
                  color: '#F8FAFC',
                  fontSize: 11,
                }}
                formatter={(value) => [`${value} min`, 'Promedio']}
              />
              <Area
                type="monotone"
                dataKey="avgMinutes"
                name="Promedio (min)"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#gradAvgMin)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminMiniCharts;
