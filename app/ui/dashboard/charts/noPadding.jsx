'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Search, BarChart3 } from 'lucide-react';

const NoPaddingChart = ({ data = [
  { name: 'Jan', pv: 2400 },
  { name: 'Feb', pv: 1398 },
  { name: 'Mar', pv: 9800 },
  { name: 'Apr', pv: 3908 },
  { name: 'May', pv: 4800 },
  { name: 'Jun', pv: 3800 },
  { name: 'Jul', pv: 4300 },
  { name: 'Aug', pv: 2100 },
  { name: 'Sep', pv: 6700 },
  { name: 'Oct', pv: 5400 },
  { name: 'Nov', pv: 3200 },
  { name: 'Dec', pv: 7800 }
] }) => {
  const [filter, setFilter] = useState('');

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter, data]);

  // Calculate minimum width needed for the chart
  const barWidth = 80; // Recommended: 80–100px per bar
const minWidth = 700;
const chartWidth = Math.max(filteredData.length * barWidth, minWidth);

  return (
    <div className="w-full">
      {/* Search - positioned at top right */}
      <div className="flex justify-end mb-4">
        
      </div>

      {/* Results Counter */}
      {filter && (
        <div className="mb-3 px-3 py-2 bg-[var(--primary)]/5 rounded-lg border border-[var(--primary)]/20">
          <p className="text-sm text-[var(--primary)]">
            Showing {filteredData.length} of {data.length} results
          </p>
        </div>
      )}

      {/* Chart Container with Horizontal Scroll */}
  {filteredData.length === 0 ? (
  <div className="flex flex-col items-center justify-center h-72 text-[var(--textSoft)]">
    <BarChart3 className="w-12 h-12 mb-2 opacity-30" />
    <p className="text-sm font-medium">No data to display</p>
  </div>
) : (
  <div className="w-full overflow-x-auto">
    <div
      className="h-100"
      style={{
        width: `${chartWidth}px`,
        minWidth: '700px',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 40, right: 20, left: 20, bottom: 50 }}
              barSize={40}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--input-border)"
                opacity={0.4}
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 11,
                  fill: 'var(--textSoft)',
                  fontWeight: 500,
                }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={45}
                stroke="var(--textSoft)"
                strokeWidth={1}
              />

              <YAxis
                tick={{
                  fontSize: 12,
                  fill: 'var(--textSoft)',
                  fontWeight: 500,
                }}
                stroke="var(--textSoft)"
                strokeWidth={1}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bgSoft)',
                  borderColor: 'var(--input-border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontWeight: 500,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                cursor={{
                  fill: 'var(--primary)',
                  opacity: 0.1,
                }}
              />

              <Legend
                wrapperStyle={{
                  color: 'var(--textSoft)',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              />

              <Bar
                dataKey="pv"
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
                background={{
                  fill: 'var(--input-border)',
                  opacity: 0.1,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}


      {/* Footer Stats */}
  <div className="mt-6 pt-4 border-t border-[var(--input-border)]/50">
  <div className="flex flex-wrap items-center justify-between text-sm text-[var(--textSoft)] gap-4">
    {/* Left section: status indicators */}
    <div className="flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full shadow-md"></div>
        <span>Total</span>
        <span className="font-medium text-[var(--text)]">{data.length}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 bg-[var(--input-border)] rounded-full shadow-inner"></div>
        <span>Showing</span>
        <span className="font-medium text-[var(--text)]">{filteredData.length}</span>
      </div>
    </div>

    {/* Optional: Add a small legend or timestamp on the right */}
    <div className="text-xs text-[var(--textSoft)] italic">
      Updated just now
    </div>
  </div>
</div>

    </div>
  );
};

export default NoPaddingChart;