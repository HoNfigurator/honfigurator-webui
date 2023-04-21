import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import HoNfiguratorIcon from './images/HonFigurator_Icon.png';
import './App.css';
import Home from './Home';
import ServerStatus from './ServerStatus';
import UsersandRoles, { UserTable } from './Profile/UsersRoles';
import RegisterForm from './Security/RegisterForm';
import LoginForm from './Security/LoginForm';
import DiscordCallback from './Security/Discord';
import RequireAuth, { useAuthenticatedState } from './Security/RequireAuth';
import useInactivityLogout from './Security/userInactivityLogout';

const { Header, Content, Sider } = Layout;
export const SelectedServerContext = createContext(null);

function App() {
  const [selectedServer, setSelectedServer] = useState('Server 1');
  const [selectedServerValue, setSelectedServerValue] = useState('localhost');

  function AppContent() {
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

    const serverOptions = [
      {
        label: 'Server 1',
        value: 'localhost',
      },
      {
        label: 'Server 2',
        value: 'server2',
      },
      {
        label: 'Server 3',
        value: 'server3',
      },
    ];

    const handleServerChange = (serverValue) => {
      const selected = serverOptions.find(option => option.value === serverValue);
      if (selected) {
        setSelectedServer(selected.label);
        setSelectedServerValue(selected.value);
      }
    };

    const menu = (
      <Menu>
        {serverOptions.map((option) => (
          <Menu.Item key={option.value} onClick={() => handleServerChange(option.value)}>
            {option.label}
          </Menu.Item>
        ))}
      </Menu>
    );

    return (
      <>
        <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#001529', color: 'white', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={HoNfiguratorIcon} alt="HoNfigurator Logo" style={{ height: '50px', marginRight: '10px' }} />
            <h1 style={{ fontSize: '2.5em', margin: 0 }}>HoNfigurator</h1>
          </div>
          {authenticated && (
            <Dropdown overlay={menu} trigger={['click']}>
                            <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
                Connected to: {selectedServer} <DownOutlined />
              </a>
            </Dropdown>
          )}
        </Header>
        <Layout style={{ height: `calc(100vh - ${headerHeight}px)` }}>
          {authenticated && (
            <Sider width={200} className="site-layout-background" style={{ height: '100%' }}>
              <Menu mode="inline" defaultSelectedKeys={['1']} style={{ height: '100%', borderRight: 0, marginTop: 'auto' }}>
                <Menu.Item key="1">
                  <Link to="/">Home</Link>
                </Menu.Item>
                <Menu.Item key="2">
                  <Link to="/status">Server Status</Link>
                </Menu.Item>
                <Menu.Item key="3">
                  <Link to="/roles">Users & Roles</Link>
                </Menu.Item>
                <Menu.Item key="4" style={{ marginTop: 'auto' }} onClick={() => handleLogout(navigate, 'You have manually logged out.')}>
                  Logout
                </Menu.Item>
              </Menu>
            </Sider>
          )}
          <Layout style={{ padding: '24px' }}>
            <Content>
              <Routes>
                <Route path="/" element={<RequireAuth sessionToken={token} component={Home} />} />
                <Route path="/status" element={<RequireAuth sessionToken={token} component={ServerStatus} nestedObject="Performance (lag)" />} />
                <Route path="/roles" element={<RequireAuth sessionToken={token} component={UsersandRoles} />} />
                <Route path="/login" element={<LoginForm stateMessage={stateMessage} />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/api-ui/user/auth/discord/callback" element={<DiscordCallback />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </>
    );
  }

  return (
    <Router>
      <SelectedServerContext.Provider value={{ selectedServer, setSelectedServer, selectedServerValue, setSelectedServerValue }}>
        <AppContent />
      </SelectedServerContext.Provider>
    </Router>
  );
}

export default App;
