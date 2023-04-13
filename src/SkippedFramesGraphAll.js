import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SkippedFramesGraphAll({ data, serverName }) {
  const [graphData, setGraphData] = useState([]);

  useEffect(() => {
    if (data) {
      const flattenedData = Object.values(data).reduce((acc, curr) => ({ ...acc, ...curr }), {});
      const graphData = Object.entries(flattenedData).map(([timestamp, value]) => ({ timestamp: parseInt(timestamp) * 1000, value }));
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
        <Tooltip formatter={(value) => `${value} ms`} labelFormatter={() => `Server: ${serverName}`} />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default SkippedFramesGraphAll;
