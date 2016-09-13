'use strict';
const container = require('../../index');
module.exports = container.wrap(water);

function water() {
  return 'water';
};