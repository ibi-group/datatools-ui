# Searching for Routes and Stops

## Overview

Both the Service Alerts Manager and eTID Configuration Manager contain the Route/Stop Search Panel, which allows users to easily find transit routes and stops using either text search or through a map view. This panel can be used

## Agency Filter

The Route/Stop Search Panel allows searching within only the agencies for which a user has permission to create alerts or eTID configurations. If a user has permission for multiple agencies, the Search Panel allows for filtering out agencies in order to further refine the search results and more quickly locate a route or stop.

![Agency filter](/img/agency-filter.png "Alerts Viewer")

The image above shows the Route/Stop Search Panel on the righthand side of the screen. Users can filter agencies with the following actions:

1. By clicking the **Searching XX** button, users can individually turn on/off agencies to include in the search.
2. If the user has access to a large number of agencies, she can click **Remove All** (if at least one agency is selected) or **Add All** (if no agencies are selected) to quickly remove/add all agencies to the search.

## Filter Routes or Stops

In addition to filtering out agencies, users can also specify whether to search for:

1. just routes,
2. just stops or
3. both routes and stops.

The **Searching stops and routes** button can be clicked to toggle between these options. The filter will apply to both text searches and results displayed on the map.

### Searching for Routes

Users can search for routes by **name** using the text search. The search will extend to both the `route_short_name` and `route_long_name` GTFS fields for a route.

When searching via the map interface, the user must zoom into the map in order to view routes for a given area. Any route that passes through the map bounds should appear as an option. Routes will be colored according to the `route_color` GTFS field (if applicable). Routes can be selected by clicking on the line corresponding to the route.

**Note**: many routes have more than one shape or geometry, also known as a trip pattern. For display on the map, a single trip pattern is chosen. So there may be cases where the route shown on the map differs slightly from the expected shape.

![Search for routes/stops by name or on the map](/img/gtfs-map-search-alert.png "Search for routes/stops by name or on the map")  

### Searching for Stops

Users can search for stops by **name** and **ID** using the text search. The search will extend to both the `stop_code` (defaults to `stop_id` if `stop_code` is not available) and `stop_name` GTFS fields for a stop.

When searching via the map interface, the user must zoom into the map in order to view stops for a given area. Stops can be selected by clicking on the marker corresponding to the stop location.

![Search for routes/stops by name or on the map](/img/gtfs-map-search-config.png "Search for routes/stops by name or on the map")  
