import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload, label, valueFormatter, labelFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white/90 shadow-lg rounded-md border border-slate-200">
        <p className="text-xs text-slate-600">{labelFormatter ? labelFormatter(label) : new Date(label).toLocaleTimeString()}</p>
        <p className={`text-sm font-semibold`} style={{ color: payload[0].stroke }}>
          {`${payload[0].name}: ${valueFormatter ? valueFormatter(payload[0].value) : payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

const MiniTrendChart = ({ data, dataKey, strokeColor, name, unit = "" }) => {
  if (!data || data.length < 2) { // Need at least 2 points to draw a line
    return <p className="text-xs text-center text-slate-500 py-4">Not enough data for trend.</p>;
  }

  // Ensure data is sorted by timestamp if it's not already
  const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Prepare data for Recharts, converting timestamp to a plottable format (e.g., epoch time)
  const chartData = sortedData.map(item => ({
    ...item,
    time: new Date(item.timestamp).getTime(), // Use epoch for XAxis
  }));

  const valueFormatter = (value) => `${value}${unit}`;
  const labelFormatter = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart 
        data={chartData}
        margin={{ top: 5, right: 10, left: -25, bottom: 5 }} // Adjusted left margin for YAxis
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
        <XAxis
          dataKey="time"
          type="number" // Since 'time' is epoch
          domain={['dataMin', 'dataMax']}
          tickFormatter={labelFormatter}
          fontSize={10}
          stroke="#94a3b8"
          tickCount={3}
        />
        <YAxis
          fontSize={10}
          stroke="#94a3b8"
          domain={['auto', 'auto']} // Or specify min/max based on sensor type
          tickFormatter={value => parseFloat(value.toFixed(1))} // Format y-axis ticks
        />
        <Tooltip 
          content={<CustomTooltip valueFormatter={valueFormatter} />}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={strokeColor || "#8884d8"}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          name={name}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MiniTrendChart;