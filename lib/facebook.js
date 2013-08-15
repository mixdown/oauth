var OAuth = require('./oauth.js');
var util = require('util');
var _ = require('lodash');

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

module.exports = FacebookOAuth;