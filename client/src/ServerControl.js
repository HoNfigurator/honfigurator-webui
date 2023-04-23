import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Button, Table } from 'antd';
import { createAxiosInstanceServer } from './Security/axiosRequestFormat';

const ServerControl = () => {
  const [globalConfig, setGlobalConfig] = useState({});
  const [serverInstances, setServerInstances] = useState([]);
  const [newServer, setNewServer] = useState({ name: '', port: '' });

  // fetch global config data from API endpoint
  useEffect(() => {
    const fetchGlobalConfig = async () => {
      const response = await axios.get(`/api/get_global_config?_t=${Date.now()}`);
      setGlobalConfig(response.data);
    };
    fetchGlobalConfig();
  }, []);

  // fetch server instances data from API endpoint
  useEffect(() => {
    const fetchServerInstances = async () => {
      const response = await axios.get(`/api/get_instances_status?_t=${Date.now()}`);
      setServerInstances(response.data);
    };
    fetchServerInstances();
  }, []);

  // handle form submit for saving new config values
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    // use axios to post new config values to API endpoint
    // and update state if successful
    try {
      const response = await axios.post(`/api/save_config?_t=${Date.now()}`, globalConfig);
      setGlobalConfig(response.data);
      console.log('Config saved successfully!');
    } catch (error) {
      console.error(error);
    }
  };

  // handle form submit for adding new server instance
  const handleAddServer = async (e) => {
    e.preventDefault();
    // use axios to post new server instance data to API endpoint
    // and update state if successful
    try {
      // replace example data with actual form input values
      const newServer = { name: 'New Server', port: '12345' };
      const response = await axios.post('/api/add_server', newServer);
      setServerInstances([...serverInstances, response.data]);
      console.log('Server added successfully!');
    } catch (error) {
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
      title: 'Port',
      dataIndex: 'port',
      key: 'port',
    },
    // Add any other columns as needed
  ];

  return (
    <div>
      <h1>Global Config Settings</h1>
      <form onSubmit={handleSaveConfig}>
        <Form.Item label="HoN Data">
          <Input
            value={globalConfig.hon_data || ''}
            onChange={(e) =>
              setGlobalConfig({ ...globalConfig, hon_data: e.target.value })
            }
          />
        </Form.Item>
        {/* <Form.Item label="Config Key 2">
          <Input
            value={globalConfig.configKey2 || ''}
            onChange={(e) =>
              setGlobalConfig({ ...globalConfig, configKey2: e.target.value })
            }
          />
        </Form.Item> */}
        {/* Add more form inputs for other global config settings */}
        <Button type="primary" htmlType="submit">
          Save Config
        </Button>
      </form>
      <h1>Server Management</h1>
      <form onSubmit={handleAddServer}>
        <Form.Item label="Name">
          <Input
            value={newServer.name}
            onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
          />
        </Form.Item>
        <Form.Item label="Port">
          <Input
            value={newServer.port}
            onChange={(e) => setNewServer({ ...newServer, port: e.target.value })}
          />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Add Server
        </Button>
      </form>
      <Table
        dataSource={serverInstances}
        columns={columns}
        rowKey={(record) => record.name + record.port} // Use a unique key for each row
      />
    </div>
  );
};

export default ServerControl;