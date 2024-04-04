# Schedules/Calendars

## Schedule and Calendar Overview
The schedule editor allows for the creation of trips/frequencies for any combination of route, pattern, and/or calendar. To manage or edit schedules or exceptions, navigate to the `Calendar` tab located in the left-hand menu:

![calendar-tab](https://datatools-builds.s3.amazonaws.com/docs/schedules/calendar-tab.png)

### Calendars
Transit calendars in GTFS are used to define the days of the week on which transit services are available. See the [GTFS specification calendar reference](https://gtfs.org/schedule/reference/#calendartxt) for more information.

### Exceptions
Exceptions are deviations from the regular transit service schedule, such as holidays, special events, cancellations and service disruptions. See the [GTFS specification calendar dates reference](https://gtfs.org/schedule/reference/#calendar_datestxt) for more information.

### Schedules/Timetable-based routes
Timetable-based routes follow a fixed schedule in which the start time, end time, and all the intermediate stops are pre-defined.

### Frequency-based routes
Unlike the fixed nature of timetable-based trips, frequency-based trips run at regular intervals, with a fixed amount of time between consecutive trips. Frequency-based service offers more flexibility and easier adjustment to changing demand. Visit [GTFS specification frequency reference](https://gtfs.org/schedule/reference/#frequenciestxt) for more information.

## Editing/Creating Calendars
To start editing a calendar, click `+ Create first calendar` if this is the first calendar being added or click an existing calendar to begin adding/editing its properties which include:

- **Service ID:** Unique ID for the calendar
- **Description:** Optional description for calendar (defaults to initial days of week specified)
- **Days of service:** Days of week on which the service operates
- **Start/End dates:** The first and last day of that service assigned to the calendar should run

**Note: Be sure to click the save button (💾) after changes any changes to calendars are made.**

### Tutorial Video: Creating/Editing Calendars
<iframe 
    width="560" 
    height="315" 
    src="https://youtube.com/embed/Ozvroe7EFHs" 
    frameborder="0" 
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen>
</iframe>
<br>

## Editing/Creating Exceptions
To start editing an exception, click any existing exception (if applicable) on the left pane. You will be able to edit properties such as exception name, customize the exception type, click calendars to add, remove or swap and the time range the exception is applied to. To make a new exception, click `New exception` on the top left of the pane (highlighted in yellow).

<img src="https://datatools-builds.s3.amazonaws.com/docs/schedules/new-exception.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px; width: 600px;">

You will be able to add or edit properties such as:

- **Name:** Name of schedule exception
- **Schedule to run:** The chosen schedule that should replace the regularly operating calendars (see below Exception types)
- **Dates:** One or more dates to which the schedule exception applies

### Exception types

There are a number of built-in exception types (or available schedules to run) that allow for a high degree of flexibility when assigning special services.

- **[Su, M, Tu, W, Th, F, Sa]** - replaces all service for the specified dates with the calendar(s) that operate on the chosen day of the week
- **No service** - indicates that no service of any kind should operated on the specified dates
- **Custom** - replace all service for the specified dates with trips operating on the one or more calendars specified with this option. E.g., run only `holiday` and `holiday-plus` calendar on Thanksgiving Day.
- **Swap** - similar to the **Custom** option, however this option allows for removing one or more specific calendars for the specified dates and/or adding one or more specific calendars. This option is especially useful if only certain routes have altered service on specific dates. For example, a user could remove the `weekday-route-1` calendar and add the `special-route-1` calendar.

**Note: Be sure to click the save button (💾) after changes any changes to exceptions are made.**
### Tutorial Video: Creating/Editing Exceptions
<iframe 
    width="560" 
    height="315" 
    src="https://youtube.com/embed/GX5sjxI_nK8" 
    frameborder="0" 
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen>
</iframe>
<br>

## Editing/Creating Timetables
To begin editing a timetable, click the `Edit schedules` button in the top left corner of the screen (highlighed in yellow).

(Alternatively, if you are in the `Routes` tab (see [Routes](/user/editor/routes/)), click an existing route or route click the `New route` button --> click the `Trip patterns` tab --> select a pattern --> click `Use timetables` in the `Type:` dropdown --> click the `Edit schedules` button)

<img src="https://datatools-builds.s3.amazonaws.com/docs/schedules/edit-schedules.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px; width: 600px;">

**Note**: At least one route, pattern and calendar must have been created to edit schedules.

The selectors located at the top of the page allow users to navigate between calendars for a specific pattern or switch between patterns for a route or multiple routes within the feed. Variations of route, pattern and the schedule can be selected to generate the desired timetable.

<img src="https://datatools-builds.s3.amazonaws.com/docs/schedules/timetable-selector.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px; width: 700px;">

Each selection has a set of statistics associated with it shown as a number in a grey or green box, that, when hovered over, provides the following information:

- **Route**
    - \# of trips for the entire route
- **Pattern**
    - \# of trips for pattern
    - \# of calendars containing these trips.
- **Calendar**
    - \# of trips for selected pattern / \# of trips for entire route
    - \# of routes with trips in calendar
    - \# of trips in calendar for entire feed

Once a route, pattern and calendar is selected, a timetable with the following trip details will appear:

- **Block ID** - identifies the vehicle used for the trip
- **Trip ID** - unique identifier for the trip
- **Trip Headsign** - headsign for the trip
- **Arrival/Departure Times** - arrival and departure times (departures shown in grey text) for each stop along the pattern

<img src="https://datatools-builds.s3.amazonaws.com/docs/schedules/edit-timetables.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px; width: 700px;">

To select trips to offset, duplicate or delete, click the row number on the lefthand side of the row. To toggle selection of all trips, click the box in the upper lefthand corner.
<img src="https://datatools-builds.s3.amazonaws.com/docs/schedules/select-trips.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px; width: 500px;">

After trips are selected, navigate to the schedule toolbar at the top right of the screen.

- **Add trip** - add blank trip (first timepoint is `00:00:00`)
- **Duplicate trip(s)** - duplicate the last trip in the spreadsheet or whichever rows are selected
- **Delete trip(s)** - delete selected rows
- **Undo all** - undo all changes
- **Save** - save all changes
- **Offset trip(s)** - specify an offset (`HH:MM`) to offset the last trip in the spreadsheet or whichever rows are selected

<img src="https://datatools-builds.s3.amazonaws.com/docs/schedules/schedule-toolbar.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px; width: 300px;">

** Note: When entering times manually into the schedule editor they will automatically be converted to a standardized format `13:00:00`** 

The following time formats are automatically recognized and converted:

- 24-hr
    - `13:00:00`
    - `13:00`
    - `1300`
- 12-hr
    - `1pm`
    - `1:00pm`
    - `1:00 pm`
    - `1:00:00pm`
    - `1:00:00 pm`

### Tutorial Video: Editing/Creating Timetables
The following video demonstrates the creation and editing of timetables described above. 

<iframe 
    width="560" 
    height="315" 
    src="https://www.youtube.com/embed/ghr8IS-_fhc" 
    frameborder="0" 
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen>
</iframe>

<br>
## Editing/Creating Frequencies
To edit/create frequencies, navigate to the `Routes` tab (see [Routes](/user/editor/routes/)), click an existing route or route click the `New route` button --> click the `Trip patterns` tab --> click a pattern --> click `Use frequencies` in the 'Type:` dropdown --> click the `Edit schedules` button

Frequency details include:

- **Block ID** - identifies the vehicle used for the trip
- **Trip ID** - unique identifier for the trip
- **Trip Headsign** - headsign for the trip
- **Start/End Times** - define the beginning and end time for the interval over which the frequency operates
- **Headway** - headway (in seconds) that the pattern runs during the time interval

Editing frequencies follow the [same editing procedures](#tutorial-video-editingcreating-timetables) as editing timetables.

<img src="https://datatools-builds.s3.amazonaws.com/docs/schedules/edit-frequencies.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px;">