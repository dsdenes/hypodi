'use strict';
const globby = require('globby');
module.exports = () => {
  const files = globby.sync(['**/*.js', '**/*.json', '!**/*.spec.js', '!node_modules/**/*', '!build/**/*']);
  files.unshift({ pattern: 'node_modules/chai/chai.js', instrument: false });
  files.unshift({ pattern: 'node_modules/chai-as-promised/lib/chai-as-promised.js', instrument: false });

  return {
    files,
    tests: globby.sync(['**/*.spec.js', '!node_modules/**/*', '!build/**/*']),
    bootstrap: function (wallaby) {
      let chai = require('chai');
      let chaiAsPromised = require('chai-as-promised');
      chai.use(chaiAsPromised);
      require('co-mocha')(wallaby.testFramework.constructor);
      let mocha = require('mocha');
      require('co-mocha')(mocha);
    },
    env: {
      type:   'node'
    },
    testFramework: 'mocha',
    slowTestThreshold: 200,
    debug: false
  };
};
