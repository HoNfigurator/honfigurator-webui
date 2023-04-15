import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import './App.css';
import Home from './Home';
import ServerStatus from './ServerStatus';
import RegisterForm from './Security/RegisterForm'
import LoginForm from './Security/LoginForm';

const { Header, Content, Sider } = Layout;

function App() {
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const headerHeight = 64; // Update this value to match your header height

  return (
    <Router>
      <Header style={{ fontSize: '3em', color: 'white' }}>HoNfigurator</Header>
      <Layout style={{ height: `calc(100vh - ${headerHeight}px)` }}>
        {token && (
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
              <Route path="/" element={<Home />} />
              <Route path="/status" element={<ServerStatus nestedObject="Performance (lag)" />} />
              <Route path="/control" element={<ServerStatus />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
  
}

export default App;
