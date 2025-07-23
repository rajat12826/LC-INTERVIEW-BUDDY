// components/charts/SubmissionBarChart.tsx
'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React from 'react';

interface DifficultyData {
  name: string;
  solved: number;
  total: number;
}

interface SubmissionBarChartProps {
  data: DifficultyData[];
  darkMode: boolean;
}

const SubmissionBarChart: React.FC<SubmissionBarChartProps> = ({ data, darkMode }) => {
  const chartAxisColor = darkMode ? '#9CA3AF' : '#6B7280';
  const chartGridColor = darkMode ? '#374151' : '#E5E7EB';
  const chartTooltipBg = darkMode ? '#374151' : '#FFFFFF';
  const chartTooltipText = darkMode ? '#F9FAFB' : '#111827';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
        <XAxis dataKey="name" stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
        <YAxis stroke={chartAxisColor} tick={{ fill: chartAxisColor }} />
        <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartGridColor, color: chartTooltipText }} itemStyle={{ color: chartTooltipText }} />
        <Bar dataKey="solved" fill="#8884d8" name="Solved" />
        <Bar dataKey="total" fill="#82ca9d" name="Total Submissions" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SubmissionBarChart;