'use strict';

const _ = require('lodash');
const joi = require('joi');
const argumentParser = require('./argument-parser');

let services = {};
let factories = {};
let instances = {};
let reverseDependencies = {};
let interfaces = {};

const SCHEMA_SERVICE = joi.object({
  factory: joi.func().required(),
  dependencies: joi.array().required()
}).required();

function service() {
  const args = Array.from(arguments);
  const serviceName = argumentParser.getName(args);
  const dependencies = argumentParser.getDependencies(args);
  const factory = argumentParser.getFactory(args);
  joi.assert(serviceName, joi.string().required(), 'Service name missing!');
  joi.assert(dependencies, joi.array().items(joi.string()), 'Dependencies must be string name of services!');
  joi.assert(factory, joi.func().required(), 'Implementation missing!');
  setService(serviceName, factory, dependencies);
  hotReloadInstances(serviceName);
  reloadDepending(serviceName);
  return serviceName;
}

function registered(serviceName) {
  const valid = joi.validate(services[serviceName], SCHEMA_SERVICE);
  return (valid.error === null); 
}

function hotReloadInstances(serviceName) {
  if (_.has(instances, serviceName)) {
    _.get(instances, serviceName);
  }
}

function reloadDepending(serviceName) {
  const dependingServices = getReverseDependencies(serviceName);
  for (let dependingService of dependingServices) {
    if (_.has(instances, dependingService)) {
      constructServiceInstance(dependingService);
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

function addReverseDependency(dependencyName, serviceName) {
  const reverseDeps = getReverseDependencies(dependencyName);
  reverseDeps.push(serviceName);
  _.set(reverseDependencies, dependencyName, _.uniq(reverseDeps));
}

function getReverseDependencies(dependencyName) {
  return _.get(reverseDependencies, dependencyName, []);
}

function factory() {
  const serviceName = service.apply(null, Array.from(arguments));
  _.set(factories, serviceName, true);
  return serviceName;
}

function get(serviceName) {
  joi.assert(_.get(services, serviceName), SCHEMA_SERVICE, serviceName + ' service definition missing!');
  return _.get(instances, serviceName, () => constructServiceInstance(serviceName))();
}

function iface(interfaceName, serviceName) {
  setService(interfaceName, () => _.partial(interfaceFactory, interfaceName), []);
  addImplementation(interfaceName, serviceName);
}

function wrap(factory, dependencies) {
  joi.assert(factory, joi.func().required(), 'The factory must be a pure function!');
  joi.assert(factory.name, joi.string().required(), 'The factory has to have a name!');
  service(factory.name, dependencies || [], factory);
  return () => get(factory.name);
}

function change(serviceName, factory) {
  joi.assert(factory, joi.func().required(), 'The factory must be a pure function!');
  joi.assert(serviceName, joi.string().required(), 'The service name has to be a string!');
  const deps = _.get(services, serviceName).dependencies;
  service.apply(null, [serviceName, deps, factory]);
  reloadServiceIfExists(serviceName);
}

function interfaceFactory(interfaceName, serviceName) {  
  const implementations = getImplementations(interfaceName);
  const SCHEMA_INTERFACES = joi.array().items(joi.string().valid(serviceName).required(), joi.any()).required(); 
  joi.assert(implementations, SCHEMA_INTERFACES, `There is no implementation for ${interfaceName}!`);
  return get(serviceName);
}

function constructServiceInstance(serviceName) {
  const dependencies = _.get(services, serviceName, {}).dependencies || [];
  const dependencyInstances = dependencies.map(get);
  const serviceInstance = _.get(services, serviceName, {}).factory.apply(null, dependencyInstances);
  return factories[serviceName] === true ? 
    serviceInstance : storeServiceInstance(serviceName, serviceInstance, dependencies);
}

function storeServiceInstance(serviceName, serviceInstance, dependencies) {
  dependencies.map(dependencyName => addReverseDependency(dependencyName, serviceName));
  _.set(instances, serviceName, () => serviceInstance);
  return serviceInstance;
}

function reset() {
  services = {};
  factories = {};
  instances = {};
  interfaces = {};
}

module.exports = Object.freeze({
  service,
  registered,
  factory,
  iface,
  wrap,
  change,
  get: get,
  reset
});


