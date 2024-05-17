// tokenManager.js
let sessionToken = localStorage.getItem('sessionToken');
let tokenExpiry = localStorage.getItem('tokenExpiry');

export const setSessionToken = (token) => {
    // console.log('Setting session token:', token);
    sessionToken = token;
    if (localStorage.getItem('cookieConsent') === 'true') {
        localStorage.setItem('sessionToken', token);
    }
};

export const getSessionToken = () => {
    // console.log('Getting session token:', sessionToken);
    return sessionToken || localStorage.getItem('sessionToken');
};

export const clearSessionToken = () => {
    // console.log('Clearing session token');
    sessionToken = null;
    localStorage.removeItem('sessionToken');
};

export const setTokenExpiry = (expiry) => {
    // console.log('Setting token expiry:', expiry);
    tokenExpiry = expiry;
    if (localStorage.getItem('cookieConsent') === 'true') {
        localStorage.setItem('tokenExpiry', expiry);
    }
}

export const getTokenExpiry = () => {
    // console.log('Getting token expiry:', tokenExpiry);
    return tokenExpiry || localStorage.getItem('tokenExpiry');
}

export const clearTokenExpiry = () => {
    // console.log('Clearing token expiry');
    tokenExpiry = null;
    localStorage.removeItem('tokenExpiry');
}