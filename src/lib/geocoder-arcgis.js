const get = require('lodash.get');
const isString = require('lodash.isstring');
const isObject = require('lodash.isobject');
const ArcGISAuth = require('./auth.js');

require('es6-promise').polyfill();
require('fetch-everywhere');

/**
 * Promises based node.js wrapper for the ESRI ArcGIS geocoder
 *
 * @param options Add client_id, client_secret to get token from ArcGIS auth
 * @return Instance of {@link GeocoderArcGIS}
 */
class GeocoderArcGIS {
  constructor(options = {}) {
    this.options = options;
    this.endpoint = this.options.endpoint || 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/';
    this.cache = {};

    if (this.options.client_id && this.options.client_secret) {
      this.arcgisauth = new ArcGISAuth({
        client_id: this.options.client_id,
        client_secret: this.options.client_secret,
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
  findAddressCandidates(data, params = {}) {
    return (params.forStorage) ?
      this._runAuth('findAddressCandidates', data, params) :
      this._run('findAddressCandidates', data, params);
  }

  /**
   *  Geocode a string: Deprecated
   *  For backwards compatibility only!
   *
   *  @param  data        string to be geocoded
   *  @params {params}    optional parameters
   *  @return Promise
   */
  geocode(data, params = {}) {
    return (params.forStorage) ?
      this._runAuth('findAddressCandidates', data, params) :
      this._run('findAddressCandidates', data, params);
  }

  /**
   *  Reverse geocode a LatLng
   *
   *  @param  data      string to be reverse geocoded 'lat,lng'
   *  @params {params}    optional parameters
   *  @return Promise
   */
  reverse(data, params = {}) {
    return (params.forStorage) ?
      this._runAuth('reverseGeocode', data, params) :
      this._run('reverseGeocode', data, params);
  }

  /**
   *  Make suggestion for a string
   *
   *  @param  data        string to be geocoded
   *  @params {params}    optional parameters
   *  @return Promise
   */
  suggest(data, params = {}) {
    return this._run('suggest', data, params);
  }

  /**
   *  Batch geocoding an array of addresses
   *
   *  @param  [data]      array of addresses
   *  @params {params}    optional parameters
   *  @return Promise
   */
  geocodeAddresses(data, params = {}) {
    return this._runAuth('geocodeAddresses', data, params);
  }

  /**
   *  Generate the query for specific method
   */
  _getQuery(method, data, params) {
    let query;
    switch (method) {
      case 'find': query = this._getQueryGeocode(data, params); break;
      case 'reverseGeocode': query = this._getQueryReverse(data, params); break;
      case 'suggest': query = this._getQuerySuggest(data, params); break;
      case 'findAddressCandidates': query = this._getQueryFindAddressCandidates(data, params); break;
      case 'geocodeAddresses': query = this._getQueryGeocodeAddresses(data, params); break;
    }

    query.f = params.f || 'json';
    query = Object.assign(params, query);

    return query;
  }

  /**
   *  Prepare the query for find
   */
  _getQueryGeocode(data, params) {
    return {
      text: data,
      outFields: params.outFields || '*',
      maxLocations: params.maxLocations || 10,
    };
  }

  /**
   *  Prepare the query for reverse
   */
  _getQueryReverse(data, params) {
    if (!this.validateLngLat(data)) return { error: 'LatLng wrong!' };
    return {
      location: data,
      maxLocations: params.maxLocations || 10,
    };
  }

  /**
   *  Prepare the query for suggest
   */
  _getQuerySuggest(data, params) {
    return {
      text: data,
      outFields: params.outFields || '*',
      maxSuggestions: params.maxSuggestions || 10,
    };
  }

  /**
   *  Prepare the query for findAddressCandidates
   */
  _getQueryFindAddressCandidates(data) {
    if (isString(data)) return { SingleLine: data };
    if (isObject(data)) return data;
  }

  /**
   *  Prepare the query for geocodeAddresses
   */
  _getQueryGeocodeAddresses(data) {
    const records = [];
    data.forEach((address, index) => {
      if (isString(address)) {
        records.push({
          attributes: {
            OBJECTID: index,
            SingleLine: address,
          },
        });
      } else {
        address.OBJECTID = index;
        records.push({
          attributes: address,
        });
      }
    });
    return { addresses: JSON.stringify({ records }) };
  }

  /**
   *  Call the API w/out authentication
   *
   *  @param  method    service method
   *  @param  data      data
   *  @params params    optional parameters
   *  @return promise
   */
  _run(method, data, params) {
    return new Promise((resolve, reject) => {
      const query = this._getQuery(method, data, params);
      if (query.error) reject(query.error);

      this._execute(this.endpoint, method, query)
        .then(resolve)
        .catch(reject);
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
  _runAuth(method, data, params) {
    if (!this.arcgisauth) throw new Error('Please specify client_id and client_secret!');

    return new Promise((resolve, reject) => {
      this.arcgisauth.auth()
        .then((token) => {
          const query = this._getQuery(method, data, params);
          query.token = token;
          if (query.error) reject(query.error);
          this._execute(this.endpoint, method, query)
          .then(resolve)
          .catch(reject);
        })
        .catch(reject);
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
  _execute(endpoint, method, query) {
    return new Promise((resolve, reject) => {
      const options = {
        // url: endpoint + method,
        method: 'GET',
        qs: query,
      };

      const params = this.getQueryString(query);
      const url = `${endpoint}${method}?${params}`;

      fetch(url, options)
        .then((response) => {
          if (response.status >= 400) reject({ code: 404, msg: `Bad request to ${url}` });
          return response.json();
        })
        .then((json) => {
          resolve(json);
        })
        .catch(console.log);
    });
  }

  getQueryString(params) {
    return Object
    .keys(params)
    .map((k) => {
      if (Array.isArray(params[k])) {
        return params[k]
          .map(val => `${encodeURIComponent(k)}[]=${encodeURIComponent(val)}`)
          .join('&');
      }
      return `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`;
    })
    .join('&');
  }

  /**
    *   Parsing error and return error object
    */
  parseError(error) {
    if (error.code === 400 && (error.details && error.details.length)) {
      return {
        code: error.code,
        msg: get(error, 'details')[0] || 'Error',
      };
    }
    return error;
  }

  /**
   *  Validations
   */
  validateLngLat(lnglat) {
    const coordinates = lnglat.split(',');
    if (coordinates.length === 2) {
      const lat = Number(coordinates[1]);
      const lng = Number(coordinates[0]);
      if ((lng > -180 && lng < 180) && (lat > -90 && lat < 90)) return true;
    }
    return;
  }
}

module.exports = GeocoderArcGIS;
