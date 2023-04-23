import { axiosInstanceUI } from "../Security/axiosRequestFormat";
import { axiosInstanceServer } from "../Security/axiosRequestFormat";

export const performTCPCheck = async (address) => {
  console.log(`address: ${address}`);
  try {
    const response = await axiosInstanceServer.get(`/ping?_t=${Date.now()}`);
    return response.data.status;
  } catch (error) {
    console.error('TCP check error:', error);
    return 'error';
  }
};