<div align="center">
  <h1>Hapi-starter-kit</h1>

  <strong>A starter kit for Dixeed's projects using HapiJs server.</strong>

</div>

<hr>

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Build Status](https://travis-ci.org/dixeed/hapi-starter-kit.svg?branch=master)](https://travis-ci.org/dixeed/hapi-starter-kit.svg)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/MIT)

## Disclaimer
**This project is made to be used in Dixeed's projects thus its configuration may not suit every needs.**

## Requirements
- Nodejs >= 6.11.4
- Sequelize 3, not 4 (hapi-sequelize is currently stuck with Sequelize 3)
- Store all your database models under 'lib/../model.js' or 'lib/../models/*.js'

## Usage
```javascript
const StarterKit = require('@dixeed/hapi-starter-kit');
const loadFixtures = require('./fixtures');

const starterKit = new StarterKit();

// We initialize the server with some options.
starterKit.init({
  server: {
    host: 'localhost',          // Hapi server host
    port: 8890,                 // Hapi server port
  },
  database: {
    name: 'mainDb'              // Database instance name within Hapi. /!\ Different from the actual database name
    syncForce: true,            // Whether to reload the models each time the server restarts.
    modelPaths: [               // An array of path from where to load the Sequelize Models.
      'lib/**/model.js',        // Default to ['lib/**/model.js', 'lib/**/models/*.js']
      'lib/**/models/*.js'
    ],
    credentials: {
      dbName: 'myproject_db'    // Database name
      user: 'root',             // User that will access the database
      pass: 'password',         // Password of the database user
      dialect: 'postgres',      // Which database engine you're using (mysql, postgres, sqlite, ...)
      host: 'localhost',        // The host of the database
      port: '5432',             // The port on which run your database
    },
  },
  good: {}                      // Config object for the Good plugin (logs)
});

// Register your plugins when starting the server.
starterKit.start([
  require('./lib/company'),
  require('./lib/user'),
  require('./lib/setting'),
  // ...
], loadFixtures).then(() => {
  // Do your thing !
});

// As init() returns an instance of itself, we can chain the calls:
starterKit.init(config)
  .start(plugins, loadFixtures)
  .then(() => {
    // ...
  });
```
**For the Database config, please report to the Sequelize 3 documentation as this package is using Sequelize as well as Hapi-Sequelize.**

## The StarterKit object
### Properties
- starterKit.config: The loaded configuration.
- starterKit.server: The Hapi server instanciated by the call to `init()`.
- starterKit.sequelize: The Sequelize instance instanciated by the call to `init()`.
- starterKit.initialized: A boolean specifying whether the object was initialized (i.e `init()` was called).
### Methods
- init(config): returns an instance of the starterKit.
- start(plugins, loadFixtures): returns a Promise resolved after the plugins registration, the model loading and optionaly the fixtures loading.

## Documentation for .start()
The start function is used to:
- register Hapi plugins
- load the models
- and load the fixtures if an appropriate method is provided

Signature of the method:
```̀javascript
starterKit.start(plugins: Array<pluginDefinition>, loadFixtures: AsyncFunc): Promise
```

The documentation on Hapi plugin definition can be found on the [Hapi website](https://hapijs.com/tutorials/plugins).

## Contributing
This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automatically handle semver bumps based on the commits messages.

To simplify commits messages redaction you can use `npm run cm` instead of `git commit`. To use that command make sure to `git add` your changes before.

This repo is configured to forbid commit messages that do not follow the [Angular conventional changelog commit message format](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit).
