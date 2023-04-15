import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Collapse, Button } from 'antd';
import StatusDetail from './StatusDetail';
import RequireAuth from './Security/RequireAuth';


function ServerStates() {
  const [serverStates, setServerStates] = useState([]);
  const [activeKey, setActiveKey] = useState(null);

  const fetchServerStates = async () => {
    const response = await axios.get('/api/get_instances_status');
    setServerStates(response.data);
  };

  useEffect(() => {
    fetchServerStates();
    const interval = setInterval(() => {
      fetchServerStates();
    }, 10000); // Adjust the time interval as needed (in milliseconds)

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status, scheduled_shutdown) => {
    if (status === 'Unknown') {
      return '#FF5252'; // Red
    } else if (status === 'Starting') {
      return '#3f87ba' // Blue
    } else if (status === 'Occupied' && scheduled_shutdown === 'No') {
      return '#d9d029' // Yellow
    } else if (status === 'Occupied' && scheduled_shutdown === 'Yes') {
      return '#fc8c03' // Orange
    } else if (status === 'Queued') {
      return '#8e918e' // Greay
    }
    return '#00C853'; // Green
  };

  const handleServerAction = async (port, action) => {
    // Make axios call to appropriate endpoint based on the action
    if (action === 'stop') {
      await axios.post('/api/stop_server', { port });
    } else if (action === 'start') {
      // Replace with your actual start server API endpoint
      await axios.post('/api/start_server', { port });
    }
  
    // Fetch updated server states after the action is performed
    fetchServerStates();
  };

  const getButtonAction = (status) => {
    return status === 'Ready' || status === 'Occupied' || status === 'Queued' || status === 'Starting' ? 'stop' : 'start';
  };
  
  const getButtonText = (status) => {
    return status === 'Ready' || status === 'Occupied' || status === 'Queued' || status === 'Starting' ? 'Stop Server' : 'Start Server';
  };
  
  const getButtonColor = (status) => {
    return status === 'Ready' || status === 'Occupied' || status === 'Queued' || status === 'Starting' ? '#FF5252' : '#3f87ba';
  }

  const getStatusText = (status) => {
    if (status.Status === 'Occupied') {
      return status["Game Phase"];
    } else {
      return status.Status;
    }
  }

  const expandAll = () => {
    setActiveKey(Object.keys(serverStates));
  };

  const collapseAll = () => {
    setActiveKey(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Button onClick={expandAll} style={{ marginRight: '8px' }}>Expand all</Button>
          <Button onClick={collapseAll}>Collapse all</Button>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
            <div style={{ backgroundColor: getStatusColor('Queued', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Queued</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
            <div style={{ backgroundColor: getStatusColor('Starting', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Starting</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
            <div style={{ backgroundColor: getStatusColor('Ready', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Ready</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
            <div style={{ backgroundColor: getStatusColor('Occupied', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Occupied</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
            <div style={{ backgroundColor: getStatusColor('Occupied', 'Yes'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Scheduled Shutdown</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ backgroundColor: getStatusColor('Unknown', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Unknown</span>
          </div>
        </div>
      </div>
      <Row gutter={[16, 16]}>
        {Object.entries(serverStates).map(([key, status]) => (
          <Col key={key} xs={24} sm={16} md={12} lg={8} xl={4} className="server-card">
            <div style={{ display: 'flex', marginBottom: '16px' }}>
              <div
                style={{
                  backgroundColor: getStatusColor(status.Status, status["Scheduled Shutdown"]),
                  width: '8px',
                  borderRadius: '8px',
                  marginRight: '0',
                }}
              ></div>
              <Collapse
                activeKey={activeKey}
                onChange={(key) => {
                  setActiveKey(key);
                }}
              >
                <Collapse.Panel
                  key={key}
                  header={
                    <div className="panel-header" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ paddingRight: '10px' }}>{key}</span>
                          <span style={{ paddingRight: '10px', fontSize: '12px', color: '#888888' }}>{getStatusText(status)}</span>
                        </div>
                        <Button
                          type="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServerAction(status.Port, getButtonAction(status.Status));
                          }}
                          style={{ height: '24px', padding: '0 10px', backgroundColor: getButtonColor(status.Status) }}
                        >
                          {getButtonText(status.Status)}
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <Card bordered={false} bodyStyle={{ padding: '10px' }}>
                    {Object.entries(status).map(([k, v]) => (
                      <StatusDetail key={k} label={k} data={v} port={status.Port} />
                    ))}
                  </Card>
                </Collapse.Panel>
              </Collapse>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default RequireAuth(ServerStates);
