'use strict';

const Hapi = require('hapi');
const Sequelize = require('sequelize');
const HSequelize = require('hapi-sequelize');
const Good = require('good');
const Hoek = require('hoek');

const chalk = require('chalk');
const { Line } = require('clui');
const ora = require('ora');

// CLI pretty things
const blankLine = new Line().fill();
const pluginsSpinner = ora('Loading plugins');
const modelsSpinner = ora('Models synchronization');
const fixturesSpinner = ora('Loading fixtures');
const serverSpinner = ora('Starting server');

/**
 * Constructor for the StarterKit object.
 */
module.exports = function StarterKit() {
  this.config = null;
  this.server = null;
  this.initialized = false;

  /**
   * Initializes the Hapi server with the config parameter.
   * @param {Object} config - Configuration object for the Hapi server
   * @param {string} config.server.host - Hapi server host
   * @param {integer} config.server.port - Hapi server port
   * @param {string} config.database.name - Database instance name
   * @param {string} config.database.credentials.dbName - Database name (connection)
   * @param {string} config.database.credentials.user - Database user
   * @param {string} config.database.credentials.pass - Database password
   * @param {string} config.database.credentials.dialect - Database type (mysql, posqtgres, ...)
   * @param {string} config.database.credentials.host - Database connection host
   * @param {integer} config.database.credentials.port - Database connection port
   * @param {boolean} config.database.syncForce - Whether to reload the database each time the server restarts.
   * @param {Object} config.good - Config object for the Good plugin (logs)
   */
  this.init = config => {
    if (!config) {
      throw new Error(`The config parameter is mandatory.`);
    }

    Hoek.assert(this.initialized === false, 'You should call init() only once.');
    const server = new Hapi.Server();

    // Server configuration
    server.connection({
      host: config.server.host,
      port: config.server.port,
      routes: {
        cors: { additionalExposedHeaders: ['Content-Disposition'] },
        files: {
          relativeTo: __dirname,
        },
      },
    });

    this.config = config;
    this.server = server;
    this.initialized = true;

    return server;
  };

  /**
   * Registers the provided plugins and starts the Hapi server.
   * @param {Array} [plugins] - An array of plugins to register in the Hapi server. Default [].
   * @param {function} [loadFixtures] - An async function that loads the fixtures (must return a Promise object). Default null.
   */
  this.start = (plugins = [], loadFixtures = null) => {
    Hoek.assert(this.initialized === true, 'init() must be called before start().');

    blankLine.output();
    pluginsSpinner.start();

    // By default, we use the Sequelize plugin to handle database transactions.
    const mergedPlugins = [
      {
        register: HSequelize,
        options: {
          name: this.config.database.name,
          sequelize: new Sequelize(
            this.config.database.credentials.dbName,
            this.config.database.credentials.user,
            this.config.database.credentials.pass,
            {
              dialect: this.config.database.credentials.dialect,
              host: this.config.database.credentials.host,
              port: this.config.database.credentials.port,
            }
          ),
          models: ['lib/**/model.js', 'lib/**/models/*.js'],
        },
      },
      // Logger config
      {
        register: Good,
        options: this.config.good,
      },
    ].concat(plugins);

    return this.server
      .register(mergedPlugins)
      .catch(err => {
        pluginsSpinner.fail(`Loading plugins: ${err.stack}`);
        blankLine.output();

        process.exit(4); // eslint-disable-line no-process-exit
      })
      .then(() => {
        pluginsSpinner.succeed();

        blankLine.output();
        modelsSpinner.start();

        const db = this.server.plugins['hapi-sequelize'][this.config.database.name];

        // Reload the database when the server is restarted (only in dev mode).
        return db.sequelize.sync({ force: this.config.database.syncForce });
      })
      .catch(err => {
        modelsSpinner.fail(`Models synchronization: ${err.stack}`);
        blankLine.output();

        process.exit(2); // eslint-disable-line no-process-exit
      })
      .then(() => {
        // Success callback for the db.sequelize.sync() function call above.
        modelsSpinner.succeed();

        blankLine.output();
        fixturesSpinner.start();

        if (this.config.database.syncForce === true && loadFixtures !== null) {
          return loadFixtures();
        }

        return null;
      })
      .catch(({ stderr }) => {
        fixturesSpinner.fail(`Loading fixtures: ${stderr}`);
        process.exit(3); // eslint-disable-line no-process-exit
      })
      .then(() => {
        if (this.config.database.syncForce === true) {
          fixturesSpinner.succeed();
        } else {
          fixturesSpinner.warn();
        }

        blankLine.output();
        serverSpinner.start();

        return this.server.start();
      })
      .then(() => {
        serverSpinner.succeed(
          chalk`Server started on port : [{yellowBright ${this.config.server.port}}]`
        );
        blankLine.output();
      })
      .catch(err => {
        serverSpinner.fail(`Started server with errors: ${err.stack}`);
        blankLine.output();

        process.exit(5); // eslint-disable-line no-process-exit
      });
  };
};
