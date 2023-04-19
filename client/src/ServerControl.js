import React, { useState } from 'react';
import { axiosInstanceServer } from './Security/axiosRequestFormat';

function ServerControl({ serverId }) {
  const [isStopping, setIsStopping] = useState(false);

  const handleStopServer = async () => {
    setIsStopping(true);
    try {
      await axiosInstanceServer.post(`/stop_server?id=${serverId}`);
    } catch (error) {
      console.error(error);
    }
    setIsStopping(false);
  };

  return (
    <div>
      <button onClick={handleStopServer} disabled={isStopping}>
        {isStopping ? 'Stopping...' : 'Stop Server'}
      </button>
    </div>
  );
}

export default ServerControl;
