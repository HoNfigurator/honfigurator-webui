import React, { useState } from 'react';
import { Tabs } from 'antd';
import LogViewer from './LogViewer';
import ComponentHealth from './componentHealth';

const { TabPane } = Tabs;

const TroubleshootingPage = () => {
  const [activeTab, setActiveTab] = useState('logViewer');

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Log Viewer" key="logViewer">
          <LogViewer />
        </TabPane>
        <TabPane tab="Component Health" key="componentHealth">
          <ComponentHealth />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TroubleshootingPage;
