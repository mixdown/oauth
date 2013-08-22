var OAuth = require('./oauth.js');
var util = require('util');
var _ = require('lodash');
var request = require('request');

var googleDefaults = {
    authorizePath: 'https://accounts.google.com/o/oauth2/auth',
    accessTokenPath: 'https://accounts.google.com/o/oauth2/token',
    scope: 'openid profile'
};

var GoogleOAuth = function (options) {
    var googleOptions = _.cloneDeep(options);

    _.defaults(googleOptions, googleDefaults);

    OAuth.call(this, googleOptions);
};

util.inherits(GoogleOAuth, OAuth);

GoogleOAuth.prototype.getUser = function (accessToken, callback) {
    if (!accessToken) {
        throw new Error('accessToken is required');
    }
    if (!_.isFunction(callback)) {
        throw new Error('callback is required')
    }

    request(
        {
            uri: 'https://www.googleapis.com/oauth2/v3/userinfo',
            qs: {
                access_token: accessToken
            },
            json: true
        },
        function (error, response, body) {
            if (error) {
                callback(error, body);
            }
            else if (response.statusCode !== 200) {
                callback(new Error('got error code from API: ' + response.statusCode), body);
            }
            else {
                // standardize fields
                body.id = body.sub;
                body.first_name = body.given_name;
                body.last_name = body.family_name;
                
                callback(null, body);
            }
        }
    );
};

module.exports = GoogleOAuth;