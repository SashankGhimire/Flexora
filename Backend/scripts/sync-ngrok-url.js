const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

const TUNNELS_API_URL = 'http://127.0.0.1:4040/api/tunnels';
const WATCH_INTERVAL_MS = 2000;
const args = process.argv.slice(2);
const watchMode = args.includes('--watch');

const apiConfigPath = path.resolve(__dirname, '..', '..', 'Frontend', 'src', 'config', 'api.ts');

let lastSyncedUrl = null;
let lastSyncedLocalOrigin = null;

const isPrivateIpv4 = (ip) => {
  if (typeof ip !== 'string') {
    return false;
  }

  if (ip.startsWith('10.')) {
    return true;
  }

  if (ip.startsWith('192.168.')) {
    return true;
  }

  const octets = ip.split('.').map((value) => Number(value));
  if (octets.length !== 4 || octets.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return false;
  }

  return octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31;
};

const detectLocalOrigin = (port = 5000) => {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  Object.values(interfaces).forEach((entries) => {
    if (!Array.isArray(entries)) {
      return;
    }

    entries.forEach((entry) => {
      if (!entry || entry.family !== 'IPv4' || entry.internal) {
        return;
      }

      if (entry.address.startsWith('169.254.')) {
        return;
      }

      candidates.push(entry.address);
    });
  });

  const preferred = candidates.find(isPrivateIpv4) || candidates[0];
  return preferred ? `http://${preferred}:${port}` : null;
};

const fetchTunnels = () => {
  return new Promise((resolve, reject) => {
    http
      .get(TUNNELS_API_URL, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Unexpected status ${res.statusCode} from ngrok API`));
            return;
          }

          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
};

const selectPublicUrl = (payload) => {
  const tunnels = Array.isArray(payload?.tunnels) ? payload.tunnels : [];
  if (!tunnels.length) {
    return null;
  }

  const httpsTunnel = tunnels.find((tunnel) => typeof tunnel?.public_url === 'string' && tunnel.public_url.startsWith('https://'));
  if (httpsTunnel?.public_url) {
    return httpsTunnel.public_url;
  }

  return tunnels.find((tunnel) => typeof tunnel?.public_url === 'string')?.public_url || null;
};

const updateApiConfig = (publicUrl, localOrigin) => {
  const content = fs.readFileSync(apiConfigPath, 'utf8');
  const ngrokPattern = /export const API_URL_NGROK = '[^']*';/;
  const localPattern = /export const API_URL_LOCAL = '[^']*';/;

  if (!ngrokPattern.test(content)) {
    throw new Error('Could not find API_URL_NGROK in Frontend/src/config/api.ts');
  }

  if (localOrigin && !localPattern.test(content)) {
    throw new Error('Could not find API_URL_LOCAL in Frontend/src/config/api.ts');
  }

  let updated = content.replace(ngrokPattern, `export const API_URL_NGROK = '${publicUrl}';`);

  if (localOrigin) {
    updated = updated.replace(localPattern, `export const API_URL_LOCAL = '${localOrigin}';`);
  }

  if (updated !== content) {
    fs.writeFileSync(apiConfigPath, updated, 'utf8');
  }
};

const syncNgrokUrl = async () => {
  const payload = await fetchTunnels();
  const publicUrl = selectPublicUrl(payload);
  const localOrigin = detectLocalOrigin(Number(process.env.PORT) || 5000);

  if (!publicUrl) {
    throw new Error('No active ngrok tunnel found. Start tunnel first with npm run ngrok.');
  }

  if (publicUrl !== lastSyncedUrl || localOrigin !== lastSyncedLocalOrigin) {
    updateApiConfig(publicUrl, localOrigin);
    lastSyncedUrl = publicUrl;
    lastSyncedLocalOrigin = localOrigin;
    console.log(`Synced API_URL_NGROK -> ${publicUrl}`);
    if (localOrigin) {
      console.log(`Synced API_URL_LOCAL -> ${localOrigin}`);
    }
  }

  return publicUrl;
};

const run = async () => {
  if (!watchMode) {
    try {
      await syncNgrokUrl();
    } catch (error) {
      console.error(`Failed to sync ngrok URL: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  console.log('Watching ngrok tunnels and syncing Frontend/src/config/api.ts...');

  await syncNgrokUrl().catch((error) => {
    console.log(`Waiting for ngrok tunnel... (${error.message})`);
  });

  setInterval(async () => {
    try {
      await syncNgrokUrl();
    } catch {
      // Keep watching until tunnel is available again.
    }
  }, WATCH_INTERVAL_MS);
};

run();
