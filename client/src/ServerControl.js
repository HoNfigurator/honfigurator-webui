import React, { useState } from 'react';
import axios from 'axios';

function ServerControl({ serverId }) {
  const [isStopping, setIsStopping] = useState(false);

  const handleStopServer = async () => {
    setIsStopping(true);
    try {
      await axios.post(`/api/stop_server?id=${serverId}`);
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
