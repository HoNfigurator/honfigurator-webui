// useKongorHealthStatus.js
import { useEffect, useState } from 'react';

const useKongorHealthStatus = () => {
    const [healthStatus, setHealthStatus] = useState("Loading...");

    useEffect(() => {
        const checkHealthStatus = () => {
            fetch("/api-ui/kongor-health")
                .then(response => {
                    if (!response.ok) {
                        // Handle specific ranges of status codes
                        if (response.status >= 500) {
                            throw new Error(`Server Error (${response.status})`);
                        } else if (response.status >= 400) {
                            throw new Error(`Client Error (${response.status})`);
                        }
                        throw new Error(`Unexpected Error (${response.status})`);
                    }
                    return response.json();
                })
                .then(data => setHealthStatus(`🟢 ${data.status}`)) // Display success with green circle
                .catch((error) => {
                    console.error('Error:', error);
                    setHealthStatus(`🔴 ${error.message}`); // Display error message with red circle
                });
        };

        checkHealthStatus(); // check immediately upon mounting
        const intervalId = setInterval(checkHealthStatus, 30000); // check every 15 seconds

        return () => clearInterval(intervalId); // clear interval on component unmount
    }, []);

    return healthStatus;
};

export default useKongorHealthStatus;
