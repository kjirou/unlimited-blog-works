const path = require('path');

require('ts-node').register({
  project: path.join(__dirname, '../tsconfigs/cli-debug.json'),
});
