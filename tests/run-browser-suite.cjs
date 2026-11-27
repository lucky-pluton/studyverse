// Runs the browser test scripts that CI relies on, one after another, against BASE_URL.
// A script fails if it exits with an error or prints a failure line (some older scripts log
// failures without setting an exit code). Usage: BASE_URL=http://localhost:4173 node tests/run-browser-suite.cjs
const { spawnSync } = require('child_process');
const path = require('path');

const SUITE = [
  'test_campus_explorer_experience', // 2D map: hover, walk, enter every study spot
  'test_open_all_places_3d', // every study spot opens from the 3D campus
  'test_three_campus_prototype', // the 3D campus loads and responds
  'test_focus_timer_master', // Pomodoro timer edge cases
  'test_stopwatch_and_layout', // stopwatch, timer independence, mobile layout
  'test_chat_shared_reports', // two reports hide a chat message for everyone
];
const FAILURE = /^\s*(FAIL\b|FAILED\b|❌)|SOME (TESTS|CHECKS) FAILED|ONE OR MORE FAILURES/im;

let failed = 0;
for (const name of SUITE) {
  const start = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, `${name}.cjs`)], { encoding: 'utf8', timeout: 300000, env: process.env });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const ok = r.status === 0 && !FAILURE.test(out);
  const secs = Math.round((Date.now() - start) / 1000);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${secs}s)`);
  if (!ok) {
    failed++;
    console.log(out.split('\n').slice(-40).join('\n'));
  }
}
console.log(failed ? `\n${failed} of ${SUITE.length} browser suites failed` : `\nAll ${SUITE.length} browser suites passed`);
process.exit(failed ? 1 : 0);
