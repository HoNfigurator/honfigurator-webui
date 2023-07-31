// ServerStatus.js
import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Collapse, Button, message } from 'antd';
import StatusDetail, { tags } from './StatusDetail'; // Don't forget to export tags from StatusDetail.js
import { createAxiosInstanceServer } from '../Security/axiosRequestFormat';
import { SelectedServerContext } from '../App';
import './ServerStatus.css';

function ServerStates() {
  const [serverStates, setServerStates] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const { selectedServerValue, selectedServerPort } = useContext(SelectedServerContext);
  const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue, selectedServerPort);

  const fetchServerStates = async () => {
    const response = await axiosInstanceServer.get(`/get_instances_status?_t=${Date.now()}`);
    if (response.data) {
      setServerStates(response.data);
    } else {
      console.log("No servers.");
    }
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
      return '#3f87ba'; // Blue
    } else if (status === 'Occupied' && scheduled_shutdown === 'No') {
      return '#d9d029'; // Yellow
    } else if (status === 'Occupied' && scheduled_shutdown === 'Yes') {
      return '#fc8c03'; // Orange
    } else if (status === 'Ready' && scheduled_shutdown === 'Yes') {
      return '#fc8c03'; // Orange
    } else if (status === 'Queued') {
      return '#8e918e'; // Greay
    }
    return '#00C853'; // Green
  };

  const handleServerAction = async (port, action) => {
    try {
      // Make axios call to appropriate endpoint based on the action
      if (action === 'stop') {
        await axiosInstanceServer.post(`/stop_server/${port}?_t=${Date.now()}`, { 'dummy_data': 0 });
        message.success('Server schedule stopped successfully!');
      } else if (action === 'start') {
        // Replace with your actual start server API endpoint
        await axiosInstanceServer.post(`/start_server/${port}?_t=${Date.now()}`, { 'dummy_data': 0 });
        message.success('Server started successfully!');
      }

      // Fetch updated server states after the action is performed
      fetchServerStates();
    } catch (error) {
      if (error.response) {
        let errorMessage = '';
        if (error.response.status == 401 || error.response.status == 403) {
          if (action === "stop") {
            errorMessage = 'You do not have permissions to stop a server.';
          } else if (action === "start") {
            errorMessage = 'You do not have permissions to start a server.';
          }
        } else {
          if (action === "stop") {
            errorMessage = `An error occurred while attempting to stop the server. [${error.response.status}] ${error.response.data}`;
          } else if (action === "start") {
            errorMessage = `An error occurred while attempting to start the server. [${error.response.status}] ${error.response.data}`;
          }
        }
        errorMessage = errorMessage.replace(/\n/g, '<br />'); // Replace line breaks with <br />
        message.error({ content: <span dangerouslySetInnerHTML={{ __html: errorMessage }} />, duration: 5 });
        console.error(error);
      } else {
        if (action === "stop") {
          message.error('Stopping the server failed for an unknown reason.');
        } else if (action === "start") {
          message.error('Starting the server failed for an unknown reason.');
        }
        console.error(error);
      }
    }
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
          <Button onClick={collapseAll} style={{ marginRight: '8px' }}>Collapse all</Button>
          <Button
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleServerAction("all", "start");
            }}
            style={{ marginRight: '8px', backgroundColor: getButtonColor("Unknown") }}
          >Start all
          </Button>
          <Button
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleServerAction("all", "stop");
            }}
            style={{ marginRight: '8px', backgroundColor: getButtonColor("Occupied") }}
          >Schedule stop all
          </Button>
        </div>
        <div className="legend-container">
          <div className="legend-item">
            <div style={{ backgroundColor: getStatusColor('Queued', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Queued</span>
          </div>
          <div className="legend-item">
            <div style={{ backgroundColor: getStatusColor('Starting', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Starting</span>
          </div>
          <div className="legend-item">
            <div style={{ backgroundColor: getStatusColor('Ready', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Ready</span>
          </div>
          <div className="legend-item">
            <div style={{ backgroundColor: getStatusColor('Occupied', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Occupied</span>
          </div>
          <div className="legend-item">
            <div style={{ backgroundColor: getStatusColor('Occupied', 'Yes'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Scheduled Shutdown</span>
          </div>
          <div className="legend-item">
            <div style={{ backgroundColor: getStatusColor('Unknown', 'No'), width: '20px', height: '20px', marginRight: '10px' }}></div>
            <span>Unknown</span>
          </div>
        </div>
      </div>
      <Row gutter={[16, 16]}>
        {Object.entries(serverStates).map(([key, status]) => {
          const tagsData = {};
          const nonTagsData = {};

          Object.entries(status).forEach(([k, v]) => {
            if (tags.includes(k)) {
              tagsData[k] = v;
            } else {
              nonTagsData[k] = v;
            }
          });

          return (
            <Col key={key} xs={24} sm={16} md={12} lg={8} xl={6} className="server-card">
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
                      <div className="panel-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', overflowX: 'auto', marginBottom: '-10px' }}>
                          {Object.entries(tagsData).map(([k, v]) => (
                            <StatusDetail key={k} label={k} data={v} port={status.Port || status["Local Game Port"]} status={status} style={{ flex: '0 0 auto', paddingRight: '2px', fontSize: '10px' }} />

                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div>
                            <span style={{ paddingRight: '10px' }}>{key}</span>
                            <span style={{ paddingRight: '10px', fontSize: '12px', color: '#888888' }}>{getStatusText(status)}</span>
                          </div>
                          <Button
                            type="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleServerAction(status.Port || status["Local Game Port"], getButtonAction(status.Status));
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
                      {Object.entries(nonTagsData).map(([k, v]) => (
                        <StatusDetail key={k} label={k} data={v} port={status.Port || status["Local Game Port"]} />
                      ))}
                    </Card>
                  </Collapse.Panel>


                </Collapse>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

export default ServerStates;
