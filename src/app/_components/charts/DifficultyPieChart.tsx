// components/charts/DifficultyPieChart.tsx
'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import React from 'react';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface DifficultyPieChartProps {
  data: PieChartData[];
  darkMode: boolean;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Tailwind colors: Emerald, Amber, Red

const DifficultyPieChart: React.FC<DifficultyPieChartProps> = ({ data, darkMode }) => {
  const chartTooltipBg = darkMode ? '#374151' : '#FFFFFF';
  const chartGridColor = darkMode ? '#374151' : '#E5E7EB'; // Used for tooltip border
  const chartTooltipText = darkMode ? '#F9FAFB' : '#111827';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartGridColor, color: chartTooltipText }} itemStyle={{ color: chartTooltipText }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DifficultyPieChart;