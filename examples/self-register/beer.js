'use strict';
const container = require('../../index');
module.exports = container.wrap(beer, ['water', 'malt']);
  
function beer(water, malt) {
  return {
    water,
    malt
  };
}