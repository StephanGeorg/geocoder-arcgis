var request = require('request'),
    _ = require('lodash');

function ArcGISAuth (options) {

  this.options = options || {};
  this.options.client_secret = options.client_secret || null;
  this.options.client_id = options.client_id || null;
  this.authendpoint = options.authendpoint || 'https://www.arcgis.com/sharing/oauth2/token';

  if(!this.options.client_id || !this.options.client_secret) {
    throw new Error('Please specify client_id and client_secret!');
  }

  this.cache = {};

}

module.exports = ArcGISAuth;

/**
 *  Authenticate with OAuth
 *  @return token OAuth token
 */
ArcGISAuth.prototype.auth = function () {

  return new Promise(_.bind(function(resolve, reject) {

    var cachedToken = this.cachedToken.get(this.cache);

    if(cachedToken !== null) {
      resolve(cachedToken);
      return;
    }

    var options = {
      url: this.authendpoint,
      qs: {
        client_secret: this.options.client_secret,
        client_id: this.options.client_id,
        grant_type: 'client_credentials',
        expiration: 1440,
        f: 'json'
      }
    };

    request.post(options, _.bind(function (error, response, body) {
      if(error) {
        reject({code: 404, msg: error});
      } else {
        if(response.statusCode !== 200) {
          reject({code: response.statusCode, msg: 'Unable to connect to endpoint ' + options.url});
        } else if (response.body.error) {
          reject(response.body);
        }
        if(body){
          var result = JSON.parse(response.body),
              tokenExpiration = (new Date()).getTime() + result.expires_in,
              token = result.access_token;

          this.cachedToken.put(token,tokenExpiration,this.cache);
          resolve(token);
        }
      }
    },this));

  }, this));
};

/**
  *  Manage cached token from ArcGIS Online service
  *
  */
ArcGISAuth.prototype.cachedToken = {
  'now': function() {
    return (new Date()).getTime();
  },
  'put': function(token, experation, cache) {

    cache.token = token;
    //Shave 30 secs off experation to ensure that we expire slightly before the actual expiration
    cache.tokenExp = this.now() + (experation - 30);

  },
  'get' : function(cache) {
    if(!cache) {
        return null;
    }
    if(this.now() <= cache.tokenExp) {
        return cache.token;
    } else {
        return null;
    }
  }
};
