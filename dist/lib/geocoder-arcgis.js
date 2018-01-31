'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var get = require('lodash.get');
var isString = require('lodash.isstring');
var isObject = require('lodash.isobject');
var ArcGISAuth = require('./auth.js');

require('es6-promise').polyfill();
if (typeof fetch === 'undefined') {
  require('isomorphic-fetch');
}

/**
 * Promises based node.js wrapper for the ESRI ArcGIS geocoder
 *
 * @param options Add client_id, client_secret to get token from ArcGIS auth
 * @return Instance of {@link GeocoderArcGIS}
 */

var GeocoderArcGIS = function () {
  function GeocoderArcGIS() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, GeocoderArcGIS);

    this.options = options;
    this.endpoint = this.options.endpoint || 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/';
    this.cache = {};

    if (this.options.client_id && this.options.client_secret) {
      this.arcgisauth = new ArcGISAuth({
        client_id: this.options.client_id,
        client_secret: this.options.client_secret
      });
    }
  }

  /**
   *  Geocode a string or object
   *
   *  @param  data        string to be geocoded
   *  @params {params}    optional parameters
   *  @return Promise
   */


  _createClass(GeocoderArcGIS, [{
    key: 'findAddressCandidates',
    value: function findAddressCandidates(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return params.forStorage ? this._runAuth('findAddressCandidates', data, params) : this._run('findAddressCandidates', data, params);
    }

    /**
     *  Geocode a string: Deprecated
     *  For backwards compatibility only!
     *
     *  @param  data        string to be geocoded
     *  @params {params}    optional parameters
     *  @return Promise
     */

  }, {
    key: 'geocode',
    value: function geocode(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return params.forStorage ? this._runAuth('findAddressCandidates', data, params) : this._run('findAddressCandidates', data, params);
    }

    /**
     *  Reverse geocode a LatLng
     *
     *  @param  data      string to be reverse geocoded 'lat,lng'
     *  @params {params}    optional parameters
     *  @return Promise
     */

  }, {
    key: 'reverse',
    value: function reverse(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return params.forStorage ? this._runAuth('reverseGeocode', data, params) : this._run('reverseGeocode', data, params);
    }

    /**
     *  Make suggestion for a string
     *
     *  @param  data        string to be geocoded
     *  @params {params}    optional parameters
     *  @return Promise
     */

  }, {
    key: 'suggest',
    value: function suggest(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this._run('suggest', data, params);
    }

    /**
     *  Batch geocoding an array of addresses
     *
     *  @param  [data]      array of addresses
     *  @params {params}    optional parameters
     *  @return Promise
     */

  }, {
    key: 'geocodeAddresses',
    value: function geocodeAddresses(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this._runAuth('geocodeAddresses', data, params);
    }

    /**
     *  Generate the query for specific method
     */

  }, {
    key: '_getQuery',
    value: function _getQuery(method, data, params) {
      var query = void 0;
      switch (method) {
        case 'find':
          query = this._getQueryGeocode(data, params);break;
        case 'reverseGeocode':
          query = this._getQueryReverse(data, params);break;
        case 'suggest':
          query = this._getQuerySuggest(data, params);break;
        case 'findAddressCandidates':
          query = this._getQueryFindAddressCandidates(data, params);break;
        case 'geocodeAddresses':
          query = this._getQueryGeocodeAddresses(data, params);break;
      }

      query.f = params.f || 'json';
      query = Object.assign(params, query);

      return query;
    }

    /**
     *  Prepare the query for find
     */

  }, {
    key: '_getQueryGeocode',
    value: function _getQueryGeocode(data, params) {
      return {
        text: data,
        outFields: params.outFields || '*',
        maxLocations: params.maxLocations || 10
      };
    }

    /**
     *  Prepare the query for reverse
     */

  }, {
    key: '_getQueryReverse',
    value: function _getQueryReverse(data, params) {
      if (!this.validateLngLat(data)) return { error: 'LatLng wrong!' };
      return {
        location: data,
        maxLocations: params.maxLocations || 10
      };
    }

    /**
     *  Prepare the query for suggest
     */

  }, {
    key: '_getQuerySuggest',
    value: function _getQuerySuggest(data, params) {
      return {
        text: data,
        outFields: params.outFields || '*',
        maxSuggestions: params.maxSuggestions || 10
      };
    }

    /**
     *  Prepare the query for findAddressCandidates
     */

  }, {
    key: '_getQueryFindAddressCandidates',
    value: function _getQueryFindAddressCandidates(data) {
      if (isString(data)) return { SingleLine: data };
      if (isObject(data)) return data;
    }

    /**
     *  Prepare the query for geocodeAddresses
     */

  }, {
    key: '_getQueryGeocodeAddresses',
    value: function _getQueryGeocodeAddresses(data) {
      var records = [];
      data.forEach(function (address, index) {
        if (isString(address)) {
          records.push({
            attributes: {
              OBJECTID: index,
              SingleLine: address
            }
          });
        } else {
          address.OBJECTID = index;
          records.push({
            attributes: address
          });
        }
      });
      return { addresses: JSON.stringify({ records: records }) };
    }

    /**
     *  Call the API w/out authentication
     *
     *  @param  method    service method
     *  @param  data      data
     *  @params params    optional parameters
     *  @return promise
     */

  }, {
    key: '_run',
    value: function _run(method, data, params) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var query = _this._getQuery(method, data, params);
        if (query.error) reject(query.error);

        _this._execute(_this.endpoint, method, query).then(resolve).catch(reject);
      });
    }

    /**
     *  Call the API w/ authentication
     *
     *  @param  method    service method
     *  @param  data      data
     *  @params params    optional parameters
     *  @return promise
     */

  }, {
    key: '_runAuth',
    value: function _runAuth(method, data, params) {
      var _this2 = this;

      if (!this.arcgisauth) throw new Error('Please specify client_id and client_secret!');

      return new Promise(function (resolve, reject) {
        _this2.arcgisauth.auth().then(function (token) {
          var query = _this2._getQuery(method, data, params);
          query.token = token;
          if (query.error) reject(query.error);
          _this2._execute(_this2.endpoint, method, query).then(resolve).catch(reject);
        }).catch(reject);
      });
    }

    /**
     * Sends a given request as a JSON object to the ArcGIS API and returns
     * a promise which if resolved will contain the resulting JSON object.
     *
     * @param  {[type]}   endpoint    ArcGIS API endpoint to call
     * @param  {[type]}   params      Object containg parameters to call the API with
     * @param  {Function} Promise
     */

  }, {
    key: '_execute',
    value: function _execute(endpoint, method, query) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var options = {
          // url: endpoint + method,
          method: 'GET',
          qs: query
        };

        var params = _this3.getQueryString(query);
        var url = '' + endpoint + method + '?' + params;

        fetch(url, options).then(function (response) {
          if (response.status >= 400) reject({ code: 404, msg: 'Bad request to ' + url });
          return response.json();
        }).then(function (json) {
          resolve(json);
        }).catch(console.log);
      });
    }
  }, {
    key: 'getQueryString',
    value: function getQueryString(params) {
      return Object.keys(params).map(function (k) {
        if (Array.isArray(params[k])) {
          return params[k].map(function (val) {
            return encodeURIComponent(k) + '[]=' + encodeURIComponent(val);
          }).join('&');
        }
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
    }

    /**
      *   Parsing error and return error object
      */

  }, {
    key: 'parseError',
    value: function parseError(error) {
      if (error.code === 400 && error.details && error.details.length) {
        return {
          code: error.code,
          msg: get(error, 'details')[0] || 'Error'
        };
      }
      return error;
    }

    /**
     *  Validations
     */

  }, {
    key: 'validateLngLat',
    value: function validateLngLat(lnglat) {
      var coordinates = lnglat.split(',');
      if (coordinates.length === 2) {
        var lat = Number(coordinates[1]);
        var lng = Number(coordinates[0]);
        if (lng > -180 && lng < 180 && lat > -90 && lat < 90) return true;
      }
      return;
    }
  }]);

  return GeocoderArcGIS;
}();

module.exports = GeocoderArcGIS;