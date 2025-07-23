// components/charts/SubmissionLineChart.tsx
'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React from 'react';

interface SubmissionTrendData {
  date: string;
  total: number;
  accepted: number;
}

interface SubmissionLineChartProps {
  data: SubmissionTrendData[];
  darkMode: boolean;
}

const SubmissionLineChart: React.FC<SubmissionLineChartProps> = ({ data, darkMode }) => {
  const chartAxisColor = darkMode ? '#9CA3AF' : '#6B7280';
  const chartGridColor = darkMode ? '#374151' : '#E5E7EB';
  const chartTooltipBg = darkMode ? '#374151' : '#FFFFFF';
  const chartTooltipText = darkMode ? '#F9FAFB' : '#111827';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
        <XAxis dataKey="date" stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
        <YAxis stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
        <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartGridColor, color: chartTooltipText }} itemStyle={{ color: chartTooltipText }} />
        <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Submissions" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="accepted" stroke="#82ca9d" name="Accepted Submissions" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SubmissionLineChart;