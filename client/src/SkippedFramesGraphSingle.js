import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { createAxiosInstanceServer, axiosInstanceServer } from './Security/axiosRequestFormat';

function SkippedFramesGraph({ port, address }) {
  const [data, setData] = useState([]);
  // const axiosInstanceServer = createAxiosInstanceServer(address);

  const fetchData = useCallback(async () => {
    try {
      const response = await axiosInstanceServer.get(`/api/get_skipped_frame_data/${port}?_t=${Date.now()}`);
      const sortedData = Object.entries(response.data)
        .map(([timestamp, value]) => ({
          timestamp: new Date(parseInt(timestamp) * 1000).getTime(),
          value,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setData(sortedData);
    } catch (error) {
      console.error('Error fetching skipped frame data:', error);
    }
  }, [port]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

const formatValue = (value) => `${value}ms`;

const formatTooltipContent = (value, name, props) => [
  formatValue(value),
  new Date(props.payload.timestamp).toLocaleString(),
];

return (
  <LineChart width={200} height={80} data={data}>
    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
    <XAxis dataKey="timestamp" hide={true} />
    <YAxis domain={['auto', 'auto']} hide={true} />
    <Tooltip
      labelFormatter={() => ""}
      formatter={formatTooltipContent}
      contentStyle={{ backgroundColor: "#f5f5f5", border: "none", borderRadius: "5px", padding: "0 4px 0 4px" }}
    />
    <Legend />
  </LineChart>
);
}

export default SkippedFramesGraph;
