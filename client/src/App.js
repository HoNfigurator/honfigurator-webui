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

import EditServerModal from './Forms/editServerModal';
import { handleEditServer, handleRemoveServer, ServerNotConnected, getServerStatusIndicator } from './Components/serverMenuManagement';
import handleLogout from './Utils/logout';

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
  const [userSelected, setUserSelected] = useState(false); // Add this line

  const { serverOptions, serverStatusLoading, firstLoad, getServers } = useServerList();
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);

  useEffect(() => {
    if (serverOptions.length > 0) {
      const previousSelectedServer = serverOptions.find((option) => option.value === selectedServerValue);

      if (previousSelectedServer) {
        setSelectedServer(previousSelectedServer.label);
        setSelectedServerValue(previousSelectedServer.value);
      } else {
        setSelectedServer(serverOptions[0].label);
        setSelectedServerValue(serverOptions[0].value);
      }
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

  useInactivityLogout(() => handleLogout(navigate, 'You have been logged out due to inactivity.', setStateMessage, setAuthenticated), 3600, authenticated, setStateMessage);

  const headerHeight = 64;

  useEffect(() => {
    if (authenticated) {
      getServers()
        .then(() => {
          if (!userSelected && serverOptions.length > 0) {
            setSelectedServer(serverOptions[0].label);
            setSelectedServerValue(serverOptions[0].value);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [authenticated, userSelected]);

  const handleServerChange = (value) => {
    // console.log("IVE BEEN CLICKED")
    const selected = serverOptions.find((option) => option.value === value);
    if (selected) {
      setSelectedServer(selected.label);
      setSelectedServerValue(value);
      setUserSelected(true); // Add this line
    }
  };

  const selectedServerStatus = serverOptions.find(
    (option) => option.value === selectedServerValue
  )?.status;

  const serverListMenu = (
    <Menu
      style={{
        minWidth: '300px', // Increase the width of the dropdown list
      }}
    >
      {serverOptions.map((option, index) => (
        <Menu.Item key={index}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div onClick={() => handleServerChange(option.value)} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              {getServerStatusIndicator(option.status)} <strong>{option.label}</strong> {/* Make server name bold */}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <small style={{ color: "gray", marginRight: "10px" }}>{option.value}</small> {/* Show server address preview */}
              <Button
                size="small"
                type="primary"
                onClick={(e) => {
                  handleEditServer(e, option, setServerToEdit, setEditServerModalVisible);
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
                  handleRemoveServer(e, option, getServers);
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
              <Dropdown
                overlay={serverListMenu}
                trigger={["click"]}
                // Add this line
                onVisibleChange={(visible) => setIsDropdownMenuOpen(visible)}
              >
                <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
                  {selectedServer
                    ? `Connected to: ${selectedServer}`
                    : "No connected servers."}
                  {getServerStatusIndicator(selectedServerStatus)} <DownOutlined />
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
                  <Menu.Item key="5" style={{ marginTop: "auto" }} onClick={() => handleLogout(navigate, "You have manually logged out.", setStateMessage, setAuthenticated)}>
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
                      element={<RequireAuth sessionToken={token} component={selectedServerStatus === "OK" ? Home : ServerNotConnected} />}
                    />
                    <Route
                      path="/status"
                      element={<RequireAuth sessionToken={token} component={selectedServerStatus === "OK" ? ServerStatus : ServerNotConnected} nestedObject="Performance (lag)" />}
                    />
                    <Route
                      path="/control"
                      element={<RequireAuth sessionToken={token} component={selectedServerStatus === "OK" ? ServerControl : ServerNotConnected} />}
                    />
                    <Route
                      path="/roles"
                      element={<RequireAuth sessionToken={token} component={selectedServerStatus === "OK" ? UsersandRoles : ServerNotConnected} />}
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