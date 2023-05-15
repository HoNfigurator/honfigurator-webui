import React, { useState, useEffect, useContext } from 'react';
import { message, Spin, Card, Row, Col, Table } from 'antd';
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
  }, []);

  const renderTasks = (tasksObject, title) => {
    const tasksArray = Object.entries(tasksObject).map(([taskName, task]) => {
      return {
        task: taskName,
        ...task,
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
        filters: [
          { text: 'Running', value: 'Running' },
          { text: 'Done', value: 'Done' },
          // Add more status values if needed
        ],
        onFilter: (value, record) => record.status.indexOf(value) === 0,
        render: (status) => {
          let color = 'default';
          if (status === 'Running') {
            color = 'green';
          } else if (status === 'Done') {
            color = 'blue';
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
        <Table dataSource={tasksArray} columns={columns} rowKey={record => record.task} />
      </>
    );
  };
  const renderGameServerTasks = () => {
    const gameTasks = tasksStatus['game_servers'];

    if (!gameTasks) {
      return null;
    }

    const gameServersArray = Object.entries(gameTasks).map(([serverName, serverTasks]) => {
      const taskEntries = Object.entries(serverTasks);
      const errorTasks = taskEntries.filter(([taskName, task]) => task.exception);

      return {
        server: serverName,
        status: errorTasks.length === 0 ? 'Healthy' : 'Error',
        errorTasks: errorTasks.length === 0 ? null : errorTasks,
        tasks: serverTasks,
      };
    });

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
      },
    ];

    const expandedRowRender = (record) => {
      const tasksArray = Object.entries(record.tasks).map(([taskName, task]) => {
        return {
          task: taskName,
          ...task,
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