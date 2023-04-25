import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Button, Table, Collapse, message } from 'antd';
import './ServerControl.css';
import { SelectedServerValueContext } from './App';
import { useContext } from 'react';
import { createAxiosInstanceServer } from './Security/axiosRequestFormat';

const { Panel } = Collapse;

const ServerControl = () => {
  const [globalConfig, setGlobalConfig] = useState({ hon_data: {} });
  const [serverInstances, setServerInstances] = useState([]);
  const [newServer, setNewServer] = useState({ name: '', port: '' });
  const selectedServerValue = useContext(SelectedServerValueContext);

  // Add new state variables for total configured servers and total allowed servers
  const [totalConfiguredServers, setTotalConfiguredServers] = useState(0);
  const [totalAllowedServers, setTotalAllowedServers] = useState(0);

  const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue);

  // fetch global config data from API endpoint
  useEffect(() => {
    const fetchGlobalConfig = async () => {
      const response = await axiosInstanceServer.get(`/get_global_config?_t=${Date.now()}`);
      console.log(response);
      setGlobalConfig(response.data);
    };
    fetchGlobalConfig();
  }, []);

  const handleInputChange = (e, key) => {
    setGlobalConfig({
      ...globalConfig,
      hon_data: { ...globalConfig.hon_data, [key]: e.target.value },
    });
  };

  const honDataFormItems = Object.entries(globalConfig.hon_data).map(([key, value]) => (
    <Form.Item key={key} label={key}>
      <Input value={value || ''} onChange={(e) => handleInputChange(e, key)} />
    </Form.Item>
  ));


  // fetch server instances data from API endpoint
  // fetch server instances data from API endpoint
  const fetchServerInstances = async () => {
    const responseInstances = await axiosInstanceServer.get(`/get_instances_status?_t=${Date.now()}`);
    console.log('Raw Response Data:', responseInstances.data);
    const transformedData = Object.entries(responseInstances.data).map(([key, value]) => {
      return {
        name: key,
        ...value,
      };
    });
    console.log('Server Instances Data:', transformedData);
    setServerInstances(transformedData);

    const responseConfigured = await axiosInstanceServer.get(`/get_server_config_item/svr_total`);
    setTotalConfiguredServers(responseConfigured.data);
    const responseAllowed = await axiosInstanceServer.get(`/get_total_allowed_servers`);
    setTotalAllowedServers(responseAllowed.data.total_allowed_servers);
  };

  useEffect(() => {
    fetchServerInstances();
  }, []);

  // handle form submit for saving new config values
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    // use axios to post new config values to API endpoint
    // and update state if successful
    try {
      const response = await axiosInstanceServer.post(`/save_config?_t=${Date.now()}`, globalConfig);
      setGlobalConfig(response.data);
      console.log('Config saved successfully!');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddAllServers = async () => {
    try {
      const response = await axiosInstanceServer.post('/add_all_servers');
      if (response.status === 200) {
        message.success('All servers added successfully!');
        fetchServerInstances();
      }
    } catch (error) {
      message.error('Failed to add all servers.')
      console.error(error);
    }
  };

  const handleRemoveAllServers = async () => {
    try {
      const response = await axiosInstanceServer.post('/remove_all_servers');
      if (response.status === 200) {
        message.success('All servers removed successfully!');
        fetchServerInstances();
      }
    } catch (error) {
      message.error('Failed to remove all servers.')
      console.error(error);
    }
  };

  const handleAddServer = async () => {
    try {
      const response = await axiosInstanceServer.post('/add_servers/1');
      if (response.status === 200) {
        message.success('Server added successfully!');
        fetchServerInstances(); // Call fetchServerInstances again
      }
    } catch (error) {
      message.error('Failed to add a server.')
      console.error(error);
    }
  };

  const handleRemoveServer = async () => {
    try {
      const response = await axiosInstanceServer.post('/remove_servers/1');
      if (response.status === 200) {
        message.success('Server removed successfully!');
        fetchServerInstances(); // Call fetchServerInstances again
      }
    } catch (error) {
      message.error('Failed to remove a server.')
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'ID',
      dataIndex: 'ID',
      key: 'ID',
    },
    {
      title: 'Port',
      dataIndex: 'Port',
      key: 'Port',
    },
    // Add other columns as needed
  ];

  return (
    <div>
      <h1>Global Config Settings - HoN Data</h1>
      <Collapse>
        <Panel header="HoN Data Configuration" key="1">
          <form onSubmit={handleSaveConfig}>{honDataFormItems}</form>
          <Button type="primary" htmlType="submit" onClick={handleSaveConfig}>
            Save Config
          </Button>
        </Panel>
      </Collapse>
      <h1>Server Management</h1>
      <Table
      dataSource={serverInstances}
      columns={columns}
      rowKey={(record) => (record ? record.name + record.Port : 'default')}
      rowClassName={(record) => (record['Marked for Deletion'] === 'Yes' ? 'highlighted-row' : '')}
        footer={() => (
          <>
            <div>
              Configured Servers: {totalConfiguredServers} / {totalAllowedServers}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Button
                type="primary"
                onClick={() => {
                  handleAddServer();
                }}
                disabled={totalConfiguredServers >= totalAllowedServers}
                style={{ marginRight: '10px' }}
              >
                Add a server
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  handleAddAllServers();
                }}
                disabled={totalConfiguredServers >= totalAllowedServers}
              >
                Add all servers
              </Button>
            </div>
            <div>
              <Button
                type="primary"
                onClick={() => {
                  handleRemoveServer();
                }}
                disabled={totalConfiguredServers <= 0}
                danger // Make button red
                style={{ marginRight: '10px' }}
              >
                Remove a server
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  handleRemoveAllServers();
                }}
                disabled={totalConfiguredServers <= 0}
                danger // Make button red
              >
                Remove all servers
              </Button>
            </div>
          </>
        )}
      />
    </div>
  );
};

export default ServerControl;