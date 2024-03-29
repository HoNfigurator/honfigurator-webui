// server/src/controllers/userController.js
const axios = require('axios');
const jwt = require('jsonwebtoken');
const DiscordOAuth2 = require('discord-oauth2');
const oauth = new DiscordOAuth2();
const dns = require('dns').promises;

const { createUser, getUserDataFromDatabase, getServerByIDAndName, updateAccessToken, checkForExistingServer, getUserServersFromDatabase, getAllServersFromDatabase, createServerForUser, updateServerForUser, deleteServerForUser } = require('../db/session'); // Import the functions
const TokenManager = require('../helpers/tokenManager');

// server/controllers/userController.js
async function reauthenticateUser(req, res) {
  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("no authorization header.")
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    console.log(token);
    if (!token) {
      console.log("no token in authorization header")
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify and decode the token to get the user_id (discord_id)
    const decoded = jwt.verify(token, process.env.jwtSecret, { algorithms: ['HS256'] });
    const user_id = decoded.user_id;

    console.log(user_id);
    const userData = await getUserDataFromDatabase({ discord_id: user_id });

    if (!userData) {
      return res.status(401).json({ error: 'User not found' });
    }

    // If access_token is expired, try to refresh it
    if (Date.now() >= userData.expires_at) {
      console.log("Discord access token is expired. Attempting renewal")
      const tokenManager = new TokenManager(oauth, userData.discord_id, getUserDataFromDatabase, updateAccessToken);
      const { newAccessToken, newRefreshToken, expiresIn } = await tokenManager.refreshToken(tokenManager.refreshTokenFunc.bind(tokenManager));

      // Calculate the new expiration timestamp
      const expiresAt = Date.now() + expiresIn * 1000;

      await updateAccessToken(userData.user_id, newAccessToken, newRefreshToken, expiresAt);
    }

    // Generate a new session token for the user
    const sessionToken = jwt.sign({ user_id: userData.user_id }, process.env.jwtSecret, { expiresIn: process.env.SESSION_TIMEOUT });

    // Calculate the token expiration time
    const tokenExpiration = new Date(Date.now() + jwt.decode(sessionToken).exp * 1000).toISOString();

    res.json({ sessionToken: sessionToken, user_data: userData, tokenExpiration: tokenExpiration });

  } catch (error) {
    console.error('Error during reauthentication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


async function getUserInfoFromDiscord(accessToken) {
  try {
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { username, discriminator } = response.data;

    // Combine the username and discriminator to get the full Discord name.
    const discordName = `${username}#${discriminator}`;

    return discordName;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}


async function getDiscordUserInfo(req, res) {
  try {
    const { user_id } = req.user;

    if (!user_id) {
      console.log("No user ID in request body.");
      return res.status(401).json({ error: 'No user was provided in the request body.' });
    }

    const userData = await getUserDataFromDatabase({ discord_id: user_id });

    if (!userData) {
      console.log(`User not found for ID ${user_id}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const discordName = await getUserInfoFromDiscord(userData.access_token);
    console.log(discordName);

    res.json({ discordName });
  } catch (error) {
    console.error('Error fetching Discord user info:', error);
    return res.status(500).json({ error: `Server error occurred while fetching Discord user info. ${error}` });
  }
}

async function discordOAuth2(req, res) {
  const { code } = req.query;
  try {
    const tokenResponse = await oauth.tokenRequest({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      grantType: 'authorization_code',
      code,
      scope: 'identify',
      redirectUri: process.env.DISCORD_REDIRECT_URI,
    });

    const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenResponse;

    // Calculate the expiration timestamp
    const expiresAt = Date.now() + expiresIn * 1000;

    // Retrieve the user's information using the access token
    const userResponse = await oauth.getUser(accessToken);

    // After retrieving the user's data
    const userData = userResponse;

    // Generate a session token (e.g., a JSON Web Token or JWT)
    const sessionToken = jwt.sign({ user_id: userData.id }, process.env.jwtSecret, { expiresIn: process.env.SESSION_TIMEOUT });

    const tokenExpiration = new Date(jwt.decode(sessionToken).exp * 1000).toISOString();
    console.log(`new expiration: ${tokenExpiration}`);
    // Save the access token, userData, and sessionToken in your database, and create a session for the user
    console.log(`New OAUTH: Updating discord data.\n\taccess_token: ${accessToken}\n\trefresh_token: ${refreshToken}\n\texpires at: ${expiresAt}`)
    const session = await createUser(userData, accessToken, refreshToken, expiresAt);

    // Redirect the user back to your frontend, sending the session token as a query parameter
    res.redirect(`${process.env.BASE_URL}?sessionToken=${sessionToken}&tokenExpiry=${tokenExpiration}`); // Replace with the appropriate frontend route
  } catch (error) {
    console.error('Error during Discord OAuth2:', error);
    res.status(500).json({ error: 'Internal server error occured while performing discord account verification.' });
    console.log(error.response)
  }
}

async function getCurrentUser(req, res) {
  try {
    const { user_id } = req.user;

    if (!user_id) {
      console.log("No user ID in request body.");
      return res.status(401).json({ error: 'No user was provided in the request body.' });
    }

    console.log(`Looking up user ${user_id}`);

    const userData = await getUserDataFromDatabase({ discord_id: user_id });

    if (!userData) {
      console.log(`User not found for ID ${user_id}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log(`User found \n\tID: ${userData.id}`)

    res.json(userData);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: `Server error occured while fetching the requested user. ${error}` });
  }
}

function getIPv4Address(ip) {
  if (ip === '::1') {
      return '127.0.0.1';
  }
  if (ip.includes('::ffff:')) {
      return ip.split('::ffff:')[1];
  }
  return ip;
}

function isIpAddress(address) {
  // Regular expression for validating an IPv4 address
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(address);
}

// Cache object
const dnsResolutionCache = {};

// Cache expiry time in milliseconds (e.g., 1 hour)
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to check if cache entry is expired
function isCacheExpired(entry) {
  if (!entry) return true;
  const now = new Date().getTime();
  return now - entry.timestamp > CACHE_EXPIRY_MS;
}

// Function to resolve DNS with caching and expiry
async function resolveDNSWithCache(dnsName) {
  const cacheEntry = dnsResolutionCache[dnsName];

  // Check cache first and validate if it's not expired
  if (cacheEntry && !isCacheExpired(cacheEntry)) {
    return cacheEntry.resolvedIps;
  }

  // Resolve DNS and update cache
  try {
    const resolvedIps = await dns.resolve4(dnsName);
    dnsResolutionCache[dnsName] = {
      resolvedIps,
      timestamp: new Date().getTime()
    };
    return resolvedIps;
  } catch (error) {
    throw error;
  }
}

async function validateUserOwnsServer(req, res, next) {
  try {
    const { discordId } = req.body;

    if (!discordId) {
      console.log("No discord ID in request body.");
      return res.status(401).json({ error: 'No discord ID was provided in the request body.' });
    }

    // Retrieve the list of servers owned by the user from the database
    const servers = await getUserServersFromDatabase( discordId );

    if (!servers || servers.length === 0) {
      console.log(`No servers found for user: ${discordId}`);
      return res.status(401).json({ error: 'Unauthorized - No servers associated with this user.' });
    }

    // Get the IP address from the request
    // It might be req.ip or check for forwarded headers in case of proxy
    const reqIp = getIPv4Address(req.ip || req.connection.remoteAddress ||
      (req.headers['x-forwarded-for'] || '').split(',').pop().trim());

    // Function to check if the server IP matches the request IP
    const checkServerIp = async (server) => {
      if (server.address === reqIp) {
        return true;
      }

      // Check if the server address is a DNS name
      if (!isIpAddress(server.address)) {
        try {
          const resolvedIps = await resolveDNSWithCache(server.address);
          return resolvedIps.includes(reqIp);
        } catch (error) {
          console.error(`Error resolving DNS for ${server.address}: ${error}`);
          return false;
        }
      }
      
      return false;
    };

    // Check if the request IP matches any of the server IPs or resolved DNS names
    const authorizationChecks = await Promise.all(servers.map(checkServerIp));
    const isAuthorized = authorizationChecks.includes(true);

    if (!isAuthorized) {
      console.log(`Unauthorized access attempt by IP: ${reqIp}`);
      return res.status(401).json({ error: 'Unauthorized - IP address does not match any known servers for this user.' });
    }

    // If the IP matches, invoke the next middleware
    next();
  } catch (error) {
    console.error('Error in validateUserOwnsServer:', error);
    return res.status(500).json({ error: `Server error occurred while validating the user server ownership. ${error}` });
  }
}

async function getManagedServers(req, res) {
  try {
    const { user_id } = req.user;
    const servers = await getUserServersFromDatabase(user_id);

    res.json(servers);
  } catch (error) {
    console.error('Error fetching managed servers:', error);
    return res.status(500).json({ error: `Server error occured while fetching managed servers. ${error}` });
  }
}

async function getAllServers(req, res) {
  try {
    const servers = await getAllServersFromDatabase();
    console.log(servers);

    if (!servers) {
      return res.status(500).json({error:'No servers returned from database query'})
    }

    res.json(servers);
  } catch (error) {
    console.error('Error getting servers from database', error);
    return res.status(500).json({ error: `Server error occured while looking up servers from database. ${error}` });
  }
}

async function addManagedServer(req, res) {
  try {
    const { user_id } = req.user;
    const { name, address, port } = req.body;
    const existingServer = await checkForExistingServer(user_id, name, address, port);
    if (existingServer.length > 0) {
      console.log(`Adding server.. already exists! ${existingServer}`);
      return res.status(500).json({ error: 'Server name OR address is already registered.' })
    }
    const server = await createServerForUser(user_id, name, address, port);

    res.json(server);
  } catch (error) {
    console.error('Error adding managed server:', error);
    return res.status(500).json({ error: `Server error occured. ${error}` });
  }
}

// Add new controller functions
async function updateServer(req, res) {
  try {
    const { user_id } = req.user;
    const { old, new: updated } = req.body;

    const oldName = old.name;
    const oldAddress = old.address;
    const oldPort = old.port;
    const newName = updated.name;
    const newAddress = updated.address;
    const newPort = updated.port;

    console.log(`Updating server for ${user_id}\n\tOld name: ${old.name}\n\tOld address: ${old.address}\n\tNew name: ${updated.name}\n\tNew address: ${updated.address}`)

    const result = await updateServerForUser(user_id, oldName, oldAddress, oldPort, newName, newAddress, newPort);

    res.json(result);
  } catch (error) {
    console.error('Error updating server:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}

async function deleteServer(req, res) {
  try {
    const { user_id } = req.user;
    const { name } = req.body;

    console.log(`deleting server from user: ${user_id}`);
    console.log(`delete server for name: ${name}`);

    const result = await deleteServerForUser(user_id, name);

    res.json(result);
  } catch (error) {
    console.error('Error deleting server:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}


module.exports = {
  getDiscordUserInfo,
  discordOAuth2,
  getCurrentUser,
  updateAccessToken,
  getUserDataFromDatabase,
  validateUserOwnsServer,
  reauthenticateUser,
  oauth,
  getManagedServers,
  addManagedServer,
  updateServer,
  deleteServer,
  getAllServers
}; // Add the new functions to the exports