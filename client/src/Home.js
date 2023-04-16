import React, { useState, useEffect } from 'react';
import { Button, Statistic, Row, Col, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SkippedFramesGraphAll from './SkippedFramesGraphAll';

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

async function fetchStats() {
  try {
    const requests = [
      axios.get('/api/get_server_config_item?key=svr_ip'),
      axios.get('/api/get_total_allowed_servers'),
      axios.get('/api/get_total_servers'),
      axios.get('/api/get_total_cpus'),
      axios.get('/api/get_num_reserved_cpus'),
      axios.get('/api/get_server_config_item?key=svr_total_per_core'),
      axios.get('/api/get_cpu_usage'),
      axios.get('/api/get_memory_usage'),
      axios.get('/api/get_memory_total'),

      axios.get('/api/get_num_matches_ingame'),
      axios.get('/api/get_num_players_ingame'),
      axios.get('/api/get_skipped_frame_data?port=all')
    ];

    const [
      { data: serverIP},
      { data: serverTotalAllowed},
      { data: serversTotal },
      { data: cpusTotal },
      { data: cpusReserved },
      { data: totalPerCore },
      { data: cpuUsed },
      { data: memoryUsed },
      { data: memoryTotal },
      { data: numMatchesInGame},
      { data: numPlayersInGame},
      { data: skippedFramesData }
    ] = await Promise.all(requests);

    return {
      serverIP,
      serverTotalAllowed,
      serversTotal,
      cpusTotal,
      cpusReserved,
      totalPerCore,
      cpuUsed,
      memoryUsed,
      memoryTotal,

      numMatchesInGame,
      numPlayersInGame,
      skippedFramesData
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {};
  }
}

function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const { width } = useWindowDimensions();

  useEffect(() => {
    async function fetchInitialStats() {
      const initialStats = await fetchStats();
      setStats(initialStats);
    }

    fetchInitialStats();
    const intervalId = setInterval(async () => {
      const updatedStats = await fetchStats();
      setStats(updatedStats);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);
  
  const handleClick = () => {
    navigate('/configs');
  };

  return (
    <div>
      <h1>Server Statistics</h1>
      <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
        <Col xs={24} md={8}>
          <Statistic title="Public IP" value={stats.serverIP || 'Loading...'} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
        <Col xs={24} md={8}>
          <Statistic title="Servers Configured" value={`${stats.serversTotal || '-'} / ${stats.serverTotalAllowed || '-'}`} suffix={<span style={{ fontSize: '14px' }}>total</span>}/>
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Total Logical CPU Cores" value={stats.cpusTotal || '-'} suffix={ <span style={{ fontSize: '14px' }}>cores ({stats.cpusReserved} reserved for OS)</span>}/>
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Max Servers per Thread" value={stats.totalPerCore}/>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} md={8}>
          <Statistic title="Memory Usage" value=' ' />
          <Progress
            type="circle"
            percent={stats.memoryUsed && stats.memoryTotal ? (stats.memoryUsed / stats.memoryTotal) * 100 : 0}
            format={(percent) => {
              if (typeof stats.memoryUsed === 'number') {
                return `${stats.memoryUsed.toFixed(2)}GB / ${stats.memoryTotal || '-'}GB`;
              } else {
                return `${stats.memoryUsed || '-'} / ${stats.memoryTotal || '-'}GB`;
              }
            }}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            size={120}
            style={{ marginTop: '-30px' }}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="CPU Load" value=' ' />
          <Progress
            type="circle"
            percent={typeof stats.cpuUsed === 'number' ? stats.cpuUsed : 0}
            format={(percent) => `${Number(percent).toFixed(2)}%`}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            size={120}
            style={{ marginTop: '-30px' }}
          />
        </Col>
      </Row>
      <br />
      <h1>Match Statistics</h1>
      <Row gutter={[16, 16]} >
        <Col xs={24} md={8}>
          <Statistic title="Matches in Progress" value={stats.numMatchesInGame || '-'} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Players Online" value={stats.numPlayersInGame || '-'} />
        </Col>
      </Row>
      <br />
      <h1>Skipped Frames</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          {stats.skippedFramesData && <SkippedFramesGraphAll data={stats.skippedFramesData} serverNames={Object.keys(stats.skippedFramesData)} />}
        </Col>
      </Row>
    </div>
  );
  
}

export default Home;
