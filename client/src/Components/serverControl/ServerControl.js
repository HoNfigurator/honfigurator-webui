import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Collapse, message, Space, Select, Checkbox, InputNumber, Tooltip, Spin, Alert, TimePicker } from 'antd';
import './ServerControl.css';
import { SelectedServerContext } from '../../App';
import { useContext } from 'react';
import { createAxiosInstanceServer } from '../../Security/axiosRequestFormat';
import _ from 'lodash';
import { honData, applicationData } from './configDicts';
import moment from 'moment';

const { Panel } = Collapse;

const getDependantValue = (dependantKey, config) => {
  if (!dependantKey) {
    return true;
  }

  const keys = dependantKey.split('.');
  let value = config;

  for (const key of keys) {
    if (value.hasOwnProperty(key)) {
      value = value[key];
    } else {
      return false;
    }
  }

  return value === true; // ensure the value is true
};

const applicationDataMap = new Map(Object.entries(applicationData));
const honDataMap = new Map(Object.entries(honData));

const ServerControl = () => {
  const [globalConfig, setGlobalConfig] = useState({ hon_data: {} });
  const [serverInstances, setServerInstances] = useState([]);
  const { selectedServerValue, selectedServerPort } = useContext(SelectedServerContext);

  // Add new state variables for total configured servers and total allowed servers
  const [totalConfiguredServers, setTotalConfiguredServers] = useState(0);
  const [totalAllowedServers, setTotalAllowedServers] = useState(0);

  const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue, selectedServerPort);

  const [accessForbidden, setAccessForbidden] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // fetch global config data from API endpoint
  const fetchGlobalConfig = async () => {
    setIsLoading(true);
    try {
      const responseConfig = await axiosInstanceServer.get(`/get_global_config?_t=${Date.now()}`);
      setGlobalConfig(responseConfig.data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 403) {
        setAccessForbidden(true);
      } else {
        message.error('Failed to fetch global config.');
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessForbidden) {
      return;
    }
    fetchGlobalConfig();
  }, [accessForbidden]); // Run fetchGlobalConfig only once when the component mounts


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

  const createObjectPath = (dataType, key) => {
    switch (dataType) {
      case "application_data":
        return `application_data.${key}`;
      case "hon_data":
        return `hon_data.${key}`;
      default:
        return key;
    }
  };

  const handleInputChange = (e, key, inputKey, dataType, keyType) => {
    let value;

    // Check if the event is from a Checkbox
    if (e && e.target) {
      if (keyType === 'checkbox') {
        value = e.target.checked;
      } else {
        value = e.target.value;
      }
    } else if (moment.isMoment(e)) {
      value = e.format('HH:mm');
    } else {
      value = e;
    }

    const objectPath = createObjectPath(dataType, key);
    const newGlobalConfig = _.set({ ...globalConfig }, objectPath, value);

    if (dataType === 'hon_data') {
      // handle HoN data
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

        if (Math.abs(parseInt(value) - otherValue) < svrTotal) {
          message.error("The game port and voice port difference should be at least equal to the svr_total value.");
          return;
        }
      }
    }

    setGlobalConfig(newGlobalConfig);
  };

  const getHonDataFormItems = (data, parentKey = "", honDataMap, section, dataType) => {
    if (!data) {
      return null;
    }

    const items = [];

    for (let [key, keyData] of honDataMap.entries()) {
      // Check if the key exists in the data
      if (_.has(data, key)) {
        const value = _.get(data, key); // Get the value from data using lodash's _.get function

        if (typeof value === 'object' && value !== null && !(value instanceof Array)) {
          const childItems = getHonDataFormItems(value, key, honDataMap, section, dataType);
          items.push(...childItems);
        } else {
          const isDisabled = keyData.dependant_on && !getDependantValue(keyData.dependant_on, data);

          // Depending on the value type, use a different component
          switch (keyData.type) {
            case "checkbox":
              // Use a Checkbox
              if (keyData.section === section) {
                items.push(
                  <Form.Item key={key} label={<Tooltip title={keyData.tooltip}>{keyData.label}</Tooltip>} valuePropName="checked" className="custom-form-item">
                    <Checkbox
                      checked={value || false}
                      onChange={(e) => handleInputChange(e, key, key, dataType, keyData.type)}
                    />
                  </Form.Item>
                );
              }
              break;
            case "select":
              // Use a Select
              if (keyData.section === section && !isDisabled) {
                items.push(
                  <Form.Item key={key} label={<Tooltip title={keyData.tooltip}>{keyData.label}</Tooltip>} className="custom-form-item">
                    <Select
                      value={value || ""}
                      onChange={(val) => handleInputChange({ target: { value: val } }, key, key, dataType, keyData.type)}
                    >
                      {keyData.options.map((option) => (
                        <Select.Option key={option} value={option}>
                          {option}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }
              break;
            case "time":
              // Use a TimePicker
              if (keyData.section === section && !isDisabled) {
                const timeValue = value ? moment(value, 'HH:mm') : null;

                items.push(
                  <Form.Item key={key} label={<Tooltip title={keyData.tooltip}>{keyData.label}</Tooltip>} className="custom-form-item">
                    <Space>
                      <TimePicker
                        value={timeValue} // Update this line
                        format='HH:mm'
                        disabled={isDisabled}
                        onChange={(e) => handleInputChange(e, key, key, dataType, keyData.type)} // Add this line
                      />
                      <Button
                        type="primary"
                        onClick={() => handleInputChange(timeValue.format('HH:mm'), key, key, dataType, keyData.type)}
                      >
                        Set
                      </Button>
                    </Space>
                  </Form.Item>
                );
              }
              break;
            case "password":
              // Use a Password
              if (keyData.section === section && !isDisabled) {
                items.push(
                  <Form.Item key={key} label={<Tooltip title={keyData.tooltip}>{keyData.label}</Tooltip>} className="custom-form-item">
                    <Input.Password
                      value={value || ""}
                      onChange={(e) => handleInputChange(e, key, key, dataType, keyData.type)}
                    />
                  </Form.Item> // Closing tag should be here
                );
              }
              break;
            case "int":
              // Use a numeric Input
              if (keyData.section === section && !isDisabled) {
                const { min, max } = getMinMaxValues(key);
                items.push(
                  <Form.Item key={key} label={<Tooltip title={keyData.tooltip}>{keyData.label}</Tooltip>} className="custom-form-item">
                    <InputNumber
                      value={value || 0}
                      min={min}
                      max={max}
                      addonAfter={keyData.suffix || ''}
                      onChange={(val) => handleInputChange(val, key, key, dataType, keyData.type)}
                    />
                    {globalConfig.hon_data["man_enableProxy"] && (key === "svr_starting_gamePort" || key === "svr_starting_voicePort") ? (
                      <span style={{ marginLeft: 8, color: "rgba(0, 0, 0, 0.45)" }}>
                        {parseInt(value || 0) + 10000 + " public port. Since the proxy is enabled."}
                      </span>
                    ) : null}
                  </Form.Item>
                );
              }
              break;
            case "path":
              // Use a path input (if there's a component for this, or else just use an Input)
              if (keyData.section === section && !isDisabled) {
                items.push(
                  <Form.Item key={key} label={<Tooltip title={keyData.tooltip}>{keyData.label}</Tooltip>} className="custom-form-item">
                    <Input
                      value={value || ''}
                      onChange={(time) => handleInputChange(time, key, key, dataType, keyData.type)}
                      addonAfter={keyData.suffix || ''}
                    />
                  </Form.Item>
                );
              }
              break;
            default:
              // Use an Input for all other keys
              if (keyData.section === section && !isDisabled) {
                items.push(
                  <Form.Item key={key} label={<Tooltip title={keyData.tooltip}>{keyData.label}</Tooltip>} className="custom-form-item">
                    <Input
                      value={value || ''}
                      onChange={(time) => handleInputChange(time, key, key, dataType, keyData.type)}
                      addonAfter={keyData.suffix || ''}
                    />
                  </Form.Item>
                );
              }
              break;
          }
        }
      }
    }
    return items;
  };

  // Filter applicationData dictionary by section
  const filterBySection = (section, dataType) => {
    if (dataType === 'application_data') {
      return new Map([...applicationDataMap].filter(([, value]) => value.section === section));
    } else {
      return new Map([...honDataMap].filter(([, value]) => value.section === section));
    }
  };

  // Then generate form items for each section
  const honDataFormItems = getHonDataFormItems(globalConfig.hon_data, "", filterBySection("Basic Settings", "hon_data"), "Basic Settings", 'hon_data');
  const advancedSettingsItems = getHonDataFormItems(globalConfig.hon_data, "", filterBySection("Advanced Settings", "hon_data"), "Advanced Settings", 'hon_data');

  const healthChecksItems = getHonDataFormItems(globalConfig.application_data, "", filterBySection("Health Check Intervals", "application_data"), "Health Check Intervals", 'application_data');
  const scheduleTasksItems = getHonDataFormItems(globalConfig.application_data, "", filterBySection("Schedule Tasks", "application_data"), "Schedule Tasks", 'application_data');

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // fetch server instances data from API endpoint
  const fetchServerInstances = async () => {
    setIsLoading(true);
    try {
      const responseInstances = await axiosInstanceServer.get(`/get_instances_status?_t=${Date.now()}`);
      const transformedData = Object.entries(responseInstances.data).map(([key, value]) => {
        const port = value.hasOwnProperty('Port') ? value['Port'] : value['Public Game Port'];

        return {
          name: key,
          Port: port,
          ...value,
        };
      });
      setServerInstances(transformedData);
      setTotalConfiguredServers(transformedData.length);
      const responseAllowed = await axiosInstanceServer.get(`/get_total_allowed_servers?_t=${Date.now()}`);
      setTotalAllowedServers(responseAllowed.data.total_allowed_servers);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 403) {
        setAccessForbidden(true);
      } else {
        message.error('Failed to fetch server instances.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessForbidden) {
      return;
    }
    fetchServerInstances();

    // Run fetchServerInstances every 15 seconds
    const intervalId = setInterval(fetchServerInstances, 15000);

    // Cleanup the interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [accessForbidden]); // Run fetchServerInstances only once when the component mounts

  const updateHonData = async () => {
    try {
      const response = await axiosInstanceServer.post(`/set_hon_data?_t=${Date.now()}`, globalConfig.hon_data);
      if (response.status === 200) {
        message.success('HoN data updated successfully!');
      } else {
        message.error('Failed to update HoN data.');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status == 401 || error.response.status == 403) {
          message.error(`You do not have permissions to update the server configuration.`)
          console.error(error);
        } else {
          message.error(`Error saving config. [${error.response.status}] ${error.response.data.detail || error.response.data}`)
          console.error(error);
        }
      } else {
        message.error('Failed to save config for an unknown reason.')
        console.error(error);
      }
    }
  };

  const updateAppData = async () => {
    try {
      const response = await axiosInstanceServer.post(`/set_app_data?_t=${Date.now()}`, globalConfig.application_data);
      if (response.status === 200) {
        message.success('App data updated successfully!');
      } else {
        message.error('Failed to update App data.');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status == 401 || error.response.status == 403) {
          message.error(`You do not have permissions to update the server configuration.`)
          console.error(error);
        } else {
          message.error(`Error saving config. [${error.response.status}] ${error.response.data.detail || error.response.data}`)
          console.error(error);
        }
      } else {
        message.error('Failed to save config for an unknown reason.')
        console.error(error);
      }
    }
  };


  const handleSaveHonConfig = async (e) => {
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
      updateHonData();
    } catch (error) {
      message.error('Failed to load the server configuration for an unknown reason.')
      console.error(error);
    }
  };

  const handleSaveAppConfig = async (e) => {
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
      updateAppData();
    } catch (error) {
      message.error('Failed to load the server configuration for an unknown reason.')
      console.error(error);
    }
  };

  const handleAddAllServers = async () => {
    try {
      const response = await axiosInstanceServer.post(`/add_all_servers?_t=${Date.now()}`, { 'dummy_data': 0 });
      if (response.status === 200) {
        message.success('All servers added successfully!');
        fetchServerInstances();
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status == 401 || error.response.status == 403) {
          message.error('You do not have permission to add all servers.')
        } else {
          message.error(`Failed to add all servers. [${error.response.status}] ${error.response.data}`)
        }
      } else {
        message.error('Failed to add all servers for an unknown reason.')
        console.error(error);
      }
    }
  };

  const handleRemoveAllServers = async () => {
    try {
      const response = await axiosInstanceServer.post(`/remove_all_servers?_t=${Date.now()}`, { 'dummy_data': 0 });
      if (response.status === 200) {
        message.success('All servers removed successfully!');
        fetchServerInstances();
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status == 401 || error.response.status == 403) {
          message.error('You do not have permission to remove all servers.')
        } else {
          message.error(`Failed to remove all servers. [${error.response.status}] ${error.response.data}`)
        }
      } else {
        message.error('Failed to remove all servers for an unknown reason.')
        console.error(error);
      }
    }
  };

  const handleAddServer = async () => {
    try {
      const response = await axiosInstanceServer.post(`/add_servers/1?_t=${Date.now()}`, { 'dummy_data': 0 });
      if (response.status === 200) {
        message.success('Server added successfully!');
        fetchServerInstances(); // Call fetchServerInstances again
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status == 401 || error.response.status == 403) {
          message.error('You do not have permission to add a server.')
        } else {
          message.error(`Failed to add a server. [${error.response.status}] ${error.response.data}`)
        }
      } else {
        message.error('Failed to add a server for an unknown reason.')
        console.error(error);
      }
    }
  };

  const handleRemoveServer = async () => {
    try {
      const response = await axiosInstanceServer.post(`/remove_servers/1?_t=${Date.now()}`, { 'dummy_data': 0 });
      if (response.status === 200) {
        message.success('Server removed successfully!');
        fetchServerInstances(); // Call fetchServerInstances again
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status == 401 || error.response.status == 403) {
          message.error('You do not have permission to remove a server.')
        } else {
          message.error(`Failed to remove a server. [${error.response.status}] ${error.response.data}`)
        }
      } else {
        message.error('Failed to remove a server for an unknown reason.')
        console.error(error);
      }
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Public Game Port',
      dataIndex: 'Port',
      key: 'Port',
    },
    {
      title: 'Public Voice Port',
      dataIndex: 'Public Voice Port',
      key: 'Public Voice Port',
    },
    {
      title: 'Proxy',
      dataIndex: 'Proxy Enabled',
      key: 'Proxy Enabled',
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
      {accessForbidden ? (
        <Alert message="Access denied" type="error" showIcon />
      ) : (
        <>
          <div>
            <h1>Settings</h1>
            <Collapse>
              <Panel header="HoN Server" key="1">
                <form onSubmit={handleSaveHonConfig}>{honDataFormItems}</form>
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
                <Button type="primary" htmlType="submit" onClick={handleSaveHonConfig}>
                  Save Config
                </Button>
              </Panel>
              <Panel header="Health Checks" key="2">
                <form>
                  {healthChecksItems}
                </form>
                <Button type="primary" htmlType="submit" onClick={handleSaveAppConfig}>
                  Save Config
                </Button>
              </Panel>
              <Panel header="Scheduled Tasks" key="3">
                <form>
                  {scheduleTasksItems}
                </form>
                <Button type="primary" htmlType="submit" onClick={handleSaveAppConfig}>
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
            <Spin spinning={isLoading}>
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
            </Spin>
          </div>
        </>
      )}
    </div>
  );
};

export default ServerControl;