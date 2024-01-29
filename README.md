# datatools-ui

[![Join the chat at https://matrix.to/#/#transit-data-tools:gitter.im](https://badges.gitter.im/repo.png)](https://matrix.to/#/#transit-data-tools:gitter.im)

The core application for IBI Group's TRANSIT-Data-Tools suite. This application provides GTFS editing, management, validation, and deployment to OpenTripPlanner.

## Quick Start

A pre-configured datatools instance can be lauched via Docker by running

```bash
cd docker
cp ../configurations/default/env.yml.tmp ../configurations/default/env.yml
docker-compose up
```

from the datatools-ui directory. Datatools will then be running on port `9966`.

Deployment functionality will not work, and persistence may only work in certain cases (look into Docker volumes for more info).

## Configuration

This repository serves as the front end UI for the Data Manager application. It must be run in conjunction with [datatools-server](https://github.com/conveyal/datatools-server)

## Documentation

View the [latest release documentation](http://data-tools-docs.ibi-transit.com/en/latest/) at ReadTheDocs for more info on deployment and development as well as a user guide.

Note: `dev` branch docs (which refer to the default `branch` and are more up-to-date and accurate for most users) can be found [here](http://data-tools-docs.ibi-transit.com/en/dev/).

## Getting in touch

We have a Gitter [space](https://matrix.to/#/#transit-data-tools:gitter.im) for the full TRANSIT-Data-Tools project where you can post questions and comments.

## Shoutouts 🙏

<img src="browserstack-logo-600x315.png" height="80" title="BrowserStack Logo" alt="BrowserStack Logo" />

Big thanks to [BrowserStack](https://www.browserstack.com) for letting the maintainers use their service to debug browser issues.

<img src="https://www.graphhopper.com/wp-content/uploads/2018/03/graphhopper-logo-small.png" height="25" alt="GraphHopper Logo" />

Street snapping powered by the <a href="https://www.graphhopper.com/">GraphHopper API</a>.
