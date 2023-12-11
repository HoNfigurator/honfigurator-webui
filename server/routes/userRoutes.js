// server/routes/userRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const userController = require('../controllers/userController');
const { createHandshakePacket, createReplayRequestPacket, parseReplayStatus } = require('../controllers/kongorChatController');
const TokenManager = require('../helpers/tokenManager');
const qs = require('querystring');
const { oauth } = require('../controllers/userController');
const { unserialize } = require('php-unserialize'); // Import the library at the top of your file
const { sendMessageToDiscordUser, createEmbedMessage } = require('../controllers/discordController');

const router = express.Router();

function removeTimestampParam(req, res, next) {
  if (req.query.timestamp) {
    delete req.query.timestamp;
    const urlWithoutTimestamp = req.originalUrl.replace(/[?&]_t=\d+/, '');
    console.log(urlWithoutTimestamp);
    req.url = urlWithoutTimestamp;
  }
  next();
}

// Authenticate a user with Discord OAUTH2
router.get('/user/auth/discord/callback', userController.discordOAuth2);

// Get the current users details
router.get('/user/current', authMiddleware, discordAuthMiddleware, userController.getCurrentUser);

// Reauthenticate a user, against stored discord tokens
router.get('/user/reauth', discordAuthMiddleware, userController.reauthenticateUser);

// Get users managed server list
router.get('/user/get_servers', authMiddleware, discordAuthMiddleware, userController.getManagedServers);

// Get users information from the Discord API
router.get('/user/info', authMiddleware, discordAuthMiddleware, userController.getDiscordUserInfo);

// Kongor API healthcheck
router.get('/kongor-health', (req, res) => {
  fetch('https://api.kongor.online/health')
    .then(response => {
      if (!response.ok) {
        throw response;
      }
      // Check the content type to determine how to parse the response
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        return response.text();  // Fallback to text if it's not JSON
      }
    })
    .then(data => res.json(data)) // Forward the parsed response
    .catch(errorResponse => {
      if (errorResponse.text) {
        // If there's a text body, forward it along with the status code
        errorResponse.text().then(errorMessage => {
          res.status(errorResponse.status || 500).send(errorMessage);
        });
      } else {
        // If there's no text body, just forward the status code
        res.status(errorResponse.status || 500).end();
      }
    });
});


router.get('/get_match_stats/:matchId', async (req, res) => {
  let matchId = req.params.matchId;
  matchId = matchId.replace(/^[mM]/, '');
  const sessionCookie = process.env.HON_COOKIE;

  const data = qs.stringify({
    match_id: matchId,
    cookie: sessionCookie
  });

  const config = {
    method: 'post',
    url: 'http://api.kongor.online/client_requester.php?f=get_match_stats',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'HoNfigurator-WebUI'
      // add any other headers required
    },
    data: data
  };

  try {
    const response = await axios(config);
    const deserializedData = unserialize(response.data); // Deserialize the PHP serialized data
    res.json(deserializedData); // Send the deserialized data as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching match stats' });
  }
});

router.get('/check_replay_exists/:matchId', async (req, res) => {
  try {
    let matchId = req.params.matchId;
    matchId = matchId.replace(/^[mM]/, '');
    const config = {
      method: 'head',
      url: `http://api.kongor.online/replays/M${matchId}.honreplay`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'HoNfigurator-WebUI'
        // add any other headers required
      }
    }
    const existing = await axios(config);
    res.sendStatus(200);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.sendStatus(404);
    } else {
      console.error('An error occurred while checking if replay exists:', error);
      res.status(500).send('An error occurred while checking if replay exists');
    }
  }
});
const net = require('net');

// Helper function to determine the status message and HTTP status code
function getStatusMessageAndCode(status) {
  switch (status) {
    case -1: return [400, "None"];
    case 0: return [400, "General Failure"];
    case 1: return [504, "Replay does not exist"];
    case 2: return [403, "Invalid Host"];
    case 3: return [200, "Already Uploaded"];
    case 4: return [400, "Already Queued"];
    case 7: return [200, "Upload successful"];
    default: return [400, "Unknown status"];
  }
}

router.get('/request_replay/:matchId', async (req, res) => {
  let { matchId } = req.params;
  matchId = matchId.replace(/^[mM]/, '');
  try {
    console.log(`requesting replay: ${matchId}`)
    const client = new net.Socket();
    const chat_address = 'chat.kongor.online';
    const chat_port = 11031;

    client.connect(chat_port, chat_address, async () => {
      console.log('Connected to the remote server');

      const handshake_packet = createHandshakePacket();
      client.write(handshake_packet);
    });

    client.on('data', (data) => {
      const messageType = data[2] + data[3] * 256;  // Calculate the 16-bit integer value manually
      console.log(`[RESP] Message type: ${messageType.toString(16).padStart(4, '0')}`);

      if (messageType === 0x1c01) {
        console.log("[RESP] Chat authentication request failed.")
        res.status(401).json({message:"Chat authentication request failed"});
        client.end();
        client.destroy();
      } else if (messageType === 0x1c00) {
        const replay_request_packet = createReplayRequestPacket(matchId);
        client.write(replay_request_packet);
      }

      if (messageType === 0xbf) {
        const replayStatus = parseReplayStatus(data);
        console.log(replayStatus['status'])
        const [httpStatusCode, statusMessage] = getStatusMessageAndCode(replayStatus['status']);
        
        // If the status is a failure, or the upload is complete, close the connection.
        if (replayStatus['status'] <= 2 || replayStatus['status'] === 7) {
          console.log("closing");
          console.log(statusMessage)
          res.status(httpStatusCode).json({message:statusMessage});
          client.end();
          client.destroy();
        }
      }
    });

    client.on('close', () => {
      console.log('Connection closed');
    });

    client.on('error', (err) => {
      console.error('TCP socket connection error:', err);
      res.status(500).json({message:'Failed to request replay due to TCP socket connection error'});
    });
  } catch (err) {
    console.error('Request replay error:', err);
    res.status(500).json({message:'Failed to request replay'});
  }
});

router.get('/getDiscordUsername/:discordId', async (req, res) => {
  const discordId = req.params.discordId;
  const discordBotToken = process.env.BOT_TOKEN;

  const headers = {
    Authorization: `Bot ${discordBotToken}`,
  };

  const url = `https://discord.com/api/users/${discordId}`;

  try {
    const response = await axios.get(url, { headers });
    const userData = response.data;
    const username = userData.username;
    res.status(200).json({ username });
  } catch (error) {
    console.error(`Failed to get Discord username for ID: ${discordId}`);
    res.status(500).json({ error: 'Failed to get Discord username.' });
  }
});

// Endpoint to send a message to a discord user.
router.post('/sendDiscordMessage', userController.validateUserOwnsServer, async (req, res) => {
  const { discordId, title, description, serverName, serverInstance, matchId, type, timeLagged, timeCrashed, gamePhase } = req.body;
  
  try {
      let embed;
      if (type === 'lag' || timeLagged) {
        embed = createEmbedMessage(
          'Server Side Lag Detected', // Title
          'I’ve detected an unusual lag spike on your server.', // Description
          [ // Fields
              { name: 'Server Name', value: `${serverName}-${serverInstance}`, inline: true },
              { name: 'Match ID', value: matchId.toString(), inline: true },
              { name: 'Total Duration of Lag', value: `${timeLagged} seconds`, inline: true }
          ],
          'https://i.ibb.co/YdSTNV9/Hon-Figurator-Icon1c.png', // Thumbnail URL
          'Server side lag is usually to do with the CPU performance, but can also be caused by very active disk I/O. If problems continue, you can reduce your total server count.' // Footer Text
        );
      } else if (type === 'crash' || timeCrashed) {
        console.log('sending crash message, variables are as follows: ', discordId, title, description, serverName, matchId, type, timeLagged, timeCrashed, gamePhase);
        embed = createEmbedMessage(
          'Server Crash', // Title
          'A server instance has crashed while in game.', // Description
          [ // Fields
              { name: 'Server Name', value: `${serverName}-${serverInstance}`, inline: true },
              { name: 'Match ID', value: matchId.toString(), inline: true },
              { name: 'Time of Crash', value: timeCrashed, inline: true },
              { name: 'Game Phase', value: gamePhase, inline: true}
          ],
          'https://i.ibb.co/YdSTNV9/Hon-Figurator-Icon1c.png', // Thumbnail URL
          'Crashes are known to occur occasionally, this message is to notify you in case something is wrong.' // Footer Text
        );
      }
      if (!embed) {
        res.status(500).json({ error: 'No "type" provided. Please provide either "lag" or "crash"' })
      }
      await sendMessageToDiscordUser(discordId, embed);
      res.status(200).json({ message: 'Message sent successfully.' });
  } catch (error) {
      console.error(`Failed to send message: ${error.message}`);
      res.status(500).json({ error: 'Failed to send message.' });
  }
});

router.get('/get_all_servers', basicAuthMiddleware, userController.getAllServers) //async (req, res) => {
//   if (req.headers.authorization != 'elasticbruh') {
//     res.status(401).json({error: 'badluck buddy'})
//   }
//   const servers = await userController.getAllServers();
//   res.json({servers:servers});
// });

// authenticateToMasterserver("aufrankhost2", "!$4jb4pb9#gMQ?CY");

// Add server to users managed server list
router.post('/user/add_server', authMiddleware, discordAuthMiddleware, userController.addManagedServer);

router.put('/user/update_server', authMiddleware, discordAuthMiddleware, userController.updateServer);
router.delete('/user/delete_server', authMiddleware, discordAuthMiddleware, userController.deleteServer);

// Refresh the current session using a valid discord token
router.post('/user/refresh', authMiddlewareAllowExpired, discordAuthMiddleware, async (req, res) => {
  try {
    console.log(`received refresh request. ${req.user.user_id}`);

    // Check for user inactivity
    const currentTime = Math.floor(Date.now() / 1000);
    const inactivityWindow = 3600; // Set the inactivity window in seconds
    if (req.tokenExpired && currentTime - req.user.iat > inactivityWindow) {
      console.log("User's inactivity period exceeded. Logging out.");
      res.status(401).json({ error: 'User inactivity period exceeded' });
      return;
    }

    // Generate a new session token
    const newSessionToken = jwt.sign({ user_id: req.user.user_id }, process.env.jwtSecret, { expiresIn: process.env.SESSION_TIMEOUT });

    // Calculate the token expiration time
    const tokenExpiration = new Date(jwt.decode(newSessionToken).exp * 1000).toISOString();

    res.json({ sessionToken: newSessionToken, user: req.user, tokenExpiry: tokenExpiration });
  } catch (error) {
    console.error('Failed to refresh session token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// check for valid but expired token
async function authMiddlewareAllowExpired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No auth header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (typeof token !== 'string') {
    console.log('Token is not a string');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.jwtSecret, { algorithms: ['HS256'], ignoreExpiration: true });

    // Check if the token has expired
    const isExpired = (Date.now() / 1000 - decoded.iat) > decoded.exp;

    if (isExpired) {
      req.tokenExpired = true;
    }

    req.user = { user_id: decoded.user_id };
    next();
  } catch (error) {
    console.error('JWT token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Custom authMiddleware
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No auth header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (typeof token !== 'string') {
    console.log('Token is not a string');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = await jwt.verify(token, process.env.jwtSecret, { algorithms: ['HS256'] });

    req.user = { user_id: decoded.user_id };
    next();
  } catch (error) {
    console.error('JWT token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// used for public user access, typically just elastic so far..
async function basicAuthMiddleware(req, res, next) {
  try {
    if (req.headers.authorization != process.env.BASIC_AUTH) {
      return res.status(401).json({error: 'badluck buddy'})
    }
    next();
  } catch {
    res.status(500).json({error: 'Server error authenticating public user'});
  }
}

async function discordAuthMiddleware(req, res, next) {
  try {
    console.log(`discord token verification. ${req.user.user_id}`)
    const userData = await userController.getUserDataFromDatabase({ discord_id: req.user.user_id });

    // Check if the access token is about to expire or has already expired
    if (Date.now() >= userData.expires_at - 60 * 1000) {
      console.log('Discord access token expired or about to expire, refreshing...');

      const tokenManager = new TokenManager(oauth, userData.discord_id, userController.getUserDataFromDatabase, userController.updateAccessToken);
      const tokenData = await tokenManager.refreshToken(tokenManager.refreshTokenFunc.bind(tokenManager));
      const { newAccessToken, expiresIn } = tokenData;
      console.log(`new data:\n\t${newAccessToken}\n\t${expiresIn}`);
    }
    next();
  } catch (error) {
    console.error('Failed to refresh Discord access token:', error);
    return res.status(401).json({ error: 'Internal server error' });
  }
}

async function refreshDiscordToken(user_id, discord_id) {
  try {
    const userData = await userController.getUserDataFromDatabase({ discord_id });

    if (Date.now() >= userData.expires_at - 60 * 1000) {
      console.log('Discord access token expired or about to expire, refreshing...');

      const tokenManager = new TokenManager(oauth, discord_id);
      const newAccessToken = await tokenManager.refreshToken(tokenManager.refreshTokenFunc.bind(tokenManager));

      console.log(`New Discord access token: ${newAccessToken}`);
    }
  } catch (error) {
    console.error('Failed to refresh Discord access token:', error);
    throw error;
  }
}

module.exports = router;
