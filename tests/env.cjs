// Shared settings for the browser test scripts, so they run on any machine and in CI.
//
//   CHROME_PATH    Chrome or Chromium to drive (defaults to the usual install path for this OS)
//   BASE_URL       where the app is served (default http://localhost:5173, the Vite dev server)
//   ARTIFACTS_DIR  where screenshots are saved (default: a studyverse-test-artifacts folder in the temp directory)
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_CHROME = {
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome',
}[process.platform];

const CHROME_PATH = process.env.CHROME_PATH || DEFAULT_CHROME;
const BASE_URL = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || path.join(os.tmpdir(), 'studyverse-test-artifacts');
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

// in CI there is no GPU: draw WebGL in software so the 3D campus still renders
const CHROME_ARGS = process.env.CI ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [];

module.exports = { CHROME_PATH, BASE_URL, ARTIFACTS_DIR, CHROME_ARGS };
