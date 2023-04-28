// Home.js
import React, { useState, useEffect, useContext } from 'react';
import { Statistic, Row, Col, Progress } from 'antd';
import SkippedFramesGraphAll from './Visualisations/SkippedFramesGraphAll';
import { createAxiosInstanceServer } from './Security/axiosRequestFormat';
import { SelectedServerContext } from './App';

async function fetchStats(selectedServer) {
  try {
    const axiosInstanceServer = createAxiosInstanceServer(selectedServer);
    
    const requests = [
      axiosInstanceServer.get(`/get_server_config_item/svr_ip?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_total_allowed_servers?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_total_servers?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_total_cpus?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_num_reserved_cpus?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_server_config_item/svr_total_per_core?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_cpu_usage?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_memory_usage?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_memory_total?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_num_matches_ingame?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_num_players_ingame?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_skipped_frame_data/all?_t=${Date.now()}`)
    ];

    const responses = await Promise.allSettled(requests);
    const data = responses.map((response) => response.status === 'fulfilled' ? response.value.data : {});

    return {
      serverIP: data[0],
      serverTotalAllowed: data[1].total_allowed_servers || null,
      serversTotal: data[2].total_servers || null,
      cpusTotal: data[3].total_cpus || null,
      cpusReserved: data[4].num_reserved_cpus || null,
      totalPerCore: data[5] || null,
      cpuUsed: data[6].cpu_usage || null,
      memoryUsed: data[7].memory_usage || null,
      memoryTotal: data[8].memory_total || null,
      numMatchesInGame: data[9].num_matches_ingame || null,
      numPlayersInGame: data[10].num_players_ingame || null,
      skippedFramesData: data[11],
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {};
  }
}

function Home() {
  const { selectedServerValue } = useContext(SelectedServerContext);
  const [stats, setStats] = useState({});

  useEffect(() => {
    async function fetchInitialStats() {
      const initialStats = await fetchStats(selectedServerValue);
      setStats(initialStats);
    }
  
    fetchInitialStats();
    const intervalId = setInterval(async () => {
      const updatedStats = await fetchStats(selectedServerValue);
      setStats(updatedStats);
    }, 5000);
  
    // Add a cleanup function to clear the interval when the component is unmounted or the server is changed
    return () => clearInterval(intervalId);
  }, [selectedServerValue]);

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
          <Statistic title="Matches in Progress" value={stats.numMatchesInGame || '0'} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Players Online" value={stats.numPlayersInGame || '0'} />
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
