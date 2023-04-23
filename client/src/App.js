// App.js

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Spin, Button, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import HoNfiguratorIcon from './images/HonFigurator_Icon.png';
import UsersandRoles from './Profile/UsersRoles';
import './App.css';
import Home from './Home';
import ServerStatus from './ServerStatus';
import ServerControl from './ServerControl';
import RegisterForm from './Security/RegisterForm';
import LoginForm from './Security/LoginForm';
import DiscordCallback from './Security/Discord';
import RequireAuth, { useAuthenticatedState } from './Security/RequireAuth';
import useInactivityLogout from './Security/userInactivityLogout';
import AddServerModal from './Forms/addServerModal';
import { ServerListProvider, useServerList } from './Components/serverListContext';
import { createAxiosInstanceServer } from './Security/axiosRequestFormat';
import { axiosInstanceUI } from './Security/axiosRequestFormat';
import EditServerModal from './Forms/editServerModal';

const { Header, Content, Sider } = Layout;
export const SelectedServerContext = createContext(null);
export const SelectedServerValueContext = createContext('');

function App() {
  return (
    <ServerListProvider>
      <Router>
        <AppContent />
      </Router>
    </ServerListProvider>
  );
}


function AppContent() {
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedServerValue, setSelectedServerValue] = useState('');

  const { serverOptions, serverStatusLoading, firstLoad, getServers } = useServerList();

  useEffect(() => {
    if (serverOptions.length > 0) {
      setSelectedServer(serverOptions[0].label);
      setSelectedServerValue(serverOptions[0].value);
    } else {
      setSelectedServer('');
      setSelectedServerValue('');
    }
  }, [serverOptions]);
  const [addServerModalVisible, setAddServerModalVisible] = useState(false);
  const [editServerModalVisible, setEditServerModalVisible] = useState(false);
  const [serverToEdit, setServerToEdit] = useState(null);


  const token = localStorage.getItem('sessionToken');
  const location = useLocation();
  const navigate = useNavigate();
  const { authenticated, setAuthenticated } = useAuthenticatedState(token, location);

  const [stateMessage, setStateMessage] = useState(null);


  const handleLogout = (navigate, message) => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('tokenExpiry');
    if (message) {
      setStateMessage(message);
    }
    setAuthenticated(false);
    navigate('/login');
  };

  useInactivityLogout(() => handleLogout(navigate, 'You have been logged out due to inactivity.'), 3600, authenticated, setStateMessage);

  const headerHeight = 64;

  const handleServerChange = (value) => {
    const selected = serverOptions.find((option) => option.value === value);
    if (selected) {
      setSelectedServer(selected.label);
      setSelectedServerValue(value);
    }
  };

  const getServerStatusIndicator = (status) => (
    <div
      style={{
        display: "inline-block",
        marginLeft: "5px",
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor:
          status === "OK" ? "green" : "red",
      }}
    />
  );

  function ServerNotConnected() {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          fontSize: "1.5em",
          fontWeight: "bold",
          color: "red",
        }}
      >
        Server is not connected
      </div>
    );
  }

  const selectedServerStatus = serverOptions.find(
    (option) => option.value === selectedServerValue
  )?.status;

  const statusIndicator = (
    <div
      style={{
        display: "inline-block",
        marginLeft: "5px",
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor:
          selectedServerStatus === "OK" ? "green" : "red",
      }}
    />
  );

  const handleEditServer = (server) => {
    setServerToEdit(server);
    setEditServerModalVisible(true);
  };

  const handleRemoveServer = async (server) => {
    console.log("Remove server:", server);
    const payload = {
      name: server.label
    }
    try {
      await axiosInstanceUI.delete('/user/delete_server', { data: payload });
      getServers(); // Refresh the server list after deletion
      message.success(`Server '${server.label}' deleted successfully.`);
    } catch (error) {
      console.error('Error deleting server:', error);
      message.error(`Error deleting server '${server.label}'.`);
    }
  };

  const serverListMenu = (
    <Menu
      style={{
        minWidth: '250px', // Increase the width of the dropdown list
      }}
    >
      {serverOptions.map((option) => (
        <Menu.Item key={option.value}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div onClick={() => handleServerChange(option.value)}>
              {getServerStatusIndicator(option.status)} {option.label}
            </div>
            <div>
              <Button
                size="small"
                type="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditServer(option);
                }}
                style={{
                  marginRight: '5px',
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveServer(option);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </Menu.Item>
      ))}
      <Menu.Item key="add_server" onClick={() => setAddServerModalVisible(true)}>
        Add Server
      </Menu.Item>
    </Menu>
  );

  const showAddServerButton = authenticated && serverOptions.length === 0;

  return (
    <>
      <SelectedServerContext.Provider value={{ selectedServer, setSelectedServer, selectedServerValue, setSelectedServerValue }}>
        <SelectedServerValueContext.Provider value={selectedServerValue}>
          <Header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#001529",
              color: "white",
              padding: "0 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={HoNfiguratorIcon}
                alt="HoNfigurator Logo"
                style={{ height: "50px", marginRight: "10px" }}
              />
              <h1 style={{ fontSize: "2.5em", margin: 0 }}>HoNfigurator</h1>
            </div>
            {authenticated && (
              <Dropdown overlay={serverListMenu} trigger={["click"]}>
                <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
                  {selectedServer
                    ? `Connected to: ${selectedServer}`
                    : "No connected servers."}
                  {statusIndicator} <DownOutlined />
                </a>
              </Dropdown>
            )}
          </Header>
          <Layout style={{ height: `calc(100vh - ${headerHeight}px)` }}>
            {authenticated && (
              <Sider
                width={200}
                className="site-layout-background"
                style={{ height: "100%" }}
              >
                <Menu
                  mode="inline"
                  defaultSelectedKeys={["1"]}
                  style={{ height: "100%", borderRight: 0, marginTop: "auto" }}
                >
                  <Menu.Item key="1">
                    <Link to="/">Home</Link>
                  </Menu.Item>
                  <Menu.Item key="2">
                    <Link to="/status">Server Status</Link>
                  </Menu.Item>
                  <Menu.Item key="3">
                    <Link to="/control">Server Control</Link>
                  </Menu.Item>
                  <Menu.Item key="4">
                    <Link to="/roles">Users & Roles</Link>
                  </Menu.Item>
                  <Menu.Item
                    key="5"
                    style={{ marginTop: "auto" }}
                    onClick={() => handleLogout(navigate, "You have manually logged out.")}
                  >
                    Logout
                  </Menu.Item>
                </Menu>
              </Sider>
            )}
            <Layout style={{ padding: "24px" }}>
              <Content>
                {serverStatusLoading && firstLoad && authenticated ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <Spin size="large" />
                  </div>
                ) : showAddServerButton ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <button
                      onClick={() => setAddServerModalVisible(true)}
                      style={{
                        padding: "10px 20px",
                        fontSize: "1.5em",
                        fontWeight: "bold",
                        borderRadius: "4px",
                        backgroundColor: "#1890ff",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Add Server to Manage
                    </button>
                  </div>
                ) : (
                  <Routes>
                    <Route
                      path="/"
                      element={
                        selectedServerStatus === "OK"
                          ? <RequireAuth sessionToken={token} component={Home} />
                          : <ServerNotConnected />
                      }
                    />
                    <Route
                      path="/status"
                      element={
                        selectedServerStatus === "OK"
                          ? <RequireAuth sessionToken={token} component={ServerStatus} nestedObject="Performance (lag)" />
                          : <ServerNotConnected />
                      }
                    />
                    <Route
                      path="/control"
                      element={
                        selectedServerStatus === "OK"
                          ? <RequireAuth sessionToken={token} component={ServerControl} />
                          : <ServerNotConnected />
                      }
                    />
                    <Route
                      path="/roles"
                      element={
                        selectedServerStatus === "OK"
                          ? <RequireAuth sessionToken={token} component={UsersandRoles} />
                          : <ServerNotConnected />
                      }
                    />
                    <Route
                      path="/login"
                      element={<LoginForm stateMessage={stateMessage} />}
                    />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route
                      path="/api-ui/user/auth/discord/callback"
                      element={<DiscordCallback />}
                    />
                  </Routes>
                )}
              </Content>
            </Layout>
          </Layout>
          <AddServerModal
            visible={addServerModalVisible}
            setVisible={setAddServerModalVisible}
            onServerAdded={(server) => {
              setSelectedServer(server.label);
              setSelectedServerValue(server.value);
              getServers();
            }}
          />
          <EditServerModal
            visible={editServerModalVisible}
            setVisible={setEditServerModalVisible}
            server={serverToEdit}
            onServerUpdated={(updatedServer) => {
              setEditServerModalVisible(false);
              getServers(); // Refresh the server list after updating
            }}
          />
        </SelectedServerValueContext.Provider>
      </SelectedServerContext.Provider>
    </>
  );
}

export default App;