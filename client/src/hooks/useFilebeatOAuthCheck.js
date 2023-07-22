// useFilebeatOAuthCheck.js
import { useEffect, useState } from 'react';
import { createAxiosInstanceServer } from '../Security/axiosRequestFormat';
import { SelectedServerContext } from '../App';
import { useContext } from 'react';

const useFilebeatOAuthCheck = () => {
    const [oAuthUrl, setOAuthUrl] = useState();
    const { selectedServerValue, selectedServerPort } = useContext(SelectedServerContext);
    const axiosInstanceServer = createAxiosInstanceServer(selectedServerValue, selectedServerPort);

    useEffect(() => {
        const checkOAuthUrl = async () => {
            try {
                const response = await axiosInstanceServer.get(`/get_filebeat_oauth_url?_t=${Date.now()}`)
                if (response.status === 200) {
                    if (response.data.url) {
                        setOAuthUrl(response.data.url);
                    } else if (response.data.status) {
                        setOAuthUrl(undefined);
                    }

                }
            } catch (error) {
                console.log(error);
            }
        }
        checkOAuthUrl(); // check immediately upon mounting
        const intervalId = setInterval(checkOAuthUrl, 30000); // check every 15 seconds

        return () => clearInterval(intervalId); // clear interval on component unmount

    }, []);

    return oAuthUrl;
};

export default useFilebeatOAuthCheck;
