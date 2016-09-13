'use strict';
const hypodi = require('./index');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const sinon = require('sinon');
const _ = require('lodash');

describe('hypodi', () => {
  
  beforeEach(() => {
    hypodi.reset();
  });

  it('should throw if there is no parameter', () => {
    expect(hypodi.service).to.throw(Error);
  });

  it('should throw if there is no implementation', () => {
    expect(_.partial(hypodi.service, 'beer')).to.throw(Error);
  });

  it('should throw if the factory isnt a function', () => {
    expect(_.partial(hypodi.service, 'beer', 'notAFunction')).to.throw(Error);
  });
  
  it('should throw when there are dependencies but no implementation', () => {
    expect(_.partial(hypodi.service, 'beer', [])).to.throw(Error);
  });

  it('should throw when there is no registered servie', () => {
    expect(_.partial(hypodi.get, 'thereisnosuch')).to.throw(Error);
  });

  it('should register and get a services without dependencies', () => {
    const beerFactory = sinon.stub();
    hypodi.service('beer', beerFactory);
    hypodi.get('beer');
    assert(beerFactory.calledOnce);
  });
  
  it('should show service registered', () => {
    const beerFactory = sinon.stub();
    expect(hypodi.registered('beer')).to.eql(false);
    hypodi.service('beer', beerFactory);
    expect(hypodi.registered('beer')).to.eql(true);
  });

  it('should reset services', () => {
    hypodi.service('beer', () => {});
    hypodi.reset();
    expect(_.partial(hypodi.get, 'beer')).to.throw(Error);
  });

  it('should register and get a service with an empty dependency lists', () => {
    const beerFactory = sinon.stub();
    hypodi.service('beer', [], beerFactory);
    hypodi.get('beer');    
    assert(beerFactory.calledOnce);
  });
  
  it('should throw when getting a service that has dependency which isnt defined', () => {
    hypodi.service('beer', ['depen'], () => {});
    expect(_.partial(hypodi.get, 'beer')).to.throw(Error);
  });

  it('should get a service with dependencies', () => {
    const beerFactory = sinon.spy();
    const waterFactory = () => 42;
    const maltFactory = () => 43;
    hypodi.service('water', waterFactory);
    hypodi.service('malt', maltFactory);
    hypodi.service('beer', ['water', 'malt'], beerFactory);
    hypodi.get('beer');
    assert(beerFactory.calledOnce);
    assert(beerFactory.calledWith(42, 43));
  });
  
  it('should be singleton with services', () => {
    const beerFactory = sinon.spy();
    hypodi.service('beer', beerFactory);
    hypodi.get('beer');
    hypodi.get('beer');
    hypodi.get('beer');
    assert(beerFactory.calledOnce);
  });
  
  it('should construct factories every time', () => {
    const bottleFactory = sinon.spy();
    hypodi.factory('bottle', bottleFactory);
    hypodi.get('bottle');
    hypodi.get('bottle');
    hypodi.get('bottle');
    assert(bottleFactory.calledThrice);
  });
  
  describe('interfaces', () => {
    
    it('should be able to register a service as implementation for an interface', () => {
      const greenBottle = sinon.spy(() => 1);
      hypodi.service('greenBottle', greenBottle);
      hypodi.iface('bottle', 'greenBottle');
      expect(hypodi.get('bottle')('greenBottle')).to.eql(1);
      expect(hypodi.get('bottle')('greenBottle')).to.eql(1);
      assert(greenBottle.calledOnce);
    });
    
  });
  
  describe('wrap', () => {

    it('throws error if no parameter', () => {
      expect(hypodi.wrap).to.throw(Error);
    });

    it('throws error if the factory isn\'t a named function', () => {
      expect(_.partial(hypodi.wrap, () => {})).to.throw(Error);
    });

    it('allows to register a service with an implementation, but no dependencies', () => {
      hypodi.wrap(function test() {});
      expect(hypodi.registered('test')).to.eql(true);
    });

    it('allows to register a service with an implementation and dependencies', () => {
      hypodi.wrap(function test1() {}, []);
      hypodi.wrap(function test2() {}, ['dep1', 'dep2']);
      expect(hypodi.registered('test1')).to.eql(true);
      expect(hypodi.registered('test2')).to.eql(true);
    });

    it('allows to register a service and load its dependencies', () => {
      const bottleSpy = sinon.spy();
      function bottle() { return bottleSpy(); }
      const water = sinon.spy();
      const malt = sinon.spy();
      hypodi.service('water', water);      
      hypodi.service('malt', malt);      
      const getBeer = hypodi.wrap(bottle, ['water', 'malt']);
      getBeer();
      assert(bottleSpy.calledOnce);
      assert(water.calledOnce);
      assert(malt.calledOnce);
    });

  });
  
  describe('change', () => {
    
    it('should throw if change called without paremeter', () => {
      expect(hypodi.change).to.throw(Error);
    });

    it('should throw if change called with service name', () => {
      expect(_.partial(hypodi.change, 'test')).to.throw(Error);
    });
    
    it('should change service implementation', () => {
      const factory = sinon.spy();
      const dep1 = sinon.spy();
      hypodi.service('dep1', dep1);
      hypodi.service('test', ['dep1'], () => {});
      hypodi.change('test', factory);
      hypodi.get('test');
      assert(factory.calledOnce);
      assert(dep1.calledOnce);
    });
    
    it('should change service implementation if getting again', () => {
      hypodi.service('test', () => 1);
      hypodi.get('test');
      hypodi.change('test', () => 2);
      expect(hypodi.get('test')).to.eql(2);
    });

    it('should reload dependencies', () => {
      hypodi.service('test', () => 1);
      hypodi.service('test', () => 1);
      hypodi.get('test');
      hypodi.change('test', () => 2);
      expect(hypodi.get('test')).to.eql(2);
    });

  });
});