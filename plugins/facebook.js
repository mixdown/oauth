var _ = require('lodash');
var FBOAuth = require('../lib/facebook.js');

var FbOAuthPlugin = function () {};

/**
 * Attach an OAuth plugin to the app.
 *
 * @param {String} options.provider OAuth provider name. Will attach to app as oauth['options.provider']. Useful if you're setting up multiple providers.
 **/
FbOAuthPlugin.prototype.attach = function (options) {
    var oauth = new FBOAuth(options);

    this.oauth = this.oauth || {};
    this.oauth.facebook = oauth;
};

module.exports = FbOAuthPlugin;