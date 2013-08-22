var oauth = require('oauth');
var _ = require('lodash');
var querystring = require('querystring');
var util = require('util');
var url = require('url');
var fs = require('fs');
var crypto = require('crypto');

/**
 * An interface for dealing with OAuth providers. Handles URL generation and callback parsing.
 *
 * @param {String} options.clientId
 * @param {String} options.clientSecret
 * @param {String} options.authorizePath
 * @param {String} options.accessTokenPath
 * @param {String} options.callbackUrl
 */
var OAuth = function (options) {
    options = options || {};
    
    // validate options
    if (!options.clientId) {
        throw new Error('clientId is required');
    }
    if (!options.clientSecret) {
        throw new Error('clientSecret is required');
    }
    if (!options.authorizePath) {
        throw new Error('authorizePath is required');
    }
    if (!options.accessTokenPath) {
        throw new Error('accessTokenPath is required');
    }
    if (!options.callbackUrl) {
        throw new Error('callbackUrl is required');
    }

    // the oauth lib this wraps requires a "baseSite" parameter, but some providers COUGH FACEBOOK COUGH have different
    // bases for authorize and access token path, so we need to use an empty string for this and specify whole paths for
    // auth & token
    options.baseSite = '';

    // default params for auth url
    this.authUrlDefaults = {
        response_type: options.responseType || 'code',
        // scope: options.scope || 'openid profile',
        scope: options.scope,
        redirect_uri: options.callbackUrl
    };

    // default params for token url
    this.tokenUrlDefaults = {
        redirect_uri: options.callbackUrl,
        grant_type: 'authorization_code'
    };

    // init oauth2client
    this.oauth2Client = new oauth.OAuth2(
        options.clientId,
        options.clientSecret,
        options.baseSite,
        options.authorizePath,
        options.accessTokenPath,
        options.customHeaders
    );

    this.options = options;
};

/**
 * Get URL for user consent page.
 * @param {Object} [params]
 */
OAuth.prototype.getAuthUrl = function (params) {
    return this.oauth2Client.getAuthorizeUrl(_.defaults(params || {}, this.authUrlDefaults));
};

/**
 * Handle the callback from the auth server.
 * @param {Object}                 params   Params passed on query string from OAuth provider. Typically you can just use request.query.
 * @param {function(error, token)} callback Callback function. Token is the JSON response from the OAuth provider base64 encoded and optionally encrypted.
 */
OAuth.prototype.handleAuthCallback = function (params, callback) {
    var that = this;

    if (!params) {
        throw new Error('params is required');
    }
    if (!callback || !_.isFunction(callback)) {
        throw new Error('callback is required');
    }
    
    // pull query from request
    if (params.error) {
        callback(new Error('error on auth response: ' + params.error));
    }
    else if (!params.code) {
        callback(new Error('auth response missing error and code'));
    }
    else {
        // exchange the code for a token
        this.oauth2Client.getOAuthAccessToken(params.code, _.clone(this.tokenUrlDefaults), function (err, accessToken, refreshToken, results) {
            // oauth doesn't pass back error objects, wrap the response
            if (err && !(err instanceof Error)) {
                err = new Error('caught error from oauth library: ' + util.inspect(err));
            }
            else if (results) {
                // oauth library removes refresh token from results for some reason. not sure why, but adding it back.
                results.refresh_token = refreshToken;
            }

            results = that.parseResponse(results);

            callback(err, results);
        });
    }
};

/**
 * Hook to parse, extend, or modify the OAuth provider response
 */
OAuth.prototype.parseResponse = function (response) {
    return response;
};

/**
 * Get user information. This is unimplemented as the endpoint varies between OAuth providers. Additionally, this requires requesting the correct scope.
 * ID, email address, first name and last name will be standardized if present (to id, email, first_name, last_name).
 *
 * @param {String}                accessToken access token for OAuth provider
 * @param {function(error, user)} callback    callback function
 */
OAuth.prototype.getUser = function (accessToken, callback) {
    throw Error('provider-specific, override for your use case.')
};

module.exports = OAuth;