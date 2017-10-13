/* eslint-disable no-unused-expressions */
'use strict';

const chai = require('chai');
const expectToBeAPromise = require('expect-to-be-a-promise');

chai.use(expectToBeAPromise);

const { expect } = chai;
const starterKit = require('../index');

describe('hapi-starter-kit', () => {
  it('should be a function', () => {
    expect(starterKit).to.be.a('function');
  });
});
