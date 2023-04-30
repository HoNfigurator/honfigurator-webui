// ServerListContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstanceUI } from '../Security/axiosRequestFormat';
import { performTCPCheck } from '../Helpers/healthChecks';

const ServerListContext = createContext(null);

export const useServerList = () => {
  const context = useContext(ServerListContext);
  if (!context) {
    throw new Error('useServerList must be used within a ServerListProvider');
  }
  return context;
};

export const ServerListProvider = ({ children, authenticated }) => {
  const [serverOptions, setServerOptions] = useState([]);
  const [serverStatusLoading, setServerStatusLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const getServers = async () => {
    try {
      setServerStatusLoading(true);
      const response = await axiosInstanceUI.get(`/user/get_servers`);
      // console.log('Response data:', response.data); // Log the response data
      const data = response.data;

      if (data && data.length) {
        const formattedServers = await Promise.all(
          data.map(async (server) => {
            const status = await performTCPCheck(server.address);
            // console.log(`Status: ${status}`);
            return {
              label: server.name,
              value: server.address,
              status: status,
            };
          })
        );
        setServerOptions(formattedServers);
      } else {
        setServerOptions([]); // Set an empty array if there are no servers
      }
    } catch (error) {
      console.error('Error fetching server list:', error);
    } finally {
      setServerStatusLoading(false);
      setFirstLoad(false); // Add this line
    }
  };

  useEffect(() => {
    if (authenticated) {
      getServers();
    }
  
    const intervalId = setInterval(() => {
      if (authenticated) {
        getServers();
      }
    }, 60000);
  
    return () => clearInterval(intervalId);
  }, [authenticated]);

  const value = {
    serverOptions,
    serverStatusLoading,
    firstLoad,
    getServers,
  };

  return (
    <ServerListContext.Provider value={value}>
      {children}
    </ServerListContext.Provider>
  );
};
