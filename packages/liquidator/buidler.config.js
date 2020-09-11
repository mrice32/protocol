const { getBuidlerConfig } = require("@umaprotocol/common");

const path = require("path");

// Project root should be the core dependendency directory.
const projectRoot = path.dirname(require.resolve("@umaprotocol/core/package.json"));

// Test directory should be the test directory just below this config file.
const testDir = path.join(__dirname, "test");

const configOverride = {
  paths: {
    root: projectRoot,
    tests: testDir
  }
};

module.exports = getBuidlerConfig(configOverride);
