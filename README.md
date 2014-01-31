## Overview
Neon is a technology-agnostic composition framework for data and visualizations in a common browser-based display and interaction environment.  It facilitates the development of rich data exploration applications through domain-specific combinations of generic, reusable components.

Neon consists of two components:
* The Data Access API is a database-agnostic abstraction layer for executing queries using a SQL-like language. This allows developers to focus on developing their applications without getting bogged down by the database-specific constructs.  Neon queries can be specified through a JavaScript library or RESTful endpoints, which provides maximum flexibility for developers.
* The Interaction API provides a way for disparate components to communicate with each other about user actions so that developers can orchestrate complex, interactive visualizations using components that are completely decoupled from each other.

## External Dependencies
In order to build Neon from source, you must install:

* MongoDB
  Mongo is one of the database systems that Neon supports. Mongo (version 2.4+ is required) can be downloaded at the following link: http://www.mongodb.org/downloads.
* Nodejs/npm
  Node.js and npm are used to build the javascript code
  Instructions for installing nodejs (version 0.10.17+ is required) can be found at the following link: https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager.
  Instructions for installing npm (version 1.3.10+ is required) can be found at the following link:
  https://github.com/isaacs/npm.

## Building Neon

Once the external dependencies are installed, one may build Neon with:

>gradlew clean build

This task compiles the source code, runs the unit tests, executes static code quality checks, and builds war files for deployment.

## Testing Neon

Neon is extensively tested. The following gradle tasks can be invoked for additional testing beyond the unit tests:

* gradlew acceptanceTest - (requires mongodb) Runs end-to-end acceptance tests. One must create a gradle.properties file that has a mongo.hosts property that points to his or her mongo instance. See gradle.properties.sample for an example.
* gradlew integrationTest - (requires mongodb and shark) Runs integration tests against the existing data sources. In addition to the mongo.hosts property, one must set the hdfs.url and hive.host properties. Installation for shark can be found here: https://github.com/amplab/shark/wiki
* gradlew gatling - (requires mongodb and shark) Runs multi-user concurrency tests.

## Deploying Neon

Building neon will create neon.war, which hosts the Data Access and Integration APIs as well as a war for each widget. The widgets are visualizations that make use of the Neon APIs.
One may deploy neon.war and the widget war files to their favorite application server. One must set the NEON_SERVER property in gradle.properties to the location of that server. Then invoke the following command to deploy the wars:

>gradlew deployToTomcat

## Documentation
Neon contains groovy and javascript API documentation, which can be generated by gradle tasks.

* gradlew groovydoc - Creates the groovy API documentation at /neon-server/build/docs/javadocs/index.html
* gradlew jsDocs - Creates the javascript API documentation at /neon-server/build/docs/jsdocs/index.html

## Additional Information

Email: neon-support@nextcentury.com

Wiki: [Neon Developer's Guide](https://github.com/NextCenturyCorporation/neon/wiki)

Copyright 2013 Next Century Corporation