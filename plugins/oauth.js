var OAuth = require('../lib/oauth.js');

var OAuthPlugin = function () {};

/**
 * Attach an OAuth plugin to the app.
 *
 * @param {String} options.provider OAuth provider name. Will attach to app as oauth['options.provider']. Useful if you're setting up multiple providers.
 **/
OAuthPlugin.prototype.attach = function (options) {
    if (!(options && options.provider)) {
        throw new Error('options.provider is required');
    }

    var oauth = new OAuth(options);

    this.oauth = this.oauth || {};
    
    // TODO - maybe we should throw an exception if the provider name is already in use, but that would make overrides impossible or weird.
    this.oauth[options.provider] = oauth;
};

module.exports = OAuthPlugin;