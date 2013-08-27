var OAuth = require('./oauth.js');
var util = require('util');
var _ = require('lodash');
var request = require('request');

var fbDefaults = {
    authorizePath: 'https://www.facebook.com/dialog/oauth',
    accessTokenPath: 'https://graph.facebook.com/oauth/access_token'
};

var FacebookOAuth = function (options) {
    var fbOptions = _.cloneDeep(options);

    _.defaults(fbOptions, fbDefaults);

    OAuth.call(this, fbOptions);
};

util.inherits(FacebookOAuth, OAuth);

FacebookOAuth.prototype.getUser = function (accessToken, callback) {
    if (!accessToken) {
        throw new Error('accessToken is required');
    }
    if (!_.isFunction(callback)) {
        throw new Error('callback is required')
    }

    request(
        {
            uri: 'https://graph.facebook.com/me',
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
                callback(null, body);
            }
        }
    );
};

module.exports = FacebookOAuth;