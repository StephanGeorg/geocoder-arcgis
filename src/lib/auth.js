require('es6-promise').polyfill();
if (typeof (fetch) === 'undefined') {
  require('isomorphic-fetch')
}

class ArcGISAuth {
  constructor(options = {}) {
    this.options = options;
    this.options.client_secret = options.client_secret || null;
    this.options.client_id = options.client_id || null;
    this.authendpoint = options.authendpoint || 'https://www.arcgis.com/sharing/oauth2/token';

    if (!this.options.client_id || !this.options.client_secret) {
      throw new Error('Please specify client_id and client_secret!');
    }
    this.cache = {};
  }

  putToken(token, experation) {
    this.cache.token = token;
    // Shave 30 secs off experation to ensure that we expire slightly before the actual expiration
    this.cache.tokenExp = (new Date()).getTime() + (experation - 30);
  }

  getToken() {
    if (!this.cache) return null;
    if ((new Date()).getTime() <= this.cache.tokenExp) return this.cache.token;
    return null;
  }

  /**
   *  Authenticate with OAuth
   *  @return token OAuth token
   */
  auth() {
    return new Promise((resolve, reject) => {
      const cachedToken = this.getToken();

      if (cachedToken !== null) {
        resolve(cachedToken);
        return;
      }

      const options = {
        url: this.authendpoint,
        qs: {
          client_secret: this.options.client_secret,
          client_id: this.options.client_id,
          grant_type: 'client_credentials',
          expiration: 1440,
          f: 'json',
        },
        method: 'POST',
      };

      const params = getQueryString(options.qs);
      const url = `${options.url}?${params}`;

      fetch(url, options)
        .then((response) => {
          if (response.status >= 400) reject({ code: 404, msg: `Bad request to ${url}` });
          return response.json();
        })
        .then((json) => {
          const tokenExpiration = (new Date()).getTime() + json.expires_in;
          const token = json.access_token;
          this.putToken(token, tokenExpiration);
          resolve(token);
          resolve(json);
        })
        .catch(console.log);

      /* request.post(options, (error, response, body) => {
        if (error) reject({ code: 404, msg: error });
        else if (response.statusCode !== 200) reject({ code: response.statusCode, msg: `Unable to connect to endpoint ${options.url}` });
        else if (response.body.error) reject(response.body);
        else if (body) {
          const result = JSON.parse(response.body);
          const tokenExpiration = (new Date()).getTime() + result.expires_in;
          const token = result.access_token;
          this.putToken(token, tokenExpiration);
          resolve(token);
        }
      }); */
    });
  }
}

const getQueryString = (params) => {
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
};

module.exports = ArcGISAuth;
