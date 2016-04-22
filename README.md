# GeocoderArcGIS

A promises based node.js wrapper for the [ArcGIS](https://developers.arcgis.com/features/geocoding/) Geocoder API.


## Installation

Installing using npm:

    npm i geocoder-arcgis --save


## Usage ##

### Initialization ###
```javascript
var GeocoderArcGIS = require('geocoder-arcgis'),
    geocoder = new GeocoderArcGIS({
      client_id: 'YOUR CLIENT ID',         // optional, see below
      client_secret: 'YOUR CLIENT SECRET'  // optional, see below
    });
```

The constructor function also takes an optional configuration object:

* client_id: id for OAuth to use with "geocodeAddresses" or "forStorage" option. See [reference](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-free-vs-paid.htm)
* client_secret: secret for OAuth to use with "geocodeAddresses" or "forStorage" option. See [reference](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-free-vs-paid.htm)
* endpoint: custom ArcGIS endpoint

### Geocode (find) ###
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
* you can pass all [request parameters](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find.htm#ESRI_SECTION1_E8390AE55A67457A99B5A9E2E3F54FBC)


### Reverse (reverseGeocode) ###
```javascript
  geocoder.reverse('51.484463,-0.195405',{
      maxLocations: 10,
      distance: 100
    }).then(function(response) {
      console.log(response);
  });
```

Optional parameters:
* you can pass all [request parameters](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-reverse-geocode.htm#ESRI_SECTION1_ABD1AD449DF54FFEB9527A606341714C)


### Suggest (suggest) ###
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
* you can pass all [request parameters](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-suggest.htm#ESRI_SECTION1_606D93C721874B16844B9AB9CA8083FF)

### geocodeAddresses ###
```javascript
geocoder.geocodeAddresses([
  "380 New York St., Redlands, CA, 92373",
  {
    "Address": "1 World Way",
    "Neighborhood": "",
    "City": "Los Angeles",
    "Subregion": "",
    "Region": "CA"
  }
  ],{})
    .then(function(response){
      console.log(response);
    })
    .catch(function(error){
      console.log(error);
    });
```
You can pass an array of attributes to the geocoder. ObjectID and all required
fields will be added/formatted automatically.

Optional parameters:
* you can pass all [request parameters](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-geocode-addresses.htm#ESRI_SECTION1_2F67482E18324994B54C9E93A81AA99D)

### findAddressCandidates ###

```javascript
geocoder.findAddressCandidates('380 New York Street, Redlands, CA 92373',{})
    .then(function(response){
      console.log(response);
    })
    .catch(function(error){
      console.log(error);
    });
```

You can pass a [SingleLine string or an object] (https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm#ESRI_SECTION1_699C8961EDD845CAB84A46409D9E9105) to the geocoder.

Optional parameters:
* you can pass all [request parameters](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm#ESRI_SECTION1_699C8961EDD845CAB84A46409D9E9105)


### Response ###

All methods return a promise.

## See Also ##		
* [geoservices-js](https://github.com/Esri/geoservices-js/blob/master/docs/Geocoding.md) provides another client for the ArcGIS geocoder, using a callback interface instead of promises.
