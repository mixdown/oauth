var OAuth = require('./oauth.js');
var util = require('util');
var _ = require('lodash');

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

module.exports = GoogleOAuth;