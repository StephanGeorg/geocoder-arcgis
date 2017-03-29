const request = require('request');

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

    /** Manage cached token from ArcGIS Online service **/
    this.cachedToken = {
      now() {
        return (new Date()).getTime();
      },
      put(token, experation, cache) {
        cache.token = token;
        cache.tokenExp = this.now() + (experation - 30); // Shave 30 secs off experation to ensure that we expire slightly before the actual expiration
      },
      get(cache) {
        if (!cache) return null;
        if (this.now() <= cache.tokenExp) return cache.token;
        return null;
      },
    };
  }

  /**
   *  Authenticate with OAuth
   *  @return token OAuth token
   */
  auth() {
    return new Promise((resolve, reject) => {
      const cachedToken = this.cachedToken.get(this.cache);

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
      };

      request.post(options, (error, response, body) => {
        if (error) {
          reject({ code: 404, msg: error });
        } else if (response.statusCode !== 200) reject({ code: response.statusCode, msg: `Unable to connect to endpoint ${options.url}` });
        else if (response.body.error) reject(response.body);
        else if (body) {
          const result = JSON.parse(response.body);
          const tokenExpiration = (new Date()).getTime() + result.expires_in;
          const token = result.access_token;
          this.cachedToken.put(token, tokenExpiration, this.cache);
          resolve(token);
        }
      });
    });
  }
}

module.exports = ArcGISAuth;
