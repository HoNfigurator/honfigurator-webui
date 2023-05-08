// StatusDetail.js
import React from 'react';
import SkippedFramesGraph from '../Visualisations/SkippedFramesGraphSingle';
import { Tag } from 'antd';
import styles from './StatusDetail.module.css';

function StatusDetail({ data, label, nestedKeys, port }) {
  const getValue = () => {
    if (nestedKeys) {
      return nestedKeys.reduce((acc, key) => acc[key], data);
    }
    return data;
  };

  const value = getValue();

  // Add the labels you want to render here
  const allowedLabels = ['Region', 'Match ID', 'Public Game Port', 'Public Voice Port', 'Status', 'Game Phase', 'Connections', 'Players', 'Uptime', 'CPU Core', 'Scheduled Shutdown', 'Proxy Enabled', 'Performance (lag)'];

  if (allowedLabels.includes(label)) {
    if (label === 'Region') {
      return (
        <div className={`status-detail ${styles['status-detail']}`}>
          <Tag color="blue" className={styles['region-tag']}>
            {value}
          </Tag>
        </div>
      );
    } else {
      return (
        <div className="status-detail">
          <span className={styles['bold-text']}>{label}: </span>
          {typeof value === 'object' && value !== null && value !== undefined ? (
            <ul>
              {Object.entries(value).map(([key, val]) => (
                <li key={key}>
                  <span className={`status-detail-nested ${styles['bold-text']}`}>
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
  // Return null if the label is not in the allowedLabels array
  return null;
}

export default StatusDetail;
