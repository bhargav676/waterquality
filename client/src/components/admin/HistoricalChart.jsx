import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HistoricalChart = ({ data, dataKey, unit, lineColor }) => {
  if (!data || data.length === 0) {
    return <p className="text-slate-500 text-center py-8">No historical data available for this period.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(timeStr) => new Date(timeStr).toLocaleTimeString()}
          stroke="#6b7280"
        />
        <YAxis stroke="#6b7280" unit={unit} domain={['auto', 'auto']} />
        <Tooltip
          labelFormatter={(timeStr) => new Date(timeStr).toLocaleString()}
          formatter={(value) => [`${value.toFixed(2)} ${unit}`, dataKey]}
        />
        <Legend />
        <Line type="monotone" dataKey={dataKey} stroke={lineColor || "#8884d8"} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default HistoricalChart;