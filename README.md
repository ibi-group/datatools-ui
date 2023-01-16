# datatools-ui

The core application for IBI Group's transit Data Tools suite. This application provides GTFS editing, management, validation, and deployment to OpenTripPlanner.

## Configuration

This repository serves as the front end UI for the Data Manager application. It must be run in conjunction with [datatools-server](https://github.com/conveyal/datatools-server)

## Documentation

View the [latest release documentation](http://data-tools-docs.ibi-transit.com/en/latest/) at ReadTheDocs for more info on deployment and development as well as a user guide.

Note: `dev` branch docs (which refer to the default `branch` and are more up-to-date and accurate for most users) can be found [here](http://data-tools-docs.ibi-transit.com/en/dev/).

## Shoutouts 🙏

<img src="browserstack-logo-600x315.png" height="80" title="BrowserStack Logo" alt="BrowserStack Logo" />

Big thanks to [BrowserStack](https://www.browserstack.com) for letting the maintainers use their service to debug browser issues.

<img src="https://www.graphhopper.com/wp-content/uploads/2018/03/graphhopper-logo-small.png" height="25" alt="GraphHopper Logo" />

Street snapping powered by the <a href="https://www.graphhopper.com/">GraphHopper API</a>.

## How to start application (backend + frontend)

1. Start `conveyal-datatools-server`
2. Download from 1password the file `WRI-CONVEYAL-GTFS: env.yml (prod)` and place it at `conveyal-datatools-ui/configurations/default/env.yml`
3. Start frontend
    ```sh
    make run
    ```
4. Check the application running at `http://localhost:5000/`

## How to deploy

1. Download from 1password the file `WRI-CONVEYAL-GTFS: env.yml (prod)` and place it at `./configurations/default/env.yml`
3. Install the [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
4. Setup your aws credentials
    1. Run `aws configure --profile wri-prod`
    2. Grab the values from 1password item `aws - wri-prod`
    3. Example: 
        ```
        AWS Access Key ID [None]: AKI...
        AWS Secret Access Key [None]: Ux...
        Default region name [None]: 
        Default output format [None]: 
        ```
3. Run `make deploy-wri-prod`