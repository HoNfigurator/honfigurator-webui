import React, { useState, useEffect } from 'react';
import { Statistic, Row, Col, Progress } from 'antd';
import axios from 'axios';
import SkippedFramesGraphAll from './SkippedFramesGraphAll';
import { axiosInstanceServer } from './Security/axiosRequestFormat';

// function useWindowDimensions() {
//   const [windowDimensions, setWindowDimensions] = useState({
//     width: window.innerWidth,
//     height: window.innerHeight,
//   });

//   useEffect(() => {
//     function handleResize() {
//       setWindowDimensions({
//         width: window.innerWidth,
//         height: window.innerHeight,
//       });
//     }

//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   return windowDimensions;
// }

async function fetchStats() {
  try {
    const requests = [
      axiosInstanceServer.get('/get_server_config_item?key=svr_ip'),
      axiosInstanceServer.get('/get_total_allowed_servers'),
      axiosInstanceServer.get('/get_total_servers'),
      axiosInstanceServer.get('/get_total_cpus'),
      axiosInstanceServer.get('/get_num_reserved_cpus'),
      axiosInstanceServer.get('/get_server_config_item?key=svr_total_per_core'),
      axiosInstanceServer.get('/get_cpu_usage'),
      axiosInstanceServer.get('/get_memory_usage'),
      axiosInstanceServer.get('/get_memory_total'),

      axiosInstanceServer.get('/get_num_matches_ingame'),
      axiosInstanceServer.get('/get_num_players_ingame'),
      axiosInstanceServer.get('/get_skipped_frame_data?port=all')
    ];

    const [
      { data: serverIPResponse },
      { data: serverTotalAllowedResponse },
      { data: serversTotalResponse },
      { data: cpusTotalResponse },
      { data: cpusReservedResponse },
      { data: totalPerCoreResponse },
      { data: cpuUsedResponse },
      { data: memoryUsedResponse },
      { data: memoryTotalResponse },
      { data: numMatchesInGameResponse },
      { data: numPlayersInGameResponse },
      { data: skippedFramesDataResponse }
    ] = await Promise.all(requests);

    return {
      serverIP: serverIPResponse,
      serverTotalAllowed: serverTotalAllowedResponse.total_allowed_servers,
      serversTotal: serversTotalResponse.total_servers,
      cpusTotal: cpusTotalResponse.total_cpus,
      cpusReserved: cpusReservedResponse.num_reserved_cpus,
      totalPerCore: totalPerCoreResponse.svr_total_per_core,
      cpuUsed: cpuUsedResponse.cpu_usage,
      memoryUsed: memoryUsedResponse.memory_usage,
      memoryTotal: memoryTotalResponse.memory_total,
      numMatchesInGame: numMatchesInGameResponse.numMatchesInGameResponse,
      numPlayersInGame: numPlayersInGameResponse.num_players_ingame,
      skippedFramesData: skippedFramesDataResponse,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {};
  }
}

function Home() {
  const [stats, setStats] = useState({});
  // const { width } = useWindowDimensions();

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
