# GeocoderArcGIS [![npm version](https://badge.fury.io/js/geocoder-arcgis.svg)](https://badge.fury.io/js/geocoder-arcgis)

A promises based JavaScript wrapper for the [ArcGIS](https://developers.arcgis.com/features/geocoding/) Geocoder API.
It uses fetch-everywhere to use in

- Node
- Browser
- React-native

## Installation

Installing using npm:

    npm i geocoder-arcgis -S

## Usage

### Initialization
```javascript
const GeocoderArcGIS = require('geocoder-arcgis');

const geocoder = new GeocoderArcGIS({
  client_id: 'YOUR CLIENT ID',         // optional, see below
  client_secret: 'YOUR CLIENT SECRET'  // optional, see below
});
```

The constructor function also takes an optional configuration object:

* client_id: id for OAuth to use with "geocodeAddresses" or "forStorage" option. See [reference](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-free-vs-paid.htm)
* client_secret: secret for OAuth to use with "geocodeAddresses" or "forStorage" option. See [reference](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-free-vs-paid.htm)
* endpoint: custom ArcGIS endpoint

### Geocode (findAddressCandidates)

```javascript
geocoder.findAddressCandidates('380 New York Street, Redlands, CA 92373',{})
    .then((result) =>{
      console.log(result);
    })
    .catch(console.log);
```

You can pass a [SingleLine string or an object](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm#ESRI_SECTION1_699C8961EDD845CAB84A46409D9E9105) to the geocoder.

Optional parameters:
* you can pass all [request parameters](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm#ESRI_SECTION1_699C8961EDD845CAB84A46409D9E9105)

### Reverse geocode (reverseGeocode)
```javascript
geocoder.reverse('51.484463,-0.195405',{
  maxLocations: 10,
  distance: 100
}).then((result) => {
  console.log(response);
});
```

Optional parameters:
* you can pass all [request parameters](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-reverse-geocode.htm#ESRI_SECTION1_ABD1AD449DF54FFEB9527A606341714C)

### Suggest (suggest)
```javascript
geocoder.suggest('Glogauer Straße, Berlin',{})
.then((result) => {
  console.log(result);
})
.catch(console.log);
```

Optional parameters:
* you can pass all [request parameters](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-suggest.htm#ESRI_SECTION1_606D93C721874B16844B9AB9CA8083FF)

### geocodeAddresses
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
    .then((result){
      console.log(result);
    })
    .catch(console.log);
```

You can pass an array of attributes to the geocoder. All required fields will be added/formatted automatically.  If you don't pass in OBJECTIDs for each address, this library will create them for you. You can pass a [SingleLine string or an object](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm#ESRI_SECTION1_699C8961EDD845CAB84A46409D9E9105) to the geocoder.

Optional parameters:
* you can pass all [request parameters](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-geocode-addresses.htm#ESRI_SECTION1_2F67482E18324994B54C9E93A81AA99D)

### Geocode (find) - [deprecated](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm)
```javascript
geocoder.geocode('Berlin',{})
    .then((response) => {
        console.log(response);
    })
    .catch(console.log);
```

### Response

All methods return a promise.

## See Also
* [geoservices-js](https://github.com/Esri/geoservices-js/blob/master/docs/Geocoding.md) provides another client for the ArcGIS geocoder, using a callback interface instead of promises.
