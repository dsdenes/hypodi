'use strict';
const container = require('../index');

const bottleConfig = () => Object.freeze({
  waterType: 'cleanedWater'
});

function bottle(config, water) {
  const myWater = water(config.waterType);
  return Object.freeze({
    waterType: myWater.type
  });
}

function cleanedWater() {
  return Object.freeze({
    type: 'cleaned'
  });
}

function boiledWater() {
  return Object.freeze({
    type: 'boiled'
  });
}

container.service('config', bottleConfig);
container.service('cleanedWater', cleanedWater);
container.service('cleanedWater', cleanedWater);
container.service('boiledWater', boiledWater);
container.iface('water', 'cleanedWater');
container.iface('water', 'boiledWater');
container.service('bottle', ['config', 'water'], bottle);

// Get the instance from the container
const theBottle = container.get('bottle');
console.log(theBottle.waterType === 'cleaned'); // true