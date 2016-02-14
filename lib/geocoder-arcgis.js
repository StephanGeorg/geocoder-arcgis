var request = require('request'),
    _       = require('lodash');

/**
 * What3Words API wrapper for the API version 1.0.
 *
 * @param apiKey The API key to access the What3Words API with
 * @param options Configuration options
 * @return Instance of {@link What3Words}
 */
function GeocoderArcGIS (options) {

  /*if (!options) {
    throw new Error('API Key not set');
  }*/

  this.options  = options || {};
  this.endpoints   = {
    auth:     'https://www.arcgis.com/sharing/oauth2/token',
    geocode:  'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/',
  };

}

module.exports = GeocoderArcGIS;

/**
 *
 */
GeocoderArcGIS.prototype.geocode = function (data,params) {
 return this.run('find',data,params);

};

/**

 */
GeocoderArcGIS.prototype.reverse = function (data,params) {
  return this.run('reverseGeocode',data,params);

};

/**
 *
 */
GeocoderArcGIS.prototype.suggest = function (data,params) {
  return this.run('suggest',data,params);

};
/**
 *
 */
GeocoderArcGIS.prototype.suggest = function (data,params) {
  return this.run('findAddressCandidates',data,params);

};
/**
 *
 */
GeocoderArcGIS.prototype.suggest = function (data,params) {
  return this.run('geocodeAddresses',data,params);

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

/**
  *
  */
Geocoder.prototype._getQuery = function (method,data) {
  var query = {};

  if(method === 'find') {

    query = {
      text: data,
      outFields: '*',
      f: 'json',
      maxLocations: 5
    };

  } else if(method === 'reverse') {

    if(!this.validateLngLat(data)){
      query.error = 'LatLng wrong!';
    } else {
      query = {
       location: data,
       token: token,
       f: 'json',
       maxLocations: 5
      };
    }

  } else if(method === 'suggest') {
    query = {
      text: data,
      outFields: '*',
      f: 'json',
      maxSuggestions: 10
    };
  } else if(method === 'findAddressCandidates') {

  } else if(method === 'geocodeAddresses') {

  }

  return query;

};


/*
 *
 */
GeocoderArcGIS.prototype.run = function (method,data,params) {
  var query;

  return new Promise(_.bind(function(resolve,reject){
    this.auth()
      .then(_.bind(function(token){

        var query = this.getQuery(method,data);
        if(query.error) {
          reject(query.error);
        }

        query = _.extend(params, query);
        query.token = token;

        this.execute(this.endpoints.suggest,method,query)
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
GeocoderArcGIS.prototype.execute = function (endpoint, method, params) {
  return new Promise(_.bind(function(resolve, reject) {

    options = {
      url: endpoint + method,
      qs: params
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
          console.log(body);
          resolve(JSON.parse(response.body));
        }
      }
    });

  }, this));
};

/**
 */
GeocoderArcGIS.prototype.auth = function () {
  return new Promise(_.bind(function(resolve, reject) {

    if(!this.options.client_secret || !this.options.client_id) {
      reject('Please specify secrets!');
    }

    var options = {
      url: this.endpoints.auth,
      qs: {
        'client_secret': this.options.client_secret,
        'client_id': this.options.client_id,
        'f': 'json',
        'grant_type': 'client_credentials',
        'expiration': '1440'
      }
    };

    request.post(options, function (error, response, body) {
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
        }
      }
    });

  }, this));
};
