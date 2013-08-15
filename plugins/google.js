var _ = require('lodash');
var GoogleOAuth = require('../lib/google.js');

var GoogleOAuthPlugin = function () {};

/**
 * Attach an OAuth plugin to the app.
 *
 * @param {String} options.provider OAuth provider name. Will attach to app as oauth['options.provider']. Useful if you're setting up multiple providers.
 **/
GoogleOAuthPlugin.prototype.attach = function (options) {
    var oauth = new GoogleOAuth(options);

    this.oauth = this.oauth || {};
    this.oauth.google = oauth;
};

module.exports = GoogleOAuthPlugin;