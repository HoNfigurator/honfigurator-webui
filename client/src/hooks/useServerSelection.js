// hooks/useServerSelection.js
import { useState, useEffect } from 'react';
import { useServerList } from './useServerList';

export const useServerSelection = () => {
  const { serverOptions } = useServerList();
  const [selectedServerLabel, setSelectedServerLabel] = useState("");
  const [selectedServerValue, setSelectedServerValue] = useState("");
  const [selectedServerPort, setSelectedServerPort] = useState("");

  useEffect(() => {
    // Your server selection logic here...
  }, [serverOptions]);

  return { selectedServerLabel, selectedServerValue, selectedServerPort, setSelectedServerLabel, setSelectedServerValue, setSelectedServerPort };
};