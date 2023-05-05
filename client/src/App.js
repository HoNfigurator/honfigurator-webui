// App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Spin, Button, message, Tooltip } from 'antd';
import { DownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import HoNfiguratorIcon from './images/HonFigurator_Icon.png';
import UsersandRoles from './Components/UsersRoles';
import './App.css';
import Home from './Home';
import ServerStatus from './Components/ServerStatus';
import ServerControl from './Components/ServerControl';
import RegisterForm from './Security/RegisterForm';
import LoginForm from './Security/LoginForm';
import DiscordCallback from './Security/Discord';
import RequireAuth, { useAuthenticatedState } from './Security/RequireAuth';
import useInactivityLogout from './Security/userInactivityLogout';
import AddServerModal from './Forms/addServerModal';
import { ServerListProvider, useServerList } from './Components/serverListContext';
import { axiosInstanceUI, createAxiosInstanceServer } from './Security/axiosRequestFormat';
import EditServerModal from './Forms/editServerModal';
import { handleEditServer, handleRemoveServer, ServerNotConnected, getServerStatusIndicator } from './Components/serverMenuManagement';
import handleLogout from './Security/logout';
import LogViewer from './Components/ServerTroubleshooting';

const { Header, Content, Sider } = Layout;

export const SelectedServerContext = createContext(null);

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
  const [selectedServer, setSelectedServer] = useState("");
  const [selectedServerValue, setSelectedServerValue] = useState("");
  const [selectedServerPort, setSelectedServerPort] = useState("");

  const [userSelected, setUserSelected] = useState(false);
  const [loadingServerData, setLoadingServerData] = useState(false);


  const [userInfo, setUserInfo] = useState(null);
  const [userRolePermissions, setUserRolePermissions] = useState(null);

  const { serverOptions, serverStatusLoading, firstLoad, getServers } = useServerList();
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);

  const selectedServerStatus = serverOptions.find(
    (option) => option.value === selectedServerValue
  )?.status;

  useEffect(() => {
    if (serverOptions.length > 0) {
      const lastSelectedServer = localStorage.getItem("lastSelectedServer");
      const previousSelectedServer = serverOptions.find(
        (option) => option.value === lastSelectedServer
      );

      if (previousSelectedServer) {
        setSelectedServer(previousSelectedServer.label);
        setSelectedServerValue(previousSelectedServer.value);
        setSelectedServerPort(previousSelectedServer.port);
      } else {
        setSelectedServer(serverOptions[0].label);
        setSelectedServerValue(serverOptions[0].value);
        setSelectedServerPort(serverOptions[0].port);
      }
    } else {
      setSelectedServer("");
      setSelectedServerValue("");
      setSelectedServerPort("");
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

  const fetchUserInfoDiscord = async () => {
    try {
      const discordUserResponse = await axiosInstanceUI.get('/user/info');
      setUserInfo(discordUserResponse.data);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  }

  const fetchUserInfoServer = async () => {
    try {
      const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue);
      // Fetch user's role and permissions
      const rolePermissionsResponse = await axiosInstanceServer.get('/user');
      const roles = rolePermissionsResponse.data.roles;
      const perms = rolePermissionsResponse.data.perms;
      setUserRolePermissions({ roles, perms });
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      const roles = ["Not available"];
      const perms = ["Not available"];
      setUserRolePermissions({ roles, perms });
    } finally {
      setLoadingServerData(false); // Set loadingServerData to false
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchUserInfoDiscord();
      if (!userSelected && serverOptions.length > 0) {
        setSelectedServer(serverOptions[0].label);
        setSelectedServerValue(serverOptions[0].value);
      }
      if (selectedServerValue && selectedServerStatus === "OK") {
        // setLoadingServerData(true);
        fetchUserInfoServer();
      } else {
        setLoadingServerData(false);
      }
    }
  }, [authenticated, userSelected, selectedServerValue, selectedServerStatus]);


  const handleServerChange = (value) => {
    const selected = serverOptions.find((option) => option.value === value);
    if (selected) {
      setLoadingServerData(true);
      setSelectedServer(selected.label);
      setSelectedServerValue(value);
      setSelectedServerPort(selected.port); // Add this line
      setUserSelected(true);
      localStorage.setItem('lastSelectedServer', value);
    }
  };

  const serverListMenu = (
    <Menu
      style={{
        minWidth: '300px', // Increase the width of the dropdown list
      }}
    >
      {serverOptions.map((option, index) => (
        <Menu.Item
          key={index}
          onClick={() => handleServerChange(option.value)} // Move the onClick event here
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <span style={{ marginRight: "8px" }}>
                {getServerStatusIndicator(option.status)}
              </span>
              <strong>{option.label}</strong> {/* Make server name bold */}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <small style={{ color: "gray", marginRight: "10px" }}>{option.value}</small> {/* Show server address preview */}
              <Button
                size="small"
                type="primary"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click event from bubbling up to the Menu.Item
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
                  e.stopPropagation(); // Prevent click event from bubbling up to the Menu.Item
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
      <SelectedServerContext.Provider
        value={{
          selectedServer,
          setSelectedServer,
          selectedServerValue,
          setSelectedServerValue,
          selectedServerPort,
          setSelectedServerPort,
        }}
      >
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
            <h1 style={{ fontSize: "2.5em", margin: 0 }}>
              HoNfigurator<span style={{ fontSize: "0.5em", color: "red", verticalAlign: "top" }}> beta</span>
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {userInfo && (
              <div style={{
                color: "white",
                marginRight: "16px",
                fontSize: "1.2em",
                fontWeight: "500",
                fontStyle: "italic",
                letterSpacing: "0.5px"
              }}>
                {userInfo.discordName}
              </div>
            )}
            {userRolePermissions && (
              <Tooltip
                title={
                  <>
                    <div>Roles: {userRolePermissions.roles.join(', ')}</div>
                    <div>Permissions: {userRolePermissions.perms.join(', ')}</div>
                  </>
                }
                placement="bottomRight"
              >
                <div style={{ marginRight: "16px", color: "white", cursor: "pointer" }}>
                  <InfoCircleOutlined />
                </div>
              </Tooltip>
            )}
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
          </div>
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
                <Menu.Item key="5">
                  <Link to="/troubleshooting">Troubleshooting</Link>
                </Menu.Item>
                <Menu.Item key="6" style={{ marginTop: "auto" }} onClick={() => handleLogout(navigate, "You have manually logged out.", setStateMessage, setAuthenticated)}>
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
              ) :
                loadingServerData ? (
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
                      path="/troubleshooting"
                      element={<RequireAuth sessionToken={token} component={selectedServerStatus === "OK" ? LogViewer : ServerNotConnected} />}
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
            getServers(server.value);
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
      </SelectedServerContext.Provider>
    </>
  );
}

export default App;