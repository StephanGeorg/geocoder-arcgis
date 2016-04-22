var request = require('request'),
    _ = require('lodash'),
    ArcGISAuth = require('./auth');

/**
 * node.js wrapper for the ESRI ArcGIS geocoder
 *
 * @param options Add client_id, client_secret to get token from ArcGIS auth
 * @return Instance of {@link GeocoderArcGIS}
 */
function GeocoderArcGIS (options) {

  this.options  = options || {};
  this.endpoint = this.options.endpoint || 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/';
  this.cache = {};

  if(this.options.client_id && this.options.client_secret) {
    this.arcgisauth = new ArcGISAuth({
      client_id: this.options.client_id,
      client_secret: this.options.client_secret
    });
  }

}

module.exports = GeocoderArcGIS;

/**
 *  Geocode a string
 *
 *  @param  data        string to be geocoded
 *  @params {params}    optional parameters
 *  @return promise
 */
GeocoderArcGIS.prototype.geocode = function (data,params) {
  params = params || {};

  if(params.forStorage) {
    return this.runAuth('find',data,params);
  }

  return this.run('find',data,params);

};

/**
 *  Reverse geocode a LatLng
 *
 *  @param  data      string to be reverse geocoded 'lat,lng'
 *  @params {params}    optional parameters
 *  @return promise
 */
GeocoderArcGIS.prototype.reverse = function (data,params) {
  params = params || {};
  if(params.forStorage){
    return this.runAuth('reverseGeocode',data,params);
  }
  return this.run('reverseGeocode',data,params);

};

/**
 *  Make suggestion for a string
 *
 *  @param  data        string to be geocoded
 *  @params {params}    optional parameters
 *  @return promise
 */
GeocoderArcGIS.prototype.suggest = function (data,params) {
  params = params || {}; 
  return this.run('suggest',data,params);

};

/**
 *
 */
GeocoderArcGIS.prototype.findAddressCandidates = function (data,params) {
  params = params || {};
  if(params.forStorage){
    return this.runAuth('findAddressCandidates',data,params);
  }
  return this.run('findAddressCandidates',data,params);

};

/**
 *  Batch geocoding an array of addresses
 *
 *  @param  [data]      array of addresses
 *  @params {params}    optional parameters
 *  @return promise
 */
GeocoderArcGIS.prototype.geocodeAddresses = function (data,params) {
  params = params || {}; 
  return this.runAuth('geocodeAddresses',data,params);

};


/**
 *  Generate the query for specific method
 */
GeocoderArcGIS.prototype._getQuery = function (method,data,params) {
  var query = {};

  if(method === 'find') {
    query = {
      text: data,
      outFields: params.outFields || '*',
      maxLocations: params.maxLocations || 5
    };

  } else if(method === 'reverseGeocode') {
    if(!this.validateLngLat(data)){
      query.error = 'LatLng wrong!';
    } else {
      query = {
       location: data,
       maxLocations: params.maxLocations || 5
      };
    }

  } else if(method === 'suggest') {
    query = {
      text: data,
      outFields: params.outFields || '*',
      maxSuggestions: params.maxSuggestions || 10
    };

  } else if(method === 'findAddressCandidates') {

  } else if(method === 'geocodeAddresses') {

      var records = [];

      data.forEach(function(address,index){
        address.OBJECTID = index;
        records.push({
          "attributes": address
        });
      });

      query = { addresses: JSON.stringify({ "records": records }) };

  }

  query.f = params.f || 'json';
  query = _.extend(params, query);

  return query;

};

/**
 *  Call the API w/out authentication
 *
 *  @param  method    service method
 *  @param  data      data
 *  @params params    optional parameters
 *  @return promise
 */
GeocoderArcGIS.prototype.run = function (method,data,params) {

  return new Promise(_.bind(function(resolve,reject){
    var query = this._getQuery(method,data,params);
    if(query.error) {
      reject(query.error);
    }

    this.execute(this.endpoint,method,query)
      .then(function(response){
        resolve(response);
      })
      .catch(function(error){
        reject(error);
    });
  },this));
};

/**
 *  Call the API w/ authentication
 *
 *  @param  method    service method
 *  @param  data      data
 *  @params params    optional parameters
 *  @return promise
 */
GeocoderArcGIS.prototype.runAuth = function (method,data,params) {

  if(!this.arcgisauth) {
    throw new Error('Please specify client_id and client_secret!');
  }

  return new Promise(_.bind(function(resolve,reject){
    this.arcgisauth.auth()
      .then(_.bind(function(token){

        var query = this._getQuery(method,data,params);
        query.token = token;

        if(query.error) {
          reject(query.error);
        }
        this.execute(this.endpoint,method,query)
          .then(function(response){
            resolve(response);
          })
          .catch(function(error){
            reject(error);
          });

      },this))
      .catch(function(error){
        reject(error);
    });

  },this));
};

/**
 * Sends a given request as a JSON object to the ArcGIS API and returns
 * a promise which if resolved will contain the resulting JSON object.
 *
 * @param  {[type]}   endpoint    ArcGIS API endpoint to call
 * @param  {[type]}   params      Object containg parameters to call the API with
 * @param  {Function} Promise
 */
GeocoderArcGIS.prototype.execute = function (endpoint, method, query) {
  return new Promise(_.bind(function(resolve, reject) {

    options = {
      url: endpoint + method,
      qs: query
    };

    request.get(options, function (error, response, body) {
      if(error) {
        reject({code: 404, msg: error});
      } else {
        if(response.statusCode !== 200) {
          reject({code: response.statusCode, msg: 'Unable to connect to the API endpoint ' + options.url});
        } else if (response.body.error) {
          reject(response.body);
        }
        if(body){
          resolve(JSON.parse(response.body));
        } else {
          reject({code: response.statusCode, msg: 'Empty body'});
        }
      }
    });

  }, this));
};

/**
 *  Validations
 */
GeocoderArcGIS.prototype.validateLngLat = function (lnglat) {
  var coordinates = lnglat.split(',');
  if(coordinates.length === 2) {
    var lat = Number(coordinates[1]),
        lng = Number(coordinates[0]);
    if((lng > -180 && lng < 180) && (lat > -90 && lat < 90)) {
      return true;
    }
  }
  return;
};
