const path = require("path");

require("ts-node").register({
  files: true,
  project: path.join(__dirname, "../tsconfig-test.json"),
});
