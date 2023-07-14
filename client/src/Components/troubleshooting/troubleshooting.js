import React, { useState } from 'react';
import { Tabs } from 'antd';
import LogViewer from './LogViewer';
import ComponentHealth from './componentHealth';

const { TabPane } = Tabs;

const TroubleshootingPage = () => {
  const [activeTab, setActiveTab] = useState('componentHealth');

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Component Health" key="componentHealth">
          <ComponentHealth />
        </TabPane>
        <TabPane tab="Log Viewer" key="logViewer">
          <LogViewer />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TroubleshootingPage;
