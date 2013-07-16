var _ = require('lodash'),
    oauth = require('oauth'),
    url = require('url'),
    request = require('request'),
    querystring = require('querystring'),
    util = require('util');

var OAuth = function () {};

/**
 * Attach an OAuth plugin to the app.
 */
OAuth.prototype.attach = function (options) {
    var that = this,
        options = options || {};

    // validate options
    if (!options.clientId) {
        throw new Error('clientId is required');
    }
    if (!options.clientSecret) {
        throw new Error('clientSecret is required');
    }
    if (!options.callbackUrl) {
        throw new Error('callbackUrl is required');
    }
    if (!options.baseSite) {
        throw new Error('baseSite is required');
    }

    // add defaults for auth & token path - these are copied from oauth, mainly for transparency
    _.defaults(options, {
        authorizePath: '/oauth/authorize',
        accessTokenPath: '/oauth/access_token'
    });

    // default params for auth url
    var authUrlDefaults = {
        response_type: options.responseType || 'code',
        scope: options.scope || 'openid profile',
        redirect_uri: options.callbackUrl
    };

    // default params for token url
    var tokenUrlDefaults = {
        redirect_uri: options.callbackUrl,
        grant_type: 'authorization_code'
    };

    var oauth2Client = new oauth.OAuth2(
        options.clientId,
        options.clientSecret,
        options.baseSite,
        options.authorizePath,
        options.accessTokenPath,
        options.customHeaders
    );

    this.oauth = {
        /**
         * Get URL for user consent page.
         * @param [params] {Object}
         */
        getAuthUrl: function (params) {
            return oauth2Client.getAuthorizeUrl(_.defaults(params || {}, authUrlDefaults));
        },

        /**
         * Handle the callback from the auth server.
         * @param req      {http.IncomingMessage}    HTTP request from auth server
         * @param callback {function(error, tokens)} callback function. tokens is an object containing access_token and optionally refresh_token
         */
        handleAuthCallback: function (req, callback) {
            if (!req) {
                throw new Error('req is required');
            }
            if (!callback || !_.isFunction(callback)) {
                throw new Error('callback is required');
            }
            
            var query = req.query || querystring.parse(url.parse(req.url).query);

            // pull query from request
            if (query.error) {
                callback(new Error('error on auth response: ' + query.error));
            }
            else if (!query.code) {
                callback(new Error('auth response missing error and code'));
            }
            else {
                // exchange the code for a token
                oauth2Client.getOAuthAccessToken(query.code, _.clone(tokenUrlDefaults), function (err, accessToken, refreshToken, results) {
                    // oauth doesn't pass back error objects, wrap the response
                    if (err && !(err instanceof Error)) {
                        err = new Error('caught error from oauth library: ' + util.inspect(err));
                    }

                    // oauth library removes refresh token from results for some reason. not sure why, but adding it back.
                    if (results) results.refresh_token = refreshToken;

                    callback(err, accessToken, refreshToken, results);
                });
            }
        },

        /**
         * Verify the user session.
         */
        verify: function (token, callback) {
            throw new Error('unimplemented & provider specific, override for your use case');
        }
    };
};

module.exports = OAuth;