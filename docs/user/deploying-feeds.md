# Deploying GTFS Feeds to OTP

Assumptions:

* [X] You have [loaded a GTFS feed into a project](./managing-projects-feeds.md).
* [X] You have a deployment server available [(example: AWS)](./add-deployment-server.md).
* [X] [An osm-lib server has been set up](https://github.com/conveyal/osm-lib) for Data Tools to fetch Open Streets Map (OSM) data.

## Executing a deployment

To deploy or update GTFS feeds to OTP:

1. Open a project.
2. Click on the `Deployments` tab.
3. (Optional) To create a new deployment, click `+ New Deployment`, enter a name, then press or click Enter.
4. Click the name of the deployment to execute. A summary of feeds and existing deployments (if available) are shown for your review.
5. Remove the feeds you don't need from the deployment. For the remaining feeds, select the correct feed version.
6. In the `OTP Configuration` pane:
 * Select the latest OTP version (the first one in the list).
 * Check `Build graph only` to only generate and output a graph file on EC2 to the S3 server (no OTP server will be running after the graph is generated).
 * The R5 option is not used.
7. If you select `Custom` under `Build configuration` or `Router configuration`, enter the desired configuration settings.
8. Click the `Deploy` dropdown at the top of the main pane, then pick the server on which to perform the deployment. Existing deployments on that server will be discarded.

## Updating the Custom Places Index

A GTFS feed's stops can be sent to a Custom Places Index, should one be set up. You'll need the secret Webhook URL of your Custom Places Index server.

Only a pinned deployment's feed can be sent to a Custom Places Index. When opening a pinned deployment, a `Custom Geocoder Settings` pane appears below the `OTP Configuration` pane. In the text field, paste in the secret Webhook URL for your Custom Places Index server. Once it's entered, the `Update Custom Geocoder` checkbox will be clickable. If it is checked, your Custom Places Index will be updated when deploying the feed.

The pane also has an option to upload Custom POI CSV files. These files contain special landmarks and coordinates which are prioritized when returning geocoder results. You can upload as many custom CSV files as you like. They will all be added to the Custom Places Index.

## Watching deployments take place

After click Deploy, you can watch the deployment progress from the right-hand panel:

1. The data bundle is uploaded to S3.
2. One EC2 server is commissioned.
3. The EC2 server downloads data and begins building the graph.
4. The EC2 server uploads the graph to S3.
 - If you check `Build graph only`, the process stops here and EC2 server is discarded.
5. The OTP process is started on EC2 to load graph.
6. If more EC2 servers are designated, these will be started and told to download and load graph.
