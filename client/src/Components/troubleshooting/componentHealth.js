import React, { useState, useEffect, useContext } from 'react';
import { message, Spin, Progress, Row, Col, Table } from 'antd';
import { SelectedServerContext } from '../../App';
import { createAxiosInstanceServer } from '../../Security/axiosRequestFormat';

const ComponentHealth = () => {
  const [tasksStatus, setTasksStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { selectedServerValue, selectedServerPort } = useContext(SelectedServerContext);

  const fetchTasksStatus = async () => {
    setIsLoading(true);
    const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue, selectedServerPort);
    try {
      const response = await axiosInstanceServer.get(`/get_tasks_status?${Date.now()}`);
      setTasksStatus(response.data.tasks_status);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch tasks status.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksStatus();
    const intervalId = setInterval(fetchTasksStatus, 20000); // Calls fetchTasksStatus every 20 seconds

    return () => {
      clearInterval(intervalId); // Clears the interval on component unmount
    };
  }, []);

  const renderTasks = (tasksObject, title) => {
    const tasksArray = Object.entries(tasksObject).map(([taskName, task]) => {
      return {
        task: taskName,
        ...task,
        status: task.exception ? 'Error' : task.status,  // Change status to 'Error' if an exception exists
      };
    });

    let totalTasks = tasksArray.length;
    let totalErrorTasks = tasksArray.filter(task => task.exception).length;
    const overallHealth = ((totalTasks - totalErrorTasks) / totalTasks) * 100;

    const columns = [
      {
        title: 'Task',
        dataIndex: 'task',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        filters: [
          { text: 'Running', value: 'Running' },
          { text: 'Done', value: 'Done' },
          { text: 'Error', value: 'Error' },  // Add 'Error' to the filter list
        ],
        onFilter: (value, record) => record.status.indexOf(value) === 0,
        render: (status) => {
          let color = 'default';
          if (status === 'Running') {
            color = 'green';
          } else if (status === 'Done') {
            color = 'blue';
          } else if (status === 'Error') {
            color = 'red';
          }
          return <span style={{ color }}>{status}</span>;
        },
      },
      {
        title: 'Error',
        dataIndex: 'exception',
      },
    ];

    return (
      <>
        <h2>{title}</h2>
        <Progress percent={overallHealth} status={overallHealth === 100 ? 'success' : 'exception'} />
        <Table dataSource={tasksArray} columns={columns} rowKey={record => record.task} />
      </>
    );
  };

  const renderGameServerTasks = () => {
    const gameTasks = tasksStatus['game_servers'];

    if (!gameTasks) {
      return null;
    }

    let totalTasks = 0;
    let totalErrorTasks = 0;

    const gameServersArray = Object.entries(gameTasks).map(([serverName, serverTasks]) => {
      const taskEntries = Object.entries(serverTasks);
      const errorTasks = taskEntries.filter(([taskName, task]) => task.exception);

      totalTasks += taskEntries.length;
      totalErrorTasks += errorTasks.length;

      return {
        server: serverName,
        status: errorTasks.length === 0 ? 'Healthy' : 'Error',
        errorTasks: errorTasks.length === 0 ? null : errorTasks,
        tasks: serverTasks,
      };
    });

    const overallHealth = ((totalTasks - totalErrorTasks) / totalTasks) * 100;

    const columns = [
      {
        title: 'Server',
        dataIndex: 'server',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render: (status) => {
          let color = 'default';
          if (status === 'Healthy') {
            color = 'green';
          } else if (status === 'Error') {
            color = 'red';
          }
          return <span style={{ color }}>{status}</span>;
        },
      }
    ];

    const expandedRowRender = (record) => {
      const tasksArray = Object.entries(record.tasks).map(([taskName, task]) => {
        return {
          task: taskName,
          ...task,
          status: task.exception ? 'Error' : task.status,  // Change status to 'Error' if an exception exists
        };
      });
    
      const columns = [
        {
          title: 'Task',
          dataIndex: 'task',
        },
        {
          title: 'Status',
          dataIndex: 'status',
          render: (status) => {
            let color = 'default';
            if (status === 'Running') {
              color = 'green';
            } else if (status === 'Done') {
              color = 'blue';
            } else if (status === 'Error') {
              color = 'red';
            }
            return <span style={{ color }}>{status}</span>;
          },
        },
        {
          title: 'Error',
          dataIndex: 'exception',
        },
      ];
    
      return <Table dataSource={tasksArray} columns={columns} rowKey={record => record.task} pagination={false} showHeader={false} />;
    };

    return (
      <>
        <h2>Game Server Tasks</h2>
        <Progress percent={overallHealth} status={overallHealth === 100 ? 'success' : 'exception'} />
        <Table
          dataSource={gameServersArray}
          columns={columns}
          rowKey={record => record.server}
          expandable={{ expandedRowRender }}
        />
      </>
    );
  };

  const renderManagerTasks = () => {
    const managerTasks = tasksStatus['manager'];

    if (!managerTasks) {
      return null;
    }

    return renderTasks(managerTasks, 'Manager Tasks');
  };

  return (
    <div>
      <Spin spinning={isLoading}>
        <Row gutter={16}>
          <Col span={12}>{renderGameServerTasks()}</Col>
          <Col span={12}>{renderManagerTasks()}</Col>
        </Row>
      </Spin>
    </div>
  );
};

export default ComponentHealth;