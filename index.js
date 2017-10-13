'use strict';

const Hapi = require('hapi');
const Sequelize = require('sequelize');
const HSequelize = require('hapi-sequelize');
const Good = require('good');

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
 * Returns an object containing a Hapi server and the startServer() method.
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
 * 
 * @param {Array} plugins - An array of plugins to register in the Hapi server.
 * @param {function} loadFixtures - An async function that loads the fixtures (must return a Promise object).
 */
module.exports = (config, plugins, loadFixtures) => {
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

  const main = {
    server,
    startServer,
  };

  // So that next call to this module can ommit the config parameter.
  module.exports = main;
  return main;

  /**
   * Inits and starts the server.
   */
  function startServer() {
    blankLine.output();
    pluginsSpinner.start();

    // By default, we use the Sequelize plugin to handle database transactions.
    const mergedPlugins = [
      {
        register: HSequelize,
        options: {
          name: config.database.name,
          sequelize: new Sequelize(
            config.database.credentials.dbName,
            config.database.credentials.user,
            config.database.credentials.pass,
            {
              dialect: config.database.credentials.dialect,
              host: config.database.credentials.host,
              port: config.database.credentials.port,
            }
          ),
          models: ['lib/**/model.js', 'lib/**/models/*.js'],
        },
      },
      // Logger config
      {
        register: Good,
        options: config.good,
      },
    ].concat(plugins);

    return server
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

        const db = server.plugins['hapi-sequelize'][config.database.name];

        // Reload the database when the server is restarted (only in dev mode).
        return db.sequelize.sync({ force: config.database.syncForce });
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

        if (config.database.syncForce === true) {
          return loadFixtures();
        }

        return null;
      })
      .catch(({ stderr }) => {
        fixturesSpinner.fail(`Loading fixtures: ${stderr}`);
        process.exit(3); // eslint-disable-line no-process-exit
      })
      .then(() => {
        if (config.database.syncForce === true) {
          fixturesSpinner.succeed();
        } else {
          fixturesSpinner.warn();
        }

        blankLine.output();
        serverSpinner.start();

        return server.start();
      })
      .then(() => {
        serverSpinner.succeed(
          chalk`Server started on port : [{yellowBright ${config.server.port}}]`
        );
        blankLine.output();
      })
      .catch(err => {
        serverSpinner.fail(`Started server with errors: ${err.stack}`);
        blankLine.output();

        process.exit(5); // eslint-disable-line no-process-exit
      });
  }
};
