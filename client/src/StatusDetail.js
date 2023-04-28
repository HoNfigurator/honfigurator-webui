// StatusDetail.js
import React from 'react';
import SkippedFramesGraph from './SkippedFramesGraphSingle';
import { Tag } from 'antd';

function StatusDetail({ data, label, nestedKeys, port }) {
  const getValue = () => {
    if (nestedKeys) {
      return nestedKeys.reduce((acc, key) => acc[key], data);
    }
    return data;
  };

  const value = getValue();

  const tagStyle = {
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  };

  const regionTagStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
  };

  const boldStyle = {
    fontWeight: 'bold',
  };

  if (label === 'Region') {
    return (
      <div className="status-detail tag" style={tagStyle}>
        <Tag color="blue" style={regionTagStyle}>
          {value}
        </Tag>
      </div>
    );
  } else {
    return (
      <div className="status-detail">
        <span style={boldStyle}>{label}: </span>
        {typeof value === 'object' && value !== null && value !== undefined ? (
          <ul>
            {Object.entries(value).map(([key, val]) => (
              <li key={key}>
                <span className="status-detail-nested" style={boldStyle}>
                  {key}:
                </span>
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
}

export default StatusDetail;
