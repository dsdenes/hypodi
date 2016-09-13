'use strict';
const container = require('../../index');
module.exports = container.wrap(malt);

function malt() {
  return 'malt';
};