var request = require('request'),
    _ = require('lodash'),
    ArcGISAuth = require('./auth');

/**
 * Promises based node.js wrapper for the ESRI ArcGIS geocoder
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
 *  @return Promise
 */
GeocoderArcGIS.prototype.geocode = function (data,params) {
  params = params || {};

  if(params.forStorage) {
    return this._runAuth('find',data,params);
  }

  return this._run('find',data,params);

};

/**
 *  Reverse geocode a LatLng
 *
 *  @param  data      string to be reverse geocoded 'lat,lng'
 *  @params {params}    optional parameters
 *  @return Promise
 */
GeocoderArcGIS.prototype.reverse = function (data,params) {
  params = params || {};
  if(params.forStorage){
    return this._runAuth('reverseGeocode',data,params);
  }
  return this._run('reverseGeocode',data,params);

};

/**
 *  Make suggestion for a string
 *
 *  @param  data        string to be geocoded
 *  @params {params}    optional parameters
 *  @return Promise
 */
GeocoderArcGIS.prototype.suggest = function (data,params) {
  params = params || {}; 
  return this._run('suggest',data,params);

};

/**
 *
 */
GeocoderArcGIS.prototype.findAddressCandidates = function (data,params) {
  params = params || {};
  if(params.forStorage){
    return this._runAuth('findAddressCandidates',data,params);
  }
  return this._run('findAddressCandidates',data,params);

};

/**
 *  Batch geocoding an array of addresses
 *
 *  @param  [data]      array of addresses
 *  @params {params}    optional parameters
 *  @return Promise
 */
GeocoderArcGIS.prototype.geocodeAddresses = function (data,params) {
  params = params || {}; 
  return this._runAuth('geocodeAddresses',data,params);

};



/**
 *  Generate the query for specific method
 */
GeocoderArcGIS.prototype._getQuery = function (method,data,params) {
  var query = {};

  switch(method) {
    case 'find': query = this._getQueryGeocode(data,params); break;
    case 'reverseGeocode': query = this._getQueryReverse(data,params); break;
    case 'suggest': query = this._getQuerySuggest(data,params); break;
    case 'findAddressCandidates':   query = this._getQueryFindAddressCandidates(data,params); break;
    case 'geocodeAddresses': query = this._getQueryGeocodeAddresses(data,params); break;
  }

  query.f = params.f || 'json';
  query = _.extend(params, query);

  return query;

};

/**
 *  Prepare the query for find
 */
GeocoderArcGIS.prototype._getQueryGeocode = function (data, params) {
  return  {
    text: data,
    outFields: params.outFields || '*',
    maxLocations: params.maxLocations || 10
  };
};
/**
 *  Prepare the query for reverse
 */
GeocoderArcGIS.prototype._getQueryReverse = function (data, params) {
  if(!this.validateLngLat(data)){
    return { error: 'LatLng wrong!' };
  } else {
    return {
     location: data,
     maxLocations: params.maxLocations || 10
    };
  }
};
/**
 *  Prepare the query for suggest
 */
GeocoderArcGIS.prototype._getQuerySuggest = function (data, params) {
  return {
    text: data,
    outFields: params.outFields || '*',
    maxSuggestions: params.maxSuggestions || 10
  };
};
/**
 *  Prepare the query for findAddressCandidates
 */
GeocoderArcGIS.prototype._getQueryFindAddressCandidates = function (data, params) {
  if(_.isString(data)){
    return { "SingleLine": data };
  } else {
    return JSON.stringify(data);
  }
};
/**
 *  Prepare the query for geocodeAddresses
 */
GeocoderArcGIS.prototype._getQueryGeocodeAddresses = function (data, params) {
  var records = [];
  data.forEach(function(address,index){
    if(_.isString(address)) {
      records.push({
        "attributes": {
          "OBJECTID": index,
          "SingleLine": address
        }
      });
    } else {
      address.OBJECTID = index;
      records.push({
        "attributes": address
      });
    }
  });
  return { addresses: JSON.stringify({ "records": records }) };
};

/**
 *  Call the API w/out authentication
 *
 *  @param  method    service method
 *  @param  data      data
 *  @params params    optional parameters
 *  @return promise
 */
GeocoderArcGIS.prototype._run = function (method,data,params) {

  return new Promise(_.bind(function(resolve,reject){
    var query = this._getQuery(method,data,params);
    if(query.error) {
      reject(query.error);
    }

    this._execute(this.endpoint,method,query)
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
GeocoderArcGIS.prototype._runAuth = function (method,data,params) {

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
        this._execute(this.endpoint,method,query)
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
GeocoderArcGIS.prototype._execute = function (endpoint, method, query) {
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
