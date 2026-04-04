const { execSync, spawn } = require('child_process');
const http = require('http');

const APP_ID = 'com.flexora';
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const runBestEffort = (command, description) => {
  try {
    console.log(`\n[android-dev] ${description}`);
    execSync(command, { stdio: 'inherit' });
  } catch {
    console.log(`[android-dev] Skipped: ${description}`);
  }
};

const isMetroRunning = () => {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8081/status', (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve(res.statusCode === 200 && body.includes('packager-status:running'));
      });
    });

    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

const start = async () => {
  runBestEffort('adb start-server', 'Starting ADB server');
  runBestEffort('adb reverse tcp:8081 tcp:8081', 'Binding device to Metro (tcp:8081)');
  runBestEffort(
    `adb shell monkey -p ${APP_ID} -c android.intent.category.LAUNCHER 1`,
    'Launching installed app'
  );

  if (await isMetroRunning()) {
    console.log('\n[android-dev] Metro already running on port 8081.');
    console.log('[android-dev] App launched without reinstall.');
    return;
  }

  console.log('\n[android-dev] Starting Metro...');
  const metro = spawn(npmCmd, ['run', 'start'], {
    stdio: 'inherit',
    shell: isWindows,
  });

  metro.on('exit', (code) => {
    process.exit(code ?? 0);
  });
};

start();
