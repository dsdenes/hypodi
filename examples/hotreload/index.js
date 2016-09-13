'use strict';
const _ = require('lodash');
//const Proxy = require('proxy-polyfill');

function f1() {
  return {
    type: () => 1
  };
}

function f2() {
  return {
    type: () => 2
  };
}

function f3() {
  return () => 1;
}

function f4() {
  return () => 2;
}

function f5() {
  return () => 3;
}

const inst1 = reloadable(f1());
console.log(inst1.type());
inst1.__reload(f2());
console.log(inst1.type());

const inst2 = reloadable(f3());
console.log(inst2());
inst2({
  __reload: f4()
});
console.log(inst2());
inst2({
  __reload: f5()
});
console.log(inst2());

function reloadable(iface) {
  if (_.isFunction(iface)) {
    return proxyScopeFunc();
  } else if (_.isPlainObject(iface)) {
    return _.assign({}, _.mapValues(iface, proxyScopeMethod), {
      __reload: (newIface) => (iface = newIface)
    });
  } else if (!_.isPlainObject(iface) && _.isObjectLike(iface)) {
    // proxy get
  }

  function proxyScopeFunc() {
    return function() {
      const args = Array.from(arguments);
      if (_.isObject(args[0]) && typeof args[0].__reload !== 'undefined') {
        iface = args[0].__reload;
      } else {
        return iface.apply(null, args);
      }
    };
  }

  function proxyScopeMethod(func, method) {
    return () => iface[method].apply(null, Array.from(arguments));
  }
}