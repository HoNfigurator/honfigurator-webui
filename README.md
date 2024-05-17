# Installing
### Creating configuration files
#### client/.env
```
REACT_APP_DISCORD_OWNER_ID_URL=https://www.businessinsider.com/guides/tech/discord-id#:~:text=To%20find%20a%20user's%20Discord,sidebar%20and%20select%20Copy%20ID
REACT_APP_DISCORD_CLIENT_ID=1096750568388702228
REACT_APP_DISCORD_SCOPE=identify email
# OPTIONAL FOR RUM - REAL USER MONITORING
#REACT_APP_APM_SERVICE_NAME=HoNfigurator-WebUI
#REACT_APP_APM_SERVICE_VERSION=1.0.0
#REACT_APP_APM_ENDPOINT=https://otel-rum.honfigurator.app:2087
```
#### client/.env.production
```
REACT_APP_DISCORD_CALLBACK_URI=https://management.honfigurator.app:3001/api-ui/user/auth/discord/callback
REACT_APP_BACKEND_BASE_URL=https://localhost:3001
REACT_APP_CA_FILE='fullchain.pem'
```
#### client/.env.development
```
REACT_APP_DISCORD_CALLBACK_URI=http://localhost:3001/api-ui/user/auth/discord/callback
REACT_APP_BACKEND_BASE_URL=http://localhost:3001
```
#### server/.env
```
DISCORD_CLIENT_ID='1096750568388702228'
DISCORD_CLIENT_SECRET='<ask-frank>'
DISCORD_REDIRECT_URI='https://management.honfigurator.app:3001/api-ui/user/auth/discord/callback'
SESSION_TIMEOUT="1h"

HON_COOKIE='<static-cookie>'
BOT_TOKEN='<discord-bot-token>'

OTEL_EXPORTER_ENDPOINT='https://otel.honfigurator.app:2083'
OTEL_EXPORTER_SERVICE_NAME='HoNfigurator-WebUI'
OTEL_EXPORTER_SERVICE_VERSION='1.0.0'
```
#### server/.env.production
```
jwtSecret='<secret>'

BASE_URL='https://management.honfigurator.app'

CERTIFICATE_FILE='cert.pem' # /etc/letsencrypt/live/<FQDN>/cert.pem
CERTIFICATE_KEY='privkey.pem' # /etc/letsencrypt/live/<FQDN>/privkey.pem
CERTIFICATE_CHAIN='fullchain.pem' # /etc/letsencrypt/live/<FQDN>/fullchain.pem
```
#### server/.env.development
```
jwtSecret='<secret>'

BASE_URL='http://localhost:3000'
```
### Running Project Locally (Development)
```
cd honfigurator-webui\server
npm install
cd ..\client
npm install

# you can choose production or development like this (in CMD):
NODE_ENV=development
npm run start-both
```
### Running Project (Production)
#### Requirements
1. Install node: ``sudo apt install nodejs``
2. Install certbot: ``sudo apt install certbot``
3. Request certificate: ``sudo certbot certonly --standalone -d <FQDN> -d <ANOTHER-FQDN> --deploy-hook "systemctl reload nginx && systemctl restart honfigurator"``
   - Note: this assumes you run the server as a service, otherwise you will not be able to auto-restart the backend upon certificate renewal

#### Building Project
You only need to build the website, since the server can run with node.
```
cd honfigurator-webui/client
npm run build
```
Deploy the built website contents from ``build`` to your webroot, IE using Nginx and the provided ``nginx.conf`` file, deploy to ``/var/www/html/honfigurator``.

#### Option 1 (recommended). Create a service file.
```
sudo tee /etc/systemd/system/honfigurator.service <<EOF
[Unit]
Description=HoNfigurator Management UI Node Backend
After=network.target

[Service]
Environment=NODE_ENV=production
WorkingDirectory=/root/honfigurator-webui/server/src
Type=simple
User=root
ExecStart=/usr/bin/node index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
```

#### Option 2. Manually start the backend node server
Not recommended as certificate renewals will not trigger a restart, also if there is an exception and it crashes, it won't restart.
```
cd honfigurator-webui/server
NODE_ENV=production
node app.js
```

### Post Procedure
Ensure firewall rules are opened.
```
sudo ufw allow 443 # Web traffic
sudo ufw allow 3001 # API traffic
```
