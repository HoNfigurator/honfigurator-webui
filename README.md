# Installing
### Creating configuration files
#### client\\.env
```
REACT_APP_DISCORD_OWNER_ID_URL=https://www.businessinsider.com/guides/tech/discord-id#:~:text=To%20find%20a%20user's%20Discord,sidebar%20and%20select%20Copy%20ID
REACT_APP_DISCORD_CLIENT_ID=1096750568388702228
REACT_APP_DISCORD_SCOPE=identify email
```
#### client\\.env.production
```
REACT_APP_DISCORD_CALLBACK_URI=https://management.honfigurator.app:3001/api-ui/user/auth/discord/callback
REACT_APP_BACKEND_BASE_URL=https://localhost:3001
REACT_APP_CA_FILE='fullchain.pem'
```
#### client\\.env.development
```
REACT_APP_DISCORD_CALLBACK_URI=http://localhost:3001/api-ui/user/auth/discord/callback
REACT_APP_BACKEND_BASE_URL=http://localhost:3001```
```
#### server\\.env.production
```
jwtSecret='<secret>'
DISCORD_CLIENT_ID='1096750568388702228'
DISCORD_CLIENT_SECRET='<ask-frank>'
DISCORD_REDIRECT_URI='https://management.honfigurator.app:3001/api-ui/user/auth/discord/callback'
SESSION_TIMEOUT="1h"

BASE_URL='https://management.honfigurator.app'

CERTIFICATE_FILE='cert.pem'
CERTIFICATE_KEY='privkey.pem'
CERTIFICATE_CHAIN='fullchain.pem'

HON_COOKIE='<static-cookie>'
BOT_TOKEN='<discord-bot-token>'
```
#### server\\.env.development
```
jwtSecret='<secret>'
DISCORD_CLIENT_ID='1096750568388702228'
DISCORD_CLIENT_SECRET='<ask-frank>'
DISCORD_REDIRECT_URI='http://localhost:3001/api-ui/user/auth/discord/callback'
SESSION_TIMEOUT="1h"

BASE_URL='http://localhost:3000'

HON_COOKIE='<static-cookie>'
BOT_TOKEN='<discord-bot-token>'
```
### Running Project
```
cd honfigurator-webui\server
npm install
cd ..\client
npm install

# you can choose production or development like this (in CMD):
# NODE_ENV=DEVELOPMENT
# NODE_ENV=PRODUCTION
npm run start-both
```
### Building Project
You only need to build the website, since the server can run with node.
```
cd honfigurator-webui\client
npm run build
```
