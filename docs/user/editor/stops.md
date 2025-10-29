# Stops

## Editing stops

To begin editing stops, click the map marker icon button on the lefthand navigation bar (outlined in red).

![edit-stops](https://datatools-builds.s3.amazonaws.com/docs/stops/edit-stops.png)

### Selecting a stop

Choose a stop from the list or search by stop name in the dropdown.

You can also **zoom into the map** while the stop list is visible and once you're close enough you'll begin to see stops displayed. Click one to begin editing its details.

### Creating a stop

To create a new stop, **right-click on the map** in the location you would like to place the stop. 

**Note:** as with all newly created items (except patterns), the new stop will not be saved until the save icon (💾) is clicked.

### Editing a stop
Once a stop is created or selected, the following parameters are required:
- **Stop ID (`stop_id`):** Identifies a stop, station, or station entrance.
- **Location (`stop_lat/stop_lon`):** These are defined by latitude and longitude. **Note:** Stop locations should have an error of no more than four meters when compared to the actual stop position.

Optionally, additional parameters can be included such as:
- **Stop Code (`stop_code`):** A short code that uniquely identifies a stop for passengers.
- **Stop Name (`stop_name`):** The name of the location for a stop.
- **Stop Description (`stop_desc`):** A description providing additional information about the stop.
- **Zone ID (`zone_id`):** The fare zone for a stop.
- **Stop Timezone (`stop_timezone`):** Timezone of the stop.
- **Level ID (`level_id`):** Level of the location.
- **Platform Code (`platform_code`):** Code that identifies the platform for a stop. Used with stations that have multiple platforms.
- **Parent Station (`parent_station`):** Defines the hierarchy of stops in `stops.txt`.
- **Wheelchair Boarding (`wheelchair_boarding`):** A value (0, 1, or 2) that identifies whether wheelchair boardings are possible at the stop.

### Moving a stop

To move a selected stop, **click and drag the stop to the new location**. Or, if you already know the latitude and longitude coordinates, you can copy these into the text fields. After moving the stop, click save to keep the changes.

### View All Stops for a Feed

To view all stops for a feed, hover over the map layers icon (in the top, lefthand corner of the map) and turn on the `Stop locations` layer. When you do, you'll see all of the stops (which appear as grey circles) for the feed even at wide zoom levels. This layer can be viewed whether or not the stop list is visible, so it can be helpful for users who would like to view stop locations alongside routes or trip patterns.

<img src="https://datatools-builds.s3.amazonaws.com/docs/stops/view-all-stops.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px;">

Clicking on a stop shown in this layer will select the stop for editing, but be careful—it can be tricky to select the right stop from very far away!

### Tutorial Video: Editing/Creating Stops
The following video demonstrates the creation and editing of stops outlined below, in a step by step manner. The video covers:
- Adding stops
- Editing stop positions
- Editing stop details
- Showing all stops on map interface

<iframe 
    width="560" 
    height="315" 
    src="https://www.youtube.com/embed/xe3nFrkmw5o" 
    frameborder="0" 
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen>
</iframe>

<!-- Need to add feature -->
<!-- Merge/Manage Stops – By clicking the ‘Find Duplicate Stops’ button all stops within 15 meters of
each other will become highlighted as a group. After clicking on a highlighted group you will have
the option to merge the stops. -->
