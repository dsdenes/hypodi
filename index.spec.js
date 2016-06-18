'use strict';
const contadi = require('./index');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const sinon = require('sinon');
const _ = require('lodash');

describe('contadi', () => {
  
  beforeEach(() => {
    contadi.reset();
  });

  it('should throw if there is no parameter', () => {
    expect(contadi.service).to.throw(Error);
  });

  it('should throw if there is no implementation', () => {
    expect(_.partial(contadi.service, 'beer')).to.throw(Error);
  });

  it('should throw if the factory isnt a function', () => {
    expect(_.partial(contadi.service, 'beer', 'notAFunction')).to.throw(Error);
  });
  
  it('should throw when there are dependencies but no implementation', () => {
    expect(_.partial(contadi.service, 'beer', [])).to.throw(Error);
  });

  it('should throw when there is no registered servie', () => {
    expect(_.partial(contadi.get, 'thereisnosuch')).to.throw(Error);
  });

  it('should register and get a services without dependencies', () => {
    const beerFactory = sinon.stub();
    contadi.service('beer', beerFactory);
    contadi.get('beer');
    assert(beerFactory.calledOnce);
  });

  it('should reset services', () => {
    contadi.service('beer', () => {});
    contadi.reset();
    expect(_.partial(contadi.get, 'beer')).to.throw(Error);
  });

  it('should register and get a service with an empty dependency lists', () => {
    const beerFactory = sinon.stub();
    contadi.service('beer', [], beerFactory);
    contadi.get('beer');    
    assert(beerFactory.calledOnce);
  });
  
  it('should throw when getting a service that has dependency which isnt defined', () => {
    contadi.service('beer', ['depen'], () => {});
    expect(_.partial(contadi.get, 'beer')).to.throw(Error);
  });

  it('should get a service with dependencies', () => {
    const beerFactory = sinon.spy();
    const waterFactory = () => 42;
    const maltFactory = () => 43;
    contadi.service('water', waterFactory);
    contadi.service('malt', maltFactory);
    contadi.service('beer', ['water', 'malt'], beerFactory);
    contadi.get('beer');
    assert(beerFactory.calledOnce);
    assert(beerFactory.calledWith(42, 43));
  });
  
  it('should be singleton with services', () => {
    const beerFactory = sinon.spy();
    contadi.service('beer', beerFactory);
    contadi.get('beer');
    contadi.get('beer');
    contadi.get('beer');
    assert(beerFactory.calledOnce);
  });
  
  it('should construct factories every time', () => {
    const bottleFactory = sinon.spy();
    contadi.factory('bottle', bottleFactory);
    contadi.get('bottle');
    contadi.get('bottle');
    contadi.get('bottle');
    assert(bottleFactory.calledThrice);
  });
  
  describe('interfaces', () => {
    
    it('should be able to register a service as implementation for an interface', () => {
      const greenBottle = sinon.spy(() => 1);
      contadi.service('greenBottle', greenBottle);
      contadi.iface('bottle', 'greenBottle');
      expect(contadi.get('bottle')('greenBottle')).to.eql(1);
      expect(contadi.get('bottle')('greenBottle')).to.eql(1);
      assert(greenBottle.calledOnce);
    });
    
  });
  
});