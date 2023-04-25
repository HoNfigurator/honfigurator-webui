// logout.js
const handleLogout = (navigate, message, setStateMessage, setAuthenticated) => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('tokenExpiry');
    if (message) {
        setStateMessage(message);
    }
    setAuthenticated(false);
    navigate('/login');
};

export default handleLogout;