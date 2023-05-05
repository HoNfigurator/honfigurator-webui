import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Collapse, message, Select, Checkbox, InputNumber, Tooltip } from 'antd';
import './ServerControl.css';
import { SelectedServerContext } from '../App';
import { useContext } from 'react';
import { createAxiosInstanceServer } from '../Security/axiosRequestFormat';

const { Panel } = Collapse;

const settingsLabels = {
  hon_install_directory: "HoN Install Directory",
  hon_home_directory: "HoN Home Directory",
  svr_masterServer: "Master Server",
  svr_login: "Login",
  svr_password: "Password",
  svr_name: "Server Name",
  svr_location: "Server Location",
  // svr_total: "Server Total",
  svr_priority: "Server Priority",
  svr_total_per_core: "Total Servers per Core",
  svr_enableProxy: "Enable Proxy",
  svr_max_start_at_once: "Max Servers Start at Once",
  svr_starting_gamePort: "Starting Game Port",
  svr_starting_voicePort: "Starting Voice Port",
};

const settingsTooltips = {
  hon_install_directory: "Path to your Heroes of Newerth installation directory",
  hon_home_directory: "Path to your Heroes of Newerth replays and game logs directory",
  svr_masterServer: "Select the master server to connect to",
  svr_login: "Enter your HoN username. This MUST be unique per server. Used to authenticate to game services.",
  svr_password: "Enter HoN password password. Used to authenticate to game services.",
  svr_name: "Enter the name of your server. This is how it appears ingame.",
  svr_location: "Select the server location (which region is the server in?)",
  // svr_total: "The total number of servers you wish to operate.",
  svr_priority: "Select the server priority",
  svr_total_per_core: "Select the total number of servers per core",
  svr_enableProxy: "Enable or disable the proxy",
  svr_max_start_at_once: "Maximum number of servers to start at once",
  svr_starting_gamePort: "Starting port number for game connections",
  svr_starting_voicePort: "Starting port number for voice connections",
};

const simpleSettingsKeys = [
  "hon_install_directory",
  "hon_home_directory",
  "svr_masterServer",
  "svr_login",
  "svr_password",
  "svr_name",
  "svr_location",
  // "svr_total"
];

const advancedSettingsKeys = [
  "svr_priority",
  "svr_total_per_core",
  "svr_enableProxy",
  "svr_max_start_at_once",
  "svr_starting_gamePort",
  "svr_starting_voicePort",
];

const ServerControl = () => {
  const [globalConfig, setGlobalConfig] = useState({ hon_data: {} });
  const [serverInstances, setServerInstances] = useState([]);
  const {selectedServerValue, selectedServerPort} = useContext(SelectedServerContext);

  // Add new state variables for total configured servers and total allowed servers
  const [totalConfiguredServers, setTotalConfiguredServers] = useState(0);
  const [totalAllowedServers, setTotalAllowedServers] = useState(0);

  const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue, selectedServerPort);

  // fetch global config data from API endpoint
  useEffect(() => {
    const fetchGlobalConfig = async () => {
      const response = await axiosInstanceServer.get(`/get_global_config?_t=${Date.now()}`);
      // console.log(response);
      setGlobalConfig(response.data);
    };
    fetchGlobalConfig();
  }, []);

  const handleInputChange = (e, key, inputKey) => {
    const value = e.target.value;

    if (inputKey === "svr_total") {
      const gamePort = parseInt(globalConfig.hon_data["svr_starting_gamePort"]) || 0;
      const voicePort = parseInt(globalConfig.hon_data["svr_starting_voicePort"]) || 0;
      const newValue = parseInt(value);

      if (Math.abs(gamePort - voicePort) < newValue) {
        message.error("The game port and voice port difference should be at least equal to the svr_total value.");
        return;
      }

      setGlobalConfig({
        ...globalConfig,
        hon_data: {
          ...globalConfig.hon_data,
          [key]: value,
        },
      });
    } else if (inputKey === "svr_starting_gamePort" || inputKey === "svr_starting_voicePort") {
      const otherKey = inputKey === "svr_starting_gamePort" ? "svr_starting_voicePort" : "svr_starting_gamePort";
      const otherValue = parseInt(globalConfig.hon_data[otherKey]) || 0;
      const svrTotal = parseInt(globalConfig.hon_data["svr_total"]) || 0;
      const newValue = parseInt(value);

      if (inputKey === "svr_starting_gamePort" && newValue < 10001) {
        message.error("svr_starting_gamePort should have a minimum value of 10001.");
        return;
      } else if (inputKey === "svr_starting_voicePort" && newValue < 10061) {
        message.error("svr_starting_voicePort should have a minimum value of 10061.");
        return;
      }

      if (Math.abs(newValue - otherValue) < svrTotal) {
        message.error("The game port and voice port difference should be at least equal to the svr_total value.");
        return;
      }

      setGlobalConfig({ ...globalConfig, hon_data: { ...globalConfig.hon_data, [key]: value } });
    } else {
      setGlobalConfig({ ...globalConfig, hon_data: { ...globalConfig.hon_data, [key]: value } });
    }
  };

  const honDataFormItems = Object.entries(globalConfig.hon_data)
    .filter(([key]) => simpleSettingsKeys.includes(key))
    .map(([key, value]) => {
      const label = settingsLabels[key] || key;
      const tooltipText = settingsTooltips[key];
      if (key === "svr_masterServer") {
        return (
          <Form.Item key={key} label={<Tooltip title={tooltipText}>{label}</Tooltip>}>
            <Select
              value={value || ""}
              onChange={(val) => handleInputChange({ target: { value: val } }, key)}
            >
              <Select.Option value="api.kongor.online">api.kongor.online</Select.Option>
            </Select>
          </Form.Item>
        );
      } else if (key === "svr_location") {
        return (
          <Form.Item key={key} label={<Tooltip title={tooltipText}>{label}</Tooltip>}>
            <Select
              value={value || ""}
              onChange={(val) => handleInputChange({ target: { value: val } }, key)}
            >
              {["AU", "BR", "EU", "RU", "SEA", "TH", "USE", "USW", "NEWERTH"].map((location) => (
                <Select.Option key={location} value={location}>
                  {location}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
      } else if (key === "svr_password") {
        return (
          <Form.Item key={key} label={<Tooltip title={tooltipText}>{label}</Tooltip>}>
            <Input.Password
              value={value || ""}
              onChange={(e) => handleInputChange(e, key)}
            />
          </Form.Item>
        );
      } else {
        return (
          <Form.Item key={key} label={<Tooltip title={tooltipText}>{label}</Tooltip>}>
            <Input value={value || ''} onChange={(e) => handleInputChange(e, key, key)} />
          </Form.Item>
        );
      }
    });


  const getMinMaxValues = (inputKey) => {
    const otherKey = inputKey === 'svr_starting_gamePort' ? 'svr_starting_voicePort' : 'svr_starting_gamePort';
    const otherValue = globalConfig.hon_data[otherKey];

    if (inputKey === 'svr_starting_gamePort') {
      return {
        min: Math.max(10001, parseInt(otherValue) - honDataFormItems.svrTotal),
        max: 15000,
      };
    } else {
      return {
        min: Math.max(10001, parseInt(otherValue) + honDataFormItems.svrTotal),
        max: 15000,
      };
    }    
  };
  const advancedSettingsItems = Object.entries(globalConfig.hon_data)
    .filter(([key]) => advancedSettingsKeys.includes(key))
    .map(([key, value]) => {
      const label = settingsLabels[key] || key;
      const tooltipText = settingsTooltips[key];
      switch (key) {
        case "svr_priority":
          return (
            <Form.Item key={key} label={<Tooltip title={tooltipText}>{label}</Tooltip>}>
              <Select
                value={value || ""}
                onChange={(val) => handleInputChange({ target: { value: val } }, key)}
              >
                {["HIGH", "REALTIME"].map((priority) => (
                  <Select.Option key={priority} value={priority}>
                    {priority}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          );
        case "svr_total_per_core":
          return (
            <Form.Item key={key} label={<Tooltip title={tooltipText}>{label}</Tooltip>}>
              <Select
                value={value || ""}
                onChange={(val) => handleInputChange({ target: { value: val } }, key)}
              >
                {["1", "2", "3"].map((perCore) => (
                  <Select.Option key={perCore} value={perCore}>
                    {perCore}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          );
        case "svr_enableProxy":
          return (
            <Form.Item key={key} label={<Tooltip title={tooltipText}>{label}</Tooltip>} valuePropName="checked">
              <Checkbox
                checked={value === "1"}
                onChange={(e) => handleInputChange({ target: { value: e.target.checked ? "1" : "0" } }, key)}
              />
            </Form.Item>
          );
        default:
          if (key === 'svr_starting_gamePort' || key === 'svr_starting_voicePort') {
            const { min, max } = getMinMaxValues(key);
            return (
              <Form.Item
                key={key}
                label={<Tooltip title={tooltipText}>{label}</Tooltip>}
              >
                <InputNumber
                  value={value || ''}
                  min={min}
                  max={max}
                  onChange={(val) => handleInputChange({ target: { value: val } }, key, key)}
                />
              </Form.Item>
            );
          } else {
            return (
              <Form.Item key={key} label={<Tooltip title={tooltipText}>{label}</Tooltip>}>
                <InputNumber
                  value={value || ''}
                  min={key.includes('Port') ? 10001 : 1}
                  max={key.includes('Port') ? 15000 : undefined}
                  onChange={(val) => handleInputChange({ target: { value: val } }, key)}
                />
              </Form.Item>
            );
          }
      }
    });

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // fetch server instances data from API endpoint
  const fetchServerInstances = async () => {
    const responseInstances = await axiosInstanceServer.get(`/get_instances_status?_t=${Date.now()}`);
    // console.log('Raw Response Data:', responseInstances.data);
    const transformedData = Object.entries(responseInstances.data).map(([key, value]) => {
      return {
        name: key,
        ...value,
      };
    });
    // console.log('Server Instances Data:', transformedData);
    setServerInstances(transformedData);

    // Calculate total configured servers from the response data
    setTotalConfiguredServers(transformedData.length);

    const responseAllowed = await axiosInstanceServer.get(`/get_total_allowed_servers`);
    setTotalAllowedServers(responseAllowed.data.total_allowed_servers);
  };

  useEffect(() => {
    fetchServerInstances();
  }, []);

  const updateHonData = async () => {
    try {
      const response = await axiosInstanceServer.post(`/set_hon_data?_t=${Date.now()}`, globalConfig.hon_data);
      if (response.status === 200) {
        message.success('HoN data updated successfully!');
      } else {
        message.error('Failed to update HoN data.');
      }
    } catch (error) {
      message.error('Failed to update HoN data.');
      console.error(error);
    }
  };

  function deepDictCompare(d1, d2) {
    const d1Keys = Object.keys(d1);
    const d2Keys = Object.keys(d2);

    if (d1Keys.length !== d2Keys.length) {
      return false;
    }

    for (let k of d1Keys) {
      if (!d2.hasOwnProperty(k)) {
        return false;
      }

      if (typeof d1[k] === 'object' && d1[k] !== null && typeof d2[k] === 'object' && d2[k] !== null) {
        if (!deepDictCompare(d1[k], d2[k])) {
          return false;
        }
      } else if (typeof d1[k] === 'number' && typeof d2[k] === 'number') {
        if (Math.abs(d1[k] - d2[k]) > Number.EPSILON) {
          return false;
        }
      } else if (Array.isArray(d1[k]) && Array.isArray(d2[k])) {
        if (JSON.stringify(d1[k].sort()) !== JSON.stringify(d2[k].sort())) {
          return false;
        }
      } else if (d1[k] !== d2[k]) {
        return false;
      }
    }

    return true;
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault();

    // Perform validation before saving the config
    const invalidPortKeys = ["svr_starting_gamePort", "svr_starting_voicePort"].filter((key) =>
      parseInt(globalConfig.hon_data[key]) < 10000
    );
    if (invalidPortKeys.length > 0) {
      message.error("One or more port values are invalid. Please ensure ports are 10000 or greater.");
      return;
    }
    try {
      const responseCurrent = await axiosInstanceServer.get(`/get_global_config?_t=${Date.now()}`);
      const dataMatch = deepDictCompare(responseCurrent.data.hon_data, globalConfig.hon_data);
      // if (!dataMatch) {
      //   message.error("The data on the server has changed. The page has been refreshed. Please make your changes again.");
      //   setGlobalConfig(responseCurrent.data); // Update the globalConfig state with the fetched data
      //   return;
      // }      
      updateHonData();
    } catch (error) {
      message.error(`Error saving config. [${error.response.status}] ${error.response.data}`)
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
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'Status',
    },
    // Add other columns as needed
  ];

  return (
    <div>
      <h1>Global Config Settings - HoN Data</h1>
      <Collapse>
        <Panel header="HoN Data Configuration" key="1">
          <form onSubmit={handleSaveConfig}>{honDataFormItems}</form>
          <Button
            type="primary"
            style={{ marginRight: '10px' }}
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            {showAdvancedSettings ? "Hide Advanced Settings" : "Show Advanced Settings"}
          </Button>
          {showAdvancedSettings && (
            <div>
              <h2>Advanced Settings</h2>
              <form>{advancedSettingsItems}</form>
            </div>
          )}
          <Button type="primary" htmlType="submit" onClick={handleSaveConfig}>
            Save Config
          </Button>
        </Panel>
      </Collapse>
      <h1>Server Management</h1>
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
          style={{ marginRight: '10px' }}
        >
          Add all servers
        </Button>
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
      <Table
        dataSource={serverInstances}
        columns={columns}
        rowKey={(record) => (record ? record.name + record.Port : 'default')}
        rowClassName={(record) =>
          record['Marked for Deletion'] === 'Yes' ? 'highlighted-row' : ''
        }
        footer={() => (
          <>
            <div>
              Configured Servers: {totalConfiguredServers} / {totalAllowedServers}
            </div>
          </>
        )}
      />
    </div>
  );

};

export default ServerControl;