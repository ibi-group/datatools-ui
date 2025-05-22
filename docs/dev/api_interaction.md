# API Interaction
The following is a set of instructions on API calls needed to upload and validate
a feed, wait for the tasks' completion, and then browse its contents. All of the
endpoints needed to load and process a GTFS file are REST-based. The endpoints
used to explore a feed's contents (i.e., retrieve routes, stops, trips, etc.)
or its validation issues are [GraphQL](http://graphql.org/)-based.

NOTE: for all curl commands shown below, be sure to replace `$your_auth_token`
with a valid [Auth0 access token](https://auth0.com/docs/tokens/access-token).
The server is assumed to be hosted at `http://localhost:4000`.

## Creating a project and feed source
Before loading GTFS into the application, a feed source (and its containing
project) must exist to load the first feed version into.

### Create a project
Send a POST request to create a project. A project needs at minimum a `name`
field.

```
curl 'http://localhost:4000/api/manager/secure/project' \
  -H 'Authorization: Bearer $your_auth_token' -H 'Content-Type: application/json' \
  -H 'Accept: application/json' --data-binary '{"name":"Test project"}'
```

### Create a feed source
Send a POST request to create a feed source. Like a project, a feed source also
needs a `name` field as well as a `projectId` (this should be the same value as
the newly created project's `id` field).

```
curl 'http://localhost:4000/api/manager/secure/feedsource' \
  -H 'Authorization: Bearer $your_auth_token' -H 'Content-Type: application/json' \
  -H 'Accept: application/json' --data-binary '{"name":"Test feed source", "projectId": "$your_project_id"}'
```

## Creating a new feed version
There are multiple ways to create a feed version (uploading a GTFS zip file,
triggering a fetch from a URL, publishing from the GTFS editor, etc.). However,
the instructions that follow describe the two simplest methods: 1) uploading a zip file
directly and 2) fetching a zip file by URL.

Each time a feed version is created, a series of standard steps are run on the
GTFS: 1) loading the feed into the SQL database and 2) validating the feed.
There is a simple way to monitor the progress of the tasks, described below.

### GTFS retrieval methods
### Uploading a GTFS file
Once a feed source has been created, a GTFS file can be uploaded as a new feed
version. The following POST command should supply `feedSourceId` and optionally
`lastModified` (in milliseconds since epoch) in order to preserve the file's
timestamp if so desired. Note: the content type must be `application/zip` and
the `/path/to/gtfs.zip` must be supplied with the `-T` or `--upload-file` curl
argument.

```
curl 'http://localhost:4000/api/manager/secure/feedversion?feedSourceId=$your_feed_source_id&lastModified=$last_modified' \
  -X POST -H 'Authorization: Bearer $your_auth_token' \
  -H 'Content-Type: application/zip' -T /path/to/gtfs.zip
```

### Fetching by URL
In order to fetch a GTFS file by URL, you must first modify the feed source so
that it contains a valid, publicly-accessible URL string in the `url` field (supplying
this field when creating the feed source is OK, too).

```
curl 'http://localhost:4000/api/manager/secure/feedsource/$your_feed_source_id' -X PUT \
  -H 'Authorization: Bearer $your_auth_token' -H 'Content-Type: application/json' \
  -H 'Accept: application/json' --data-binary '{"url":"http://example.com/gtfs.zip"}'
```

Once the feed source has this property, you can trigger a fetch by making the following
POST request:

```
curl 'http://localhost:4000/api/manager/secure/feedsource/$your_feed_source_id/fetch' \
  -X POST -H 'Authorization: Bearer $your_auth_token' -H 'Accept: application/json'
```

Note: if a version already exists for the feed source and the file found at the fetch URL
has not been modified since the latest version, no new version will be created and the
job status message (see below) will indicate as such.

### Following the progress of the upload/fetch
When a successful upload or fetch request is made, the response will be:

```
{
  jobId: "5d750796-9eb1-4edd-8dfe-0ee6b8cf3c80",
  message: "Feed version is processing."
}
```

This `jobId` can be used to monitor the progress of the feed processing using
the job status HTTP endpoint. All asynchronous server jobs can be similarly
monitored. An indicator that the job is asynchronous is when this `jobId` is
returned in the response. To monitor the single job's progress, use the following
curl GET command:

```
curl 'http://localhost:4000/api/manager/secure/status/jobs/$job_id' \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -H 'Authorization: Bearer $your_auth_token'
```

The job status response looks like the following JSON object:

```
{
  "name": "Processing GTFS for Test feed source",
  "type": "PROCESS_FEED",
  "parentJobId": null,
  "parentJobType": null,
  "status":
    {
      "message": "Processing...",
      "exceptionType": null,
      "exceptionDetails": null,
      "completed": false,
      "error": false,
      "uploading": true,
      "name": null,
      "percentComplete": 66.66666666666667,
      "startTime": 0,
      "duration": 0,
      "initialized": "2018-02-08T19:43:25.712",
      "modified": "2018-02-08T19:43:25.712",
      "completedName": null
    },
  "jobId": "a28ce430-3e06-440e-8e8e-f783efc97f3c",
  "feedVersionId": "test-20180208T194325-05-abefd3f7-3fd1-497a-b171-c2b9adc4e5e1.zip",
  "feedSourceId": "abefd3f7-3fd1-497a-b171-c2b9adc4e5e1"
}
```

Note: Once a status request is made and the returned job status object indicates
that it is complete or has errored, the server will "clean up" the completed job
by removing it from the list of active jobs.

It may also be useful to view all active jobs for the user because often a single
job (e.g., PROCESS_FEED) is composed of more than one chained jobs (LOAD_FEED and
VALIDATE_FEED). To view all jobs for the user, the following curl GET request
should be made (the same request but with no $job_id parameter supplied):

```
curl 'http://localhost:4000/api/manager/secure/status/jobs' \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -H 'Authorization: Bearer $your_auth_token'
```

Note: the same condition for removal of completed jobs applies to this endpoint.

## Viewing the resulting feed version and its contents
After successfully uploading the GTFS file, the new feed version will be saved
into the application database. It can be retrieved by using the `feedVersionId`
value found in the job JSON object returned from the status endpoint OR
requesting all feed versions for your feed source.

### Retrieving a single feed version
Note: the feed version ID parameter must be supplied.

```
curl 'http://localhost:4000/api/manager/secure/feedversion/$your_feed_version_id' \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -H 'Authorization: Bearer $your_auth_token'
```

### Retrieving all versions for a feed source
Note: the feed source ID query parameter must be supplied.

```
curl 'http://localhost:4000/api/manager/secure/feedversion?feedSourceId=$your_feed_source_id' \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -H 'Authorization: Bearer $your_auth_token'
```

## Viewing feed summary information and validation issues

### Validation and load summary results
The feed version object contains `validationResult` and `feedLoadResult` fields,
each of which contains high-level summaries of any validation issues or errors
encountered during processing of the GTFS feed, the number of rows found for
each table, and some service summary information (e.g., feed bounds and daily
seconds of transit service by mode).

### Exploring feed contents and validation issues (GraphQL)
To view validation issues found for a GTFS feed, you will need to make GraphQL
requests to `http://localhost:4000/api/manager/graphql` and **always** supply the
`namespace` field found in the feed version object.

Below are some sample GraphQL queries for fetching GTFS entities and
load/validation result information for particular GTFS feeds.

When fetching sets of entities or validation errors, a default `limit` of
`50` (with `offset=0`) is applied to all queries unless otherwise
specified. Here is a list of additional optional params for each category:

- Validation errors: `namespace`, `error_type`
- GTFS entities
 - Routes: `route_id`
 - Stops: `stop_id`
 - Trips: `trip_id` and `route_id`
 - Stop Times: (none)
 - Services: `service_id`

#### Request a pattern for a feed with its stops and trips (and the trips' stop_times).
```
query ($namespace: String, $pattern_id: String) {
  feed(namespace: $namespace) {
    feed_id
    feed_version
    filename
    patterns (pattern_id: [$pattern_id]) {
      pattern_id
      route_id
      stops {
        stop_id
      }
      trips {
        trip_id
        pattern_id
        stop_times {
          stop_id
          trip_id
        }
      }
    }
  }
}
```

#### Request a route for a feed with its trips.
```
query ($namespace: String, $route_id: String) {
  feed(namespace: $namespace) {
    feed_id
    feed_version
    filename
    routes (route_id: [$route_id]) {
      route_id
      route_type
      trips {
        trip_id
        route_id
      }
    }
  }
}
```

#### Request a route for a feed with its patterns and the patterns' trips.
```
query ($namespace: String, $route_id: String) {
  feed(namespace: $namespace) {
    feed_id
    feed_version
    filename
    routes (route_id: [$route_id]) {
      route_id
      route_type
      patterns {
        pattern_id
        route_id
        trips {
          trip_id
          pattern_id
        }
      }
    }
  }
}
```

### Request all routes for a feed.
```
query ($namespace: String) {
  feed(namespace: $namespace) {
    feed_id
    feed_version
    filename
    routes {
      route_id
      route_type
    }
  }
}
```

### Request validation errors
Note: a list of the validation error types and their English language
descriptions can be found in the [`NewGtfsErrorType.java`](https://github.com/conveyal/gtfs-lib/blob/master/src/main/java/com/conveyal/gtfs/error/NewGTFSErrorType.java)
class in [conveyal/gtfs-lib](https://github.com/conveyal/gtfs-lib).

```
query ($namespace: String) {
  feed(namespace: $namespace) {
    feed_id
    feed_version
    filename
    ## Optional params for errors are namespace, error_type, limit, and offset
    errors {
      error_id
      error_type
      entity_type
      line_number
      entity_id
      entity_sequence
      bad_value
    }
  }
}
```

### Request tables and errors count
Note: a list of the validation error types and their English language
descriptions can be found in the [`NewGtfsErrorType.java`](https://github.com/conveyal/gtfs-lib/blob/master/src/main/java/com/conveyal/gtfs/error/NewGTFSErrorType.java)
class in [conveyal/gtfs-lib](https://github.com/conveyal/gtfs-lib).

```
query ($namespace: String) {
  feed(namespace: $namespace) {
    feed_id
    feed_version
    filename
    row_counts {
      stops
      stop_times
      trips
      routes
      calendar
      calendar_dates
      errors
    }
    error_counts {
      type
      count
    }
  }
}
```
