import React from 'react';
import SkippedFramesGraph from './SkippedFramesGraphSingle';

function StatusDetail({ data, label, nestedKeys, port }) {
  const getValue = () => {
    if (nestedKeys) {
      return nestedKeys.reduce((acc, key) => acc[key], data);
    }
    return data;
  };

  const value = getValue();

  return (
    <div className="status-detail">
      <span style={{ fontWeight: 'bold' }}>{label}: </span>
      {typeof value === 'object' && value !== null && value !== undefined ? (
        <ul>
          {Object.entries(value).map(([key, val]) => (
            <li key={key}>
              <span className="status-detail-nested" style={{ fontWeight: 'bold' }}>{key}: </span>
              <span className="status-detail-child">{val}</span>
            </li>
          ))}
          <SkippedFramesGraph port={port} />
        </ul>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
  
}

export default StatusDetail;
