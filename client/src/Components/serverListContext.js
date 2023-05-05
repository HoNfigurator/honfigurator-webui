// ServerListContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstanceUI } from '../Security/axiosRequestFormat';
import { performTCPCheck } from '../Helpers/healthChecks';
import { useAuthenticatedState } from '../Security/RequireAuth';

const ServerListContext = createContext(null);

export const useServerList = () => {
  const context = useContext(ServerListContext);
  if (!context) {
    throw new Error('useServerList must be used within a ServerListProvider');
  }
  return context;
};

export const ServerListProvider = ({ children }) => {
  const [serverOptions, setServerOptions] = useState([]);
  const [serverStatusLoading, setServerStatusLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const getServers = async (selectedServerAddress) => {
    try {
      setServerStatusLoading(true);
      const response = await axiosInstanceUI.get(`/user/get_servers`);
      const data = response.data;
      if (data && data.length) {
        const serverPromises = data.map(async (server) => {
          try {
            const isSelectedServer = server.address === selectedServerAddress;
            const serverStatusResponse = await performTCPCheck(server.address, server.port).catch(() => {
              return {
                data: {
                  status: 'unknown',
                },
              };
            });

            return {
              label: server.name,
              value: server.address,
              port: server.port || 5000,
              status: serverStatusResponse.data.status,
              isSelectedServer: isSelectedServer,
            };
          } catch (error) {
            console.error('Error fetching server status:', error);
            return null;
          }
        });


        const serverResults = await Promise.allSettled(serverPromises);

        const formattedServers = serverResults
          .filter((result) => result.status === "fulfilled" && result.value !== null)
          .map((result) => result.value);
        setServerOptions(formattedServers);
      } else {
        setServerOptions([]);
      }
    } catch (error) {
      console.error('Error fetching server list:', error);
    } finally {
      setServerStatusLoading(false);
      setFirstLoad(false);
    }
  };

  const token = localStorage.getItem('sessionToken');
  const { authenticated } = useAuthenticatedState(token);


  useEffect(() => {
    if (authenticated) {
      getServers();

      const intervalId = setInterval(() => {
        if (authenticated) {
          getServers();
        }
      }, 15000);

      return () => clearInterval(intervalId);
    }
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
