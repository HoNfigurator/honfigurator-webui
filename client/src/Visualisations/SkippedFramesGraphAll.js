import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function CustomTooltip({ payload, label, active }) {
  if (active && payload && payload.length) {
    const { value, server } = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'white', padding: '8px', border: '1px solid #ccc' }}>
        <p>Server: {server}</p>
        <p>{value} ms</p>
      </div>
    );
  }

  return null;
}

function SkippedFramesGraphAll({ data }) {
  const [graphData, setGraphData] = useState([]);

  useEffect(() => {
    if (data) {
      const graphData = Object.entries(data)
        .flatMap(([server, serverData]) =>
          Object.entries(serverData).map(([timestamp, value]) => ({
            timestamp: parseInt(timestamp) * 1000,
            value,
            server,
          }))
        )
        .sort((a, b) => a.timestamp - b.timestamp);
      setGraphData(graphData);
    }
  }, [data]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={graphData}>
        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        <XAxis dataKey="timestamp" tickFormatter={formatTime} hide={false} />
        <YAxis domain={['auto', 'auto']} hide={false} tickFormatter={(value) => `${value}ms`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default SkippedFramesGraphAll;
