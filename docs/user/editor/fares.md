# Fares

## Fares Overview

### Fare attributes

Fare attributes describe the basic information about a fare including the price, currency type and transfer information. See the [GTFS specification fare attribute reference](https://gtfs.org/schedule/reference/#fare_attributestxt) for more information.
### Fare rules

Fare rules describe how much riders pay to use a transit system, based on factors such as distance traveled, time of day, and type of fare media used (such as a mobile app). In other words, they govern how fare attributes are applied. See the [GTFS specification fare rule reference](https://gtfs.org/schedule/reference/#fare_rulestxt) for more information.


## Editing/Creating Fares

To begin editing fares, click the fare ticket button on the lefthand navigation bar (outlined in red).

Choose a fare from the list to begin editing. To create a new fare, click `+ New fare`, or, if this is the first fare being created for this feed, click `+ Create first fare` (highlighted in yellow).

![fare-tab](https://datatools-builds.s3.amazonaws.com/docs/fares/fare-tab.png)

### Edit fare attributes
In the `Attributes` tab, required and optional information about the fare can be entered, like `fare_id`, `price` and `currency_type`.

**Note: Be sure to click the save button (💾) after changes to fare attributes or fare rules are made. Clicking save after adding attributes will allow you to edit fare rules.**

### Edit fare rules

To define fare rules, you must first create fare zones, which are explained in the next section.

To edit fare rules, you must first create and save a fare with attributes. After choosing a fare, click the `Rules` tab and define one or more rules for this fare using the following types:

1. **Route** - applies to any itinerary that includes the route
2. **From/to zone** - applies to any itinerary that travels from the origin zone to the destination zone
3. **Contains zone** - applies to any itinerary that passes through *each* `contains` zone

<img src="https://datatools-builds.s3.amazonaws.com/docs/fares/edit-fare-rules.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px; width: 600px">

### Creating fare zones

To create a fare zone, you must first select a stop that you would like to include in the zone by clicking the location pin icon on the sidebar and selecting one of the stop names. Next, click in the `zone_id` dropdown and begin typing the new `zone_id`. Click `Create new zone: [zone_id]` and then save the stop. Repeat for as many zones as needed.

<img src="https://datatools-builds.s3.amazonaws.com/docs/fares/add-fare-zone.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px;">

### Tutorial Video: Editing/Creating Fares
<iframe 
    width="560"
    height="315" 
    src="https://www.youtube.com/embed/oiWK_A5emlE" 
    frameborder="0" 
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen>
</iframe>
