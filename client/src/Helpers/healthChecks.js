import { createAxiosInstanceServer } from "../Security/axiosRequestFormat";

export const performTCPCheck = async (address, port) => {
  try {
    // console.log(`pinging ${address}`);
    const axiosInstanceServer = createAxiosInstanceServer(address, port);
    // Set a timeout (in milliseconds) for the request
    const TIMEOUT = 5000; // 3 seconds
    const response = await axiosInstanceServer.get(`/ping?_t=${Date.now()}`, {
      timeout: TIMEOUT,
    });
    console.log(`${address} ${response.data.status}`)
    return response;
  } catch (error) {
    console.error('TCP check error:', error);
    if (error.code === "ECONNABORTED") {
      return {
        status: 500,
        data: {
          status: "offline"
        },
      };
    } else {
      return {
        status: error.response.status || 501,
        message: error.response.data.error || error.response.data.message || "Unknown error",
        data: {
          status: "Unable to join"
        },
      }
    }
  }
};
