# Routes
In GTFS, a route is a group of trips that follow one or more patterns and operate throughout a service day. It is identified by a unique route_id and contains information such as the route name, type, and operating agency. For more information, view the [GTFS specification route reference](https://gtfs.org/schedule/reference/#routestxt)

## Editing/Creating Routes

To begin editing routes, click the bus (🚍) button on the lefthand navigation bar.

<img src="https://datatools-builds.s3.amazonaws.com/docs/patterns/edit-routes.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px; width: 600px;">

Choose a route from the list or search by route name in the dropdown. To create a new route, click `New route` or `+ Create first route` if this is the first route being created. 

### Zoom to route extents
Clicking the 🔍 button (in the top toolbar) with a route selected adjusts the map view to show the entire route (i.e., all patterns) you are editing.

## Route details

The following fields are required before you can hit `Save and Continue`:

- **Status:** Takes the following values: 
    - **In-Progress:** Showing a route has not been completely entered
    - **Pending Approval:** A route has all the information entered and is awaiting a senior person to sign it off
    - **Approved:** All the above stages have been completed
- **Publicly Visible?** This must be set to "Yes" for the route to be included in a GTFS output. 
- **route_id:** An identifier for the route. A randomly generated ID is provided by default.
- **route_short_name:** Name of the service/route, this may just be a number
- **route_long_name:** The full name of the route, often including the origin and destination
- **route_type:** The type of vehicle/transport used on the route

The following fields are optional:

- **agency_id:** The agency identifier from the defined agencies. Generally this field is automatically populated. 
- **route_desc:** A description of the route, do not simply repeat the information in ‘Long name’
- **route_sort_order:** Orders the routes for presentation to GTFS consumers. Routes with smaller route_sort_order values should be displayed first
- **route_url:** A link to a webpage with information on the specific route, such as the timetable
- **route_color:** If a route has a color (for use in trip planners etc) it can be assigned here
- **route_text_color:** If a route has a text color (for use in trip planners etc) it can be assigned here
- **Is route wheelchair accessible?** Either "Yes", "No", or "No Information"
- **Route branding URL:** A link to a webpage with route branding information
- **Route branding asset:** A route image

Once all the required fields and any of the desired optional fields are filled in, click `Save`.

**Note:** as with all newly created items (except patterns), the new route will not be saved until the save icon (💾) is clicked.


## Trip Patterns

Once you've created and saved a route, you can then begin creating trip patterns for the route.

[Learn about editing trip patterns »](patterns)

### Tutorial Video: Editing/Creating Routes
This video provides a step-by-step demonstration of how to edit or create a route.

<iframe 
    width="560" 
    height="315" 
    src="https://www.youtube.com/embed/WWm_FDmuMsY" 
    frameborder="0" 
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen>
</iframe>
