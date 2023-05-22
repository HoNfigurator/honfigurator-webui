// StatusDetail.js
import React from 'react';
import SkippedFramesGraph from '../Visualisations/SkippedFramesGraphSingle';
import { Tag } from 'antd';
import styles from './StatusDetail.module.css';

export const tags = ["Match ID", "CPU Core", "Region"];
const allowedLabels = ['Region', 'Match ID', 'Public Game Port', 'Public Voice Port', 'Status', 'Game Phase', 'Connections', 'Players', 'Match Duration', 'Uptime', 'CPU Core', 'CPU Utilisation', 'Scheduled Shutdown', 'Proxy Enabled', 'Performance (lag)'];

function StatusDetail({ data, label, nestedKeys, port, status }) {
  const getValue = () => {
    if (nestedKeys) {
      return nestedKeys.reduce((acc, key) => acc[key], data);
    }
    return data;
  };

  let value = getValue();

  if (allowedLabels.includes(label)) {
    if (tags.includes(label)) {
      if (!value) { return; }
      if (label === "Match ID") {
        const matchDuration = status['Match Duration'];
        if (matchDuration) {
          value = `M${value} (${matchDuration})`
        } else {
          value = `M${value}`;
        }
      } else if (label === "CPU Core") {
        const cpuUtil = status['CPU Utilisation'];
        if (cpuUtil) {
          value = `Core ${value} - ${cpuUtil}`
        } else {
          value = `Core ${value}`
        }
      }
      return (
        <div className={`status-detail ${styles['status-detail']}`}>
          <div className={styles['tags-container']}>
            <Tag color="blue" className={styles['tag']}>
              {value}
            </Tag>
          </div>
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