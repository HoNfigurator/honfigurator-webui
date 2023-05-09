// serverMenuManagement.js
import { message } from 'antd';
import { axiosInstanceUI } from '../Security/axiosRequestFormat';

export function ServerNotConnected() {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                fontSize: "1.5em",
                fontWeight: "bold",
                color: "red",
            }}
        >
            Server is not connected
        </div>
    );
}

export const handleEditServer = (event, server, setServerToEdit, setEditServerModalVisible) => {
    event.stopPropagation();
    setServerToEdit(server);
    setEditServerModalVisible(true);
};

export const handleRemoveServer = async (event, server, removeServer) => {
    event.stopPropagation();
    const payload = {
      name: server.label
    }
    try {
      const response = await axiosInstanceUI.delete('/user/delete_server', { data: payload });
      if (response.status === 200) {
        removeServer(server.label); // Remove the server from the context directly
        message.success(`Server '${server.label}' deleted successfully.`);
      } else {
        message.error(`Error deleting server '${server.label}'.`);
      }
    } catch (error) {
      console.error('Error deleting server:', error);
      message.error(`Error deleting server '${server.label}'.`);
    }
  };


export const getServerStatusIndicator = (status) => (
    <div
        style={{
            display: "inline-block",
            marginLeft: "5px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor:
                status === "OK" ? "green" : "red",
        }}
    />
);