// ServerListContext.js
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  const [backoffDelays, setBackoffDelays] = useState({});

  const addServer = (newServer) => {
    console.log("adding");
    console.log(newServer);
    // Add the server to the server list
    setServerOptions((prevOptions) => [
      ...prevOptions,
      {
        label: newServer.serverName,
        value: newServer.serverAddress,
        port: newServer.serverPort || 5000,
        status: 'OK' // set default status to online
      }
    ]);
  };


  const removeServer = (serverLabel) => {
    setServerOptions((prevOptions) => prevOptions.filter((server) => server.label !== serverLabel));
  };

  const updateServerOptions = (prevOptions, newStatuses) => {
    const updatedOptions = prevOptions.map((option) => {
      const updatedStatus = newStatuses.find(
        (status) => status.value === option.value && status.port === option.port
      );
      if (updatedStatus) {
        return updatedStatus;
      }
      return option;
    });

    // Add any new servers that were not present in the previous options
    const newServers = newStatuses.filter(
      (status) =>
        !prevOptions.some(
          (option) => option.value === status.value && option.port === status.port
        )
    );
    return [...updatedOptions, ...newServers];
  };


  const getServers = async (selectedServerAddress) => {
    try {
      setServerStatusLoading(true);
      const response = await axiosInstanceUI.get(`/user/get_servers`);
      const data = response.data;
      if (data && data.length) {
        const serverPromises = data.map(async (server) => {
          try {
            // Apply the backoff delay for this server, if any
            const delay = backoffDelays[server.address] || 0;
            if (delay > 0) {
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
            const isSelectedServer = server.address === selectedServerAddress;
            const serverStatusResponse = await performTCPCheck(server.address, server.port).catch((error) => {
              // Increase the backoff delay for this server if it's offline
              if (error.code === "ECONNABORTED") {
                setBackoffDelays((prevDelays) => {
                  const currentDelay = prevDelays[server.address] || 0;
                  const newDelay = Math.min(currentDelay * 2 || 20000, 60000); // Limit the maximum backoff delay to 1 minute
                  return { ...prevDelays, [server.address]: newDelay };
                });
              }

              return {
                data: {
                  status: 'unknown',
                },
              };
            });
            if (serverStatusResponse.data.status === 'online') {
              setBackoffDelays((prevDelays) => ({ ...prevDelays, [server.address]: 0 }));
            }

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

        const serverResults = await Promise.all(serverPromises);
        const formattedServers = serverResults.filter((result) => result !== null);

        // Batch update the server options with the new server statuses
        setServerOptions((prevOptions) => updateServerOptions(prevOptions, formattedServers));
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
      }, 60000);

      return () => clearInterval(intervalId);
    }
  }, [authenticated]);

  const value = useMemo(() => {
    return {
      serverOptions,
      serverStatusLoading,
      firstLoad,
      getServers,
      removeServer,
      addServer,
    };
  }, [serverOptions, serverStatusLoading, firstLoad]);


  return (
    <ServerListContext.Provider value={value}>
      {children}
    </ServerListContext.Provider>
  );
};
