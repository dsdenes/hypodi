'use strict';

require('./water');
require('./malt');
const beer = require('./beer');

const aBeer = beer();
console.log(aBeer);