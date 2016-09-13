'use strict';
const hypodi = require('../index');

const seq = {
  bottledBeer : 0,
  bottle      : 0,
  beer        : 0,
  water       : 0,
  malt        : 0
};

function bottledBeer(bottle, beer) {
  ++seq.bottledBeer;
  return seq;
}

function bottle() {
  return ++seq.bottle;
}

function beer(water, malt) {
  return ++seq.beer;
}

function water() {
  return ++seq.water;
}

function malt() {
  return ++seq.malt;
}

hypodi.factory('bottledBeer', ['bottle', 'beer'], bottledBeer);
hypodi.factory('bottle', bottle);

// They are uncountable, let's make them singleton
hypodi.service('beer', ['water', 'malt'], beer);
hypodi.service('water', water);
hypodi.service('malt', malt);

hypodi.service('beer', ['water', 'malt'], beer);

// Get the instance from the hypodi
const beer1 = hypodi.get('bottledBeer');
console.log(beer1);
// { bottledBeer: 1, bottle: 1, beer: 1, water: 1, malt: 1 }

const beer2 = hypodi.get('bottledBeer');
console.log(beer2);
// { bottledBeer: 2, bottle: 2, beer: 1, water: 1, malt: 1 }}

hypodi.get('water');
hypodi.get('malt');
hypodi.get('bottle');
hypodi.get('bottle');
const beer3 = hypodi.get('bottledBeer');
console.log(beer3);
// { bottledBeer: 3, bottle: 5, beer: 1, water: 1, malt: 1 }