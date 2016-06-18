'use strict';
const _ = require('lodash');

module.exports = Object.freeze({
  getName(args) {
    return args[0];
  },
  getDependencies(args) {
    return _.isArray(args[1]) ? args[1] : [];
  },
  getFactory(args) {
    return _.isArray(args[1]) ? args[2] : args[1];
  }
});