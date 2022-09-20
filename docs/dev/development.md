# Development
These instructions should allow you to get Data Tools / Editor / Catalogue up and running within an integrated development environment, allowing you to work on the code and debug it. We all use IntelliJ so instructions will currently be only for that environment.
## Components
The system is made up of two different projects:

- https://github.com/catalogueglobal/datatools-ui the Javascript frontend
- https://github.com/catalogueglobal/datatools-server the Java-based backend

You'll need to clone both of these repos locally.
The backend (datatools-server) depends on another library called gtfs-lib, which we have been heavily modifying. So rather than automatically including that library as a dependency in the backend build, you'll want to clone that repo as well so you can see and edit its source code. It's at: https://github.com/conveyal/gtfs-lib

NOTE: to work on the current development code, check out the `sql-editor` branch of all three repositories once they are cloned.

## Back end
In order to work on the backend and/or on gtfs-lib, which it depends on for storing and retrieving GTFS data, you'll need to add these to a project in the IDE. We use IntelliJ IDEA. The free community edition has all the features we need.
Once you have already cloned the datatools-server and gtfs-lib Github repositories, you need to add both of these as two different "modules" to a single "project" in IntelliJ (see below). Rather than the datatools-server build fetching the pre-built gtfs-lib from the Maven central repository, we are going to configure it to use your local copy of the library, incorporating any changes you make into the build.

First, create a new Project in IntelliJ: **File -> New -> Project from existing sources**. Select the POM file pom.xml in the cloned datatools-server repository. This will import it as a Maven project. Click through all the import pages leaving the defaults untouched. You now have an IntelliJ project with one module: datatools-server.

Next, add gtfs-lib as another module to this new project already containing datatools-backend. There are multiple ways to do this, including **File -> New -> Module From Existing Sources** but we'll use the Maven Projects tool window: **View -> Tool Windows -> Maven Projects**. In this pane, click the green plus button at the top. In the Select Path dialog that pops up, choose the pom.xml file in the gtfs-lib you just cloned. Again click through all the pages accepting the defaults. You should now have one IntelliJ project with two Maven modules.

You will then need to modify the POM of datatools-backend to ensure that it includes your local copy of gtfs-lib rather than one fetched from Maven Central. The key thing is to make sure the version numbers match, i.e. that the version of gtfs-lib listed as a dependency in datatools-backend matches the version of gtfs-lib declared in the POM of your local copy of gtfs-lib. Once the version numbers match, hit the refresh button ("reload" icon) on the IntelliJ Maven tool window to recompute the dependencies.

To start up the backend, use a run configuration inside the IDE rather than building and running a JAR file on the command line. In IntelliJ go to **Run -> Edit configurations**, click the plus button and choose Application. Specify the following settings:
- Main class: `com.conveyal.datatools.manager.DataManager`
- VM options: `-Xmx4G`
- Program arguments: `/path/to/your/env.yml /path/to/your/server.yml`

After running this configuration, the Java application should be running at [http://localhost:4000](http://localhost:4000) (or some other port that you specified).

## Front end

We use Conveyal's front-end JS tool-belt [`mastarm`](https://github.com/conveyal/mastarm) to build, run, and lint while developing.
To kick off a development server at [http://localhost:9966](http://localhost:9966):

```
yarn start
```

This will use `mastarm` to run a `browserify` server at the above port, along with a proxy for the back-end API, which is assumed to be running on `http://localhost:4000`.

To specify your own configuration that overrides the defaults:

```
yarn start -- --config /path/to/config
```

## E2E tests

The e2e tests have been Dockerized, which allows them to be run easily anywhere `docker-compose` works. To run them on localhost, first create a `.env` file in the `__tests__/e2e`. `docker-compose` will alert you as to which variables must be present.

To run the tests, run `docker-compose -f docker-compose.yml up --abort-on-container-exit` in the `__tests__/e2e/` directory.
