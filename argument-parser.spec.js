'use strict';
const argumentParser = require('./argument-parser');
const expect = require('chai').expect;

describe('argument-parser', () => {

  it('should parse name argument', () => {
    expect(argumentParser.getName([])).to.eql(undefined);
    expect(argumentParser.getName([1])).to.eql(1);
    expect(argumentParser.getName([1, 2, 3])).to.eql(1);
  });

  it('should parse dependency arguments', () => {
    expect(argumentParser.getDependencies([])).to.eql([]);
    expect(argumentParser.getDependencies([1])).to.eql([]);
    expect(argumentParser.getDependencies([1, () => {}])).to.eql([]);
    expect(argumentParser.getDependencies([1, []])).to.eql([]);
  });

  it('should parse factory argument', () => {
    expect(argumentParser.getFactory([])).to.eql(undefined);
    expect(argumentParser.getFactory([1])).to.eql(undefined);
    const fnc = () => {};
    expect(argumentParser.getFactory([1, fnc])).to.eql(fnc);
    expect(argumentParser.getFactory([1, []])).to.eql(undefined);
    expect(argumentParser.getFactory([1, [], fnc])).to.eql(fnc);
  });

});