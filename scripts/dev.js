const path = require('path');
const concurrently = require('concurrently');

const root = path.resolve(__dirname, '..');

concurrently(
  [
    { command: 'npm run start:dev', name: 'server', cwd: path.join(root, 'examples/server'), prefixColor: 'blue' },
    { command: 'npm run dev', name: 'client', cwd: path.join(root, 'examples/client'), prefixColor: 'green' },
  ],
  { prefix: 'name', killOthersOn: ['failure'] },
);
