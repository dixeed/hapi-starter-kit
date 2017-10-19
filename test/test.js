/* eslint-disable no-unused-expressions */
'use strict';

const chai = require('chai');
const expectToBeAPromise = require('expect-to-be-a-promise');

chai.use(expectToBeAPromise);

const { expect } = chai;
const StarterKit = require('../index');

const config = {
  server: { host: 'localhost', port: '8895' },
  database: {
    name: 'mainDb',
    syncForce: false,
    credentials: {
      dbName: 'database',
      user: 'username',
      pass: 'password',
      dialect: 'sqlite',
    },
  },
  good: {
    ops: { interval: false },
    reporters: {
      consoleReporter: [],
    },
  },
};

describe('hapi-starter-kit', () => {
  it('should be a constructor', () => {
    expect(StarterKit).to.be.an('function');
    expect(new StarterKit()).to.be.an('object');
  });

  it('should provide an init() method', () => {
    const starterKit = new StarterKit();
    expect(starterKit).to.have.property('init');
    expect(starterKit.init).to.be.a('function');
  });

  it('should provide a start() method', () => {
    const starterKit = new StarterKit();
    expect(starterKit).to.have.property('start');
    expect(starterKit.start).to.be.a('function');
  });

  describe('#init()', () => {
    let starterKit = null;

    beforeEach(() => {
      starterKit = new StarterKit();
    });

    it('should throw if no config parameter is provided', () => {
      expect(starterKit.init).to.throw(Error, 'The config parameter is mandatory.');
    });

    it('should throw if called more than once', () => {
      starterKit.init(config);

      expect(() => starterKit.init(config)).to.throw('You should call init() only once.');
    });

    it('should set the config, server and sequelize objects', () => {
      const resultingConfig = Object.assign({}, config);

      // Default config if not provided.
      resultingConfig.database.modelPaths = ['lib/**/model.js', 'lib/**/models/*.js'];

      starterKit.init(config);
      expect(starterKit.config).to.deep.equal(resultingConfig);
      expect(starterKit.server).to.be.an('object');
      expect(starterKit.sequelize).to.be.an('object');
    });
  });

  describe('#start()', () => {
    let starterKit = null;

    beforeEach(() => {
      starterKit = new StarterKit();
      starterKit.init(config);
    });

    it('should return a Promise', () => {
      const result = starterKit.start();
      expect(result).to.be.a.promise;

      return result;
    });

    it('should start the Hapi server', () => {
      const result = starterKit.start().then(() => {
        expect(starterKit.server.info.started).to.not.equal(0);
        expect(starterKit.server.info.port).to.equal(8895);
        expect(starterKit.server.info.host).to.equal('localhost');
      });

      return result;
    });

    afterEach(done => {
      starterKit.server.stop({ timeout: 0 }).then(done, done);
    });
  });
});
