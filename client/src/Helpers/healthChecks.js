import { createAxiosInstanceServer } from "../Security/axiosRequestFormat";

export const performTCPCheck = async (address) => {
  try {
    const axiosInstanceServer = createAxiosInstanceServer(address);
    const response = await axiosInstanceServer.get(`/ping?_t=${Date.now()}`);
    return response.data.status;
  } catch (error) {
    console.error('TCP check error:', error);
    return 'error';
  }
};