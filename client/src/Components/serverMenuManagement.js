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

export const handleRemoveServer = async (event, server, getServers) => {
    event.stopPropagation();
    // console.log("Remove server:", server);
    const payload = {
        name: server.label
    }
    try {
        await axiosInstanceUI.delete('/user/delete_server', { data: payload });
        getServers(); // Refresh the server list after deletion
        message.success(`Server '${server.label}' deleted successfully.`);
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