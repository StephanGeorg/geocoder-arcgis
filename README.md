# GeocoderArcGIS

A node.js wrapper for the [ArcGIS](https://developers.arcgis.com/features/geocoding/) Geocoder API.


## Installation

Installing using npm (node package manager):

    npm i geocoder-arcgis


## Usage ##

### Initialization ###
```javascript
var GeocoderArcGIS = require('geocoder-arcgis'),
    geocoder = new GeocoderArcGIS({
      client_id:      'YOUR CLIENT ID',
      client_secret:  'YOUR CLIENT SECRET'
    });
```

The constructor function also takes an optional configuration object:

### Geocode ###
```javascript
  geocoder.geocode('Berlin',{})
  .then(function(response){
    console.log(response);
  })
  .catch(function(error){
    console.log(error);
  });
```

Optional parameters:


### Reverse ###
```javascript
  geocoder.positionToWords({
    position: '51.484463,-0.195405'
  }).then(function(response) {

    console.log(response); //prom.cape.pump
  });
```

Optional parameters:


### Suggest ###
```javascript
geocoder.suggest('Glogauer Straße, Berlin',{})
    .then(function(response){
      console.log(response);
    })
    .catch(function(error){
      console.log(error);
    });
```

Optional parameters:



### Response ###

All the methods return a promise.

## License
