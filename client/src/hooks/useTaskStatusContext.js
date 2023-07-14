import React, { createContext, useState, useEffect, useContext } from 'react';
import { SelectedServerContext } from '../App';
import { createAxiosInstanceServer } from '../Security/axiosRequestFormat';

export const TaskStatusContext = createContext();

export const TaskStatusProvider = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const { selectedServerValue, selectedServerPort } = useContext(SelectedServerContext);

  const fetchTasksStatus = async () => {
    const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue, selectedServerPort);
    try {
      const response = await axiosInstanceServer.get(`/get_tasks_status?${Date.now()}`);
      
      const tasksWithErrors = Object.values(response.data.tasks_status).some(tasks => 
        Object.values(tasks).some(task => task.exception)
      );

      setHasError(tasksWithErrors);
    } catch (error) {
      console.error(error);
      setHasError(true);
    }
  };

  useEffect(() => {
    fetchTasksStatus();
    const intervalId = setInterval(fetchTasksStatus, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <TaskStatusContext.Provider value={{ hasError, fetchTasksStatus }}>
      {children}
    </TaskStatusContext.Provider>
  );
};
