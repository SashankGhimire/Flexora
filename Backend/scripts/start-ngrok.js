const { spawn } = require('child_process');
const http = require('http');

const HEALTH_PATH = '/api/health';
const PRIMARY_BACKEND_PORT = 5000;
const MAX_BACKEND_PORT_SCAN = 5020;
const PROBE_TIMEOUT_MS = 700;
const WAIT_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 1000;

const probePort = (port) => {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: HEALTH_PATH,
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      },
      (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          if (response.statusCode !== 200) {
            resolve(false);
            return;
          }

          try {
            const payload = JSON.parse(body);
            resolve(payload?.service === 'flexora-backend' && payload?.status === 'ok');
          } catch {
            resolve(false);
          }
        });
      }
    );

    request.setTimeout(PROBE_TIMEOUT_MS, () => {
      request.destroy(new Error('Request timeout'));
      resolve(false);
    });

    request.on('error', () => resolve(false));
  });
};

const findActivePort = async () => {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;

  while (Date.now() <= deadline) {
    for (let port = PRIMARY_BACKEND_PORT; port <= MAX_BACKEND_PORT_SCAN; port += 1) {
      // eslint-disable-next-line no-await-in-loop
      if (await probePort(port)) {
        return port;
      }
    }

    if (Date.now() > deadline) {
      break;
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return null;
};

const main = async () => {
  const port = await findActivePort();

  if (!port) {
    console.error(`No running Flexora backend found on ports ${PRIMARY_BACKEND_PORT}-${MAX_BACKEND_PORT_SCAN}. Start the backend first.`);
    process.exit(1);
  }

  console.log(`Starting ngrok on backend port ${port}...`);

  const ngrokProcess = spawn('ngrok', ['http', String(port), '--pooling-enabled'], {
    stdio: 'inherit',
    shell: true,
  });

  ngrokProcess.on('exit', (code, signal) => {
    if (signal) {
      process.exit(1);
      return;
    }

    process.exit(code ?? 0);
  });
};

main().catch((error) => {
  console.error(`Failed to start ngrok: ${error.message}`);
  process.exit(1);
});