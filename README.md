HypoDI is a di container for node.

## Features
* Singleton services
* Factories (providers)
* Interfaces (api will change)
* Self register (experimental)
* Hot-reload (experimental)

## Install
```
npm install hypodi
```

```
const hypodi = require('hypodi'); 
```

## Service
```
hypodi.service('beer', ['water', 'malt'], beerFactory);
hypodi.get('beer')
```

## Factory
```
hypodi.factory('bottle', bottleFactory);
const bottle1 = hypodi.get('bottle');
const bottle2 = hypodi.get('bottle');
```

## Interfaces
```
hypodi.factory('greenBottle', greenBottleFactory);
hypodi.factory('blueBottle', blueBottleFactory);
hypodi.iface('bottle', 'greenBottle')
hypodi.iface('bottle', 'blueBottle')
const aGreenBottle = hypodi.get('bottle')('greenBottle');
```