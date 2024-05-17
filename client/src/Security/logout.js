// logout.js
import { clearSessionToken, clearTokenExpiry } from "./tokenManager";
const handleLogout = (navigate, message, setStateMessage, setAuthenticated) => {
    clearSessionToken();
    clearTokenExpiry();
    if (message) {
        setStateMessage(message);
    }
    setAuthenticated(false);
    console.log('Logging out');
    navigate('/login');
};

export default handleLogout;