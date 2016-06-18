'use strict';
const _ = require('lodash');
const joi = require('joi');
const argumentParser = require('./argument-parser');

let services = {};
let factories = {};
let instances = {};
let interfaces = {};

const SCHEMA_SERVICE = joi.object({
  factory: joi.func().required(),
  dependencies: joi.array().required()
}).required();

module.exports = Object.freeze({  
  service,
  factory,
  iface,
  get: get,
  reset
});

function service() {
  const args = Array.from(arguments);
  const serviceName = argumentParser.getName(args);
  const dependencies = argumentParser.getDependencies(args);
  const factory = argumentParser.getFactory(args);
  joi.assert(serviceName, joi.string().required(), 'Service name missing!');
  joi.assert(dependencies, joi.array().items(joi.string()), 'Dependencies must be string name of services!');
  joi.assert(factory, joi.func().required(), 'Implementation missing!');
  setService(serviceName, factory, dependencies);
  return serviceName;
}

function setService(serviceName, factory, dependencies) {
  _.set(services, serviceName, {
    factory,
    dependencies
  });
}

function addImplementation(interfaceName, serviceName) {
  const implementations = getImplementations(interfaceName);
  implementations.push(serviceName);
  _.set(interfaces, interfaceName, _.uniq(implementations));
}

function getImplementations(interfaceName) {
  return _.get(interfaces, interfaceName, []);
}

function factory() {
  const serviceName = service.apply(null, Array.from(arguments));
  _.set(factories, serviceName, true);
  return serviceName;
}

function get(serviceName) {
  joi.assert(_.get(services, serviceName), SCHEMA_SERVICE, serviceName + ' service definition missing!');
  return _.get(instances, serviceName, () => constructInstance(serviceName))();
}

function iface(interfaceName, serviceName) {
  setService(interfaceName, () => _.partial(interfaceFactory, interfaceName), []);
  addImplementation(interfaceName, serviceName);
}

function interfaceFactory(interfaceName, serviceName) {
  const implementations = getImplementations(interfaceName);
  const SCHEMA_INTERFACES = joi.array().sparse().items(joi.string().valid(serviceName)).required(); 
  joi.assert(implementations, SCHEMA_INTERFACES, `There is no implementations for ${interfaceName}!`);
  return get(serviceName);
}

function constructInstance(serviceName) {
  const dependencyInstances = services[serviceName].dependencies.map(get);
  const serviceInstance = services[serviceName].factory.apply(null, dependencyInstances);
  return factories[serviceName] === true ? 
    serviceInstance : storeInstance(serviceName, serviceInstance);
}

function storeInstance(serviceName, serviceInstance) {
  _.set(instances, serviceName, () => serviceInstance);
  return serviceInstance;
}

function reset() {
  services = {};
  factories = {};
  instances = {};
  interfaces = {};
}

