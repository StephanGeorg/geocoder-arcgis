var GeocoderArcGIS = require('geocoder-arcgis'),
    geocoder = new GeocoderArcGIS();

geocoder.geocode('Glogauer Straße 5, Kreuzberg, Berlin, Germany')
  .then((response)=>{
    console.log(response);
  });
