import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import './App.css';
import Home from './Home';
import ServerStatus from './ServerStatus';
import RegisterForm from './Security/RegisterForm';
import LoginForm from './Security/LoginForm';
import DiscordCallback from './Security/Discord';
import RequireAuth, { useAuthenticatedState } from './Security/RequireAuth';

const { Header, Content, Sider } = Layout;

function AppContent() {
  const token = localStorage.getItem('sessionToken');
  const location = useLocation();
  const authenticated = useAuthenticatedState(token, location);

  const handleLogout = () => {
    localStorage.removeItem('sessionToken');
    window.location.href = '/';
  };

  const headerHeight = 64; // Update this value to match your header height

  return (
    <>
      <Header style={{ fontSize: '3em', color: 'white' }}>HoNfigurator</Header>
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
                <Link to="/control">Server Control</Link>
              </Menu.Item>
              <Menu.Item key="4" style={{ marginTop: 'auto' }} onClick={handleLogout}>
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
              <Route path="/control" element={<RequireAuth sessionToken={token} component={ServerStatus} />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/api-ui/user/auth/discord/callback" element={<DiscordCallback />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
