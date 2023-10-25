// Home.js
import React, { useState, useEffect, useContext, } from 'react';
import { Statistic, Row, Col, Progress, Select, message, Modal } from 'antd';
import SkippedFramesGraphAll from './Visualisations/SkippedFramesGraphAll';
import { createAxiosInstanceServer } from './Security/axiosRequestFormat';
import { SelectedServerContext } from './App';
import useFilebeatOAuthCheck from './hooks/useFilebeatOAuthCheck';

async function fetchStats(selectedServerValue, selectedServerPort) {
  try {
    const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue, selectedServerPort);

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
      axiosInstanceServer.get(`/get_skipped_frame_data/all?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_cpu_name?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_current_github_branch?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_all_github_branches?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_all_public_ports?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_hon_version?_t=${Date.now()}`),
      axiosInstanceServer.get(`/get_commit_date?_t=${Date.now()}`)
    ];

    const responses = await Promise.allSettled(requests);
    const data = responses.map((response) => response.status === 'fulfilled' ? response.value.data : {});

    return {
      serverIP: data[0] || null,
      serverTotalAllowed: data[1].total_allowed_servers || null,
      serversTotal: data[2].total_servers || null,
      cpusTotal: data[3].total_cpus || null,
      cpusReserved: data[4] || null,
      totalPerCore: data[5] || null,
      cpuUsed: data[6].cpu_usage || null,
      memoryUsed: data[7].memory_usage || null,
      memoryTotal: data[8].memory_total || null,
      numMatchesInGame: data[9].num_matches_ingame || null,
      numPlayersInGame: data[10].num_players_ingame || null,
      skippedFramesData: data[11] || null,
      cpuName: data[12].cpu_name || null,
      githubBranch: data[13].branch || null,
      githubAllBranches: data[14].all_branches || null,
      publicPorts: {
        autoping: data[15].autoping_listener || null,
        game: data[15].public_game_ports || [],
        voice: data[15].public_voice_ports || [],
      },
      honVersion: data[16].data || data[16] || null,
      commitDate: data[17].data || null

    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {};
  }
}

const GithubBranchSelect = React.memo(({ githubBranch, githubAllBranches, onBranchChange }) => (
  <Select
    style={{ marginTop: '-30px', width: 200 }}
    placeholder="Change Branch"
    onChange={onBranchChange}
    value={githubBranch || undefined} // Set the selected value of the dropdown
    loading={!githubAllBranches}
  >
    {githubAllBranches &&
      githubAllBranches.map((branch) => (
        <Select.Option key={branch} value={branch}>
          {branch}
        </Select.Option>
      ))}
  </Select>
));


function Home() {
  const { selectedServerValue, selectedServerPort } = useContext(SelectedServerContext);
  // Separate state variables for each piece of data
  const [serverIP, setServerIP] = useState(null);
  const [serverTotalAllowed, setServerTotalAllowed] = useState(null);
  const [serversTotal, setServersTotal] = useState(null);
  const [cpusTotal, setCpusTotal] = useState(null);
  const [cpusReserved, setCpusReserved] = useState(null);
  const [totalPerCore, setTotalPerCore] = useState(null);
  const [cpuUsed, setCpuUsed] = useState(null);
  const [memoryUsed, setMemoryUsed] = useState(null);
  const [memoryTotal, setMemoryTotal] = useState(null);
  const [numMatchesInGame, setNumMatchesInGame] = useState(null);
  const [numPlayersInGame, setNumPlayersInGame] = useState(null);
  const [skippedFramesData, setSkippedFramesData] = useState(null);
  const [cpuName, setCpuName] = useState(null);
  const [githubBranch, setGithubBranch] = useState(null);
  const [githubAllBranches, setGithubAllBranches] = useState(null);
  const [publicPorts, setPublicPorts] = useState({
    autoping: null,
    game: [],
    voice: [],
  });
  const [honVersion, setHonVersion] = useState(null);
  const [commitDate, setCommitDate] = useState(null);

  const handleBranchChange = async (branch) => {
    if (selectedServerValue && selectedServerPort) {
      Modal.confirm({
        title: 'Switch GitHub Branch',
        content: `This will cause HoNfigurator on your server to restart using the selected GitHub branch: ${branch}. Only do this if you know what you are doing.`,
        onOk: async () => {
          try {
            const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue, selectedServerPort);
            await axiosInstanceServer.post(`/switch_github_branch/${branch}?_t=${Date.now()}`, { 'dummy_data': 0 });
            // Update the current branch in the state
            setStats({ ...stats, githubBranch: branch });
          } catch (error) {
            console.error('Error switching branch:', error);
            if (error.response.data) {
              message.error(error.response.data);
            } else {
              message.error("Error switching branch for an unknown reason");
            }
          }
        },
        onCancel() {

        },
      });
    }
  };

  const [initialValuesSet, setInitialValuesSet] = useState(false);

  useEffect(() => {
    if (!initialValuesSet && selectedServerValue && selectedServerPort) {
      setInitialValuesSet(true);
    }
    if (initialValuesSet) {
      async function updateStats() {
        if (selectedServerValue && selectedServerPort) {
          const data = await fetchStats(selectedServerValue, selectedServerPort);

          // Update individual state variables
          setServerIP(data.serverIP);
          setServerTotalAllowed(data.serverTotalAllowed);
          setServersTotal(data.serversTotal);
          setCpusTotal(data.cpusTotal);
          setCpusReserved(data.cpusReserved);
          setTotalPerCore(data.totalPerCore);
          setCpuUsed(data.cpuUsed);
          setMemoryUsed(data.memoryUsed);
          setMemoryTotal(data.memoryTotal);
          setNumMatchesInGame(data.numMatchesInGame);
          setNumPlayersInGame(data.numPlayersInGame);
          setSkippedFramesData(data.skippedFramesData);
          setCpuName(data.cpuName);
          setGithubBranch(data.githubBranch);
          setGithubAllBranches(data.githubAllBranches);
          setPublicPorts(data.publicPorts);
          setHonVersion(data.honVersion);
          setCommitDate(data.commitDate);
        }
      }
      // Fetch stats once on load
      updateStats();

      // Set up the interval to fetch stats every 30 seconds
      const intervalId = setInterval(updateStats, 30000);

      // Add a cleanup function to clear the interval when the component is unmounted or the server is changed
      return () => clearInterval(intervalId);
    }

  }, [selectedServerValue, selectedServerPort, initialValuesSet]);


  const filebeatOAuthUrl = useFilebeatOAuthCheck();

  useEffect(() => {
    if (filebeatOAuthUrl) {
      message.info({
        content: (
          <div>
            Authorize match log submission<br />
            <a
              href={filebeatOAuthUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => message.destroy("filebeatOAuthUrl")}
            >
              Authorize here
            </a>
          </div>
        ),
        key: "filebeatOAuthUrl",
        duration: 0, // This makes the notification stay until the user manually closes it
      });
    }
  }, [filebeatOAuthUrl]);

  useEffect(() => {
    if (filebeatOAuthUrl === undefined) {
      // Destroy the message if it exists
      message.destroy("filebeatOAuthUrl");
    }
  }, [filebeatOAuthUrl]);

  return (
    <div>
      <h1>Server Statistics</h1>
      <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
        <Col xs={24} md={8}>
          <Statistic title="Public IP" value={serverIP ? serverIP.toString() : 'Loading...'} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="CPU" value={cpuName ? cpuName.toString() : 'Loading...'} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Github Branch" value=' ' />
          <GithubBranchSelect
            githubBranch={githubBranch}
            githubAllBranches={githubAllBranches}
            onBranchChange={handleBranchChange}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
        <Col xs={24} md={8}>
          <Statistic title="Servers Configured" value={`${serversTotal || '0'} / ${serverTotalAllowed ? serverTotalAllowed.toString() : '-'}`} suffix={<span style={{ fontSize: '14px' }}>total ({totalPerCore ? totalPerCore.toString() : '-'} per Thread)</span>} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Total Logical CPU Cores" value={cpusTotal ? cpusTotal.toString() : '-'} suffix={<span style={{ fontSize: '14px' }}>cores ({cpusReserved ? cpusReserved.toString() : '-'} threads reserved for OS)</span>} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Last Update" value={commitDate || '-'} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} md={8}>
          <Statistic title="Memory Usage" value=' ' />
          <Progress
            type="circle"
            percent={memoryUsed && memoryTotal ? (memoryUsed / memoryTotal) * 100 : 0}
            format={(percent) => {
              if (typeof memoryUsed === 'number') {
                return `${memoryUsed.toFixed(2)}GB / ${memoryTotal || '-'}GB`;
              } else {
                return `${memoryUsed || '-'} / ${memoryTotal || '-'}GB`;
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
            percent={typeof cpuUsed === 'number' ? cpuUsed : 0}
            format={(percent) => `${Number(percent).toFixed(2)}%`}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            size={120}
            style={{ marginTop: '-30px' }}
          />
        </Col>
        <Col xs={24} md={8}>
          <Row>
            <Statistic
              title="Autoping Port"
              value={
                publicPorts?.autoping
                  ? publicPorts.autoping.toString() + ' UDP'
                  : 'Loading...'
              }
            />
          </Row>
          <Row>
            <Statistic
              title="Public Game Ports"
              value={
                publicPorts?.game?.length && publicPorts?.voice?.length
                  ? `${Math.min(...publicPorts.game)}-${Math.max(...publicPorts.game)}` + ' UDP'
                  : 'Loading...'
              }
            />
          </Row>
          <Row>
            <Statistic
              title="Public Voice Ports"
              value={
                publicPorts?.game?.length && publicPorts?.voice?.length
                  ? `${Math.min(...publicPorts.voice)}-${Math.max(...publicPorts.voice)}` + ' UDP'
                  : 'Loading...'
              }
            />
          </Row>
        </Col>
      </Row>
      <br />
      <h1>Match Statistics</h1>
      <Row gutter={[16, 16]} >
        <Col xs={24} md={8}>
          <Statistic title="Matches in Progress" value={numMatchesInGame || '0'} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Players Online" value={numPlayersInGame || '0'} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="HoN Server Version" value={honVersion || 'N/A'} />
        </Col>
      </Row>
      <br />
      <h1>Skipped Frames</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          {skippedFramesData && <SkippedFramesGraphAll data={skippedFramesData} serverNames={Object.keys(skippedFramesData)} />}
        </Col>
      </Row>
    </div>
  );

}

export default Home;
