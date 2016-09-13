'use strict';

var _ = require('lodash');
var joi = require('joi');
var argumentParser = require('./argument-parser');

var services = {};
var factories = {};
var instances = {};
var reverseDependencies = {};
var interfaces = {};

var SCHEMA_SERVICE = joi.object({
  factory: joi.func().required(),
  dependencies: joi.array().required()
}).required();

function service() {
  var args = Array.from(arguments);
  var serviceName = argumentParser.getName(args);
  var dependencies = argumentParser.getDependencies(args);
  var factory = argumentParser.getFactory(args);
  joi.assert(serviceName, joi.string().required(), 'Service name missing!');
  joi.assert(dependencies, joi.array().items(joi.string()), 'Dependencies must be string name of services!');
  joi.assert(factory, joi.func().required(), 'Implementation missing!');
  setService(serviceName, factory, dependencies);
  hotReloadInstances(serviceName);
  reloadDepending(serviceName);
  return serviceName;
}

function registered(serviceName) {
  var valid = joi.validate(services[serviceName], SCHEMA_SERVICE);
  return valid.error === null;
}

function hotReloadInstances(serviceName) {
  if (_.has(instances, serviceName)) {
    _.get(instances, serviceName);
  }
}

function reloadDepending(serviceName) {
  var dependingServices = getReverseDependencies(serviceName);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = dependingServices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var dependingService = _step.value;

      if (_.has(instances, dependingService)) {
        constructServiceInstance(dependingService);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

function reloadServiceIfExists(serviceName) {
  if (_.has(instances, serviceName)) {
    constructServiceInstance(serviceName);
  }
}

function setService(serviceName, factory, dependencies) {
  _.set(services, serviceName, {
    factory: factory,
    dependencies: dependencies
  });
}

function addImplementation(interfaceName, serviceName) {
  var implementations = getImplementations(interfaceName);
  implementations.push(serviceName);
  _.set(interfaces, interfaceName, _.uniq(implementations));
}

function getImplementations(interfaceName) {
  return _.get(interfaces, interfaceName, []);
}

function addReverseDependency(dependencyName, serviceName) {
  var reverseDeps = getReverseDependencies(dependencyName);
  reverseDeps.push(serviceName);
  _.set(reverseDependencies, dependencyName, _.uniq(reverseDeps));
}

function getReverseDependencies(dependencyName) {
  return _.get(reverseDependencies, dependencyName, []);
}

function factory() {
  var serviceName = service.apply(null, Array.from(arguments));
  _.set(factories, serviceName, true);
  return serviceName;
}

function get(serviceName) {
  joi.assert(_.get(services, serviceName), SCHEMA_SERVICE, serviceName + ' service definition missing!');
  return _.get(instances, serviceName, function () {
    return constructServiceInstance(serviceName);
  })();
}

function iface(interfaceName, serviceName) {
  setService(interfaceName, function () {
    return _.partial(interfaceFactory, interfaceName);
  }, []);
  addImplementation(interfaceName, serviceName);
}

function wrap(factory, dependencies) {
  joi.assert(factory, joi.func().required(), 'The factory must be a pure function!');
  joi.assert(factory.name, joi.string().required(), 'The factory has to have a name!');
  service(factory.name, dependencies || [], factory);
  return function () {
    return get(factory.name);
  };
}

function change(serviceName, factory) {
  joi.assert(factory, joi.func().required(), 'The factory must be a pure function!');
  joi.assert(serviceName, joi.string().required(), 'The service name has to be a string!');
  var deps = _.get(services, serviceName).dependencies;
  service.apply(null, [serviceName, deps, factory]);
  reloadServiceIfExists(serviceName);
}

function interfaceFactory(interfaceName, serviceName) {
  var implementations = getImplementations(interfaceName);
  var SCHEMA_INTERFACES = joi.array().items(joi.string().valid(serviceName).required(), joi.any()).required();
  joi.assert(implementations, SCHEMA_INTERFACES, 'There is no implementation for ' + interfaceName + '!');
  return get(serviceName);
}

function constructServiceInstance(serviceName) {
  var dependencies = _.get(services, serviceName, {}).dependencies || [];
  var dependencyInstances = dependencies.map(get);
  var serviceInstance = _.get(services, serviceName, {}).factory.apply(null, dependencyInstances);
  return factories[serviceName] === true ? serviceInstance : storeServiceInstance(serviceName, serviceInstance, dependencies);
}

function storeServiceInstance(serviceName, serviceInstance, dependencies) {
  dependencies.map(function (dependencyName) {
    return addReverseDependency(dependencyName, serviceName);
  });
  _.set(instances, serviceName, function () {
    return serviceInstance;
  });
  return serviceInstance;
}

function reset() {
  services = {};
  factories = {};
  instances = {};
  interfaces = {};
}

module.exports = Object.freeze({
  service: service,
  registered: registered,
  factory: factory,
  iface: iface,
  wrap: wrap,
  change: change,
  get: get,
  reset: reset
});