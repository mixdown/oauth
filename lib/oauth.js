var oauth = require('oauth');
var _ = require('lodash');
var querystring = require('querystring');
var util = require('util');
var url = require('url');
var fs = require('fs');
var crypto = require('crypto');

/**
 * An interface for dealing with OAuth providers. Handles URL generation and callback parsing, and adds some simple
 * security and session management for consumers.
 *
 * @param {String} options.clientId
 * @param {String} options.clientSecret
 * @param {String} options.authorizePath
 * @param {String} options.accessTokenPath
 * @param {String} options.callbackUrl
 * @param {String} [options.certPath]      path to a certificate used to encrypt/decrypt tokens.
 * @param {Number} [options.ttl=86400]     Time in seconds that an encoded token can remain active. Disable by setting to 0.
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
    if (options.certPath) {
        // TODO not sync
        this.cert = fs.readFileSync(options.certPath, 'utf8');

        if (!this.cert) {
            throw new Error('could not resolve certPath')
        }
    }

    _.defaults(options, {
        ttl: 86400 // one day
    });

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
 * @param [params] {Object}
 */
OAuth.prototype.getAuthUrl = function (params) {
    return this.oauth2Client.getAuthorizeUrl(_.defaults(params || {}, this.authUrlDefaults));
};

/**
 * Add the expires field to the response (or do nothing if TTL is disabled).
 */
OAuth.prototype.addExpires = function (response) {
    if (this.options.ttl) {
        response.expires = (Date.now() + (this.options.ttl * 1000));
    }

    return response;
};

/**
 * Handle the callback from the auth server.
 * @param params    {Object}                  Params passed on query string from OAuth provider. Typically you can just use request.query.
 * @param callback  {function(error, token)}  Callback function. Token is the JSON response from the OAuth provider base64 encoded and optionally encrypted.
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
            var token;

            // oauth doesn't pass back error objects, wrap the response
            if (err && !(err instanceof Error)) {
                err = new Error('caught error from oauth library: ' + util.inspect(err));
            }
            else if (results) {
                // oauth library removes refresh token from results for some reason. not sure why, but adding it back.
                results.refresh_token = refreshToken;

                // add the expires timestamp
                addExpires(results);

                try {
                    // encrypt (or encode)
                    token = that.encrypt(results);
                }
                catch (e) {
                    err = e;
                }
            }

            callback(err, token);
        });
    }
};

/**
 * Encrypt a token.
 */
OAuth.prototype.encrypt = function (results) {
    var encryptedToken = JSON.stringify(results);

    if (this.cert) {
        var cipher = crypto.createCipher('aes256', this.cert);

        encryptedToken = cipher.update(encryptedToken, 'utf8', 'base64');
        encryptedToken += cipher.final('base64');
    }
    else {
        // just base64 encode it
        encryptedToken = (new Buffer(encryptedToken)).toString('base64');
    }

    return encryptedToken;
};

/**
 * Decrypt a token.
 */
OAuth.prototype.decrypt = function (token) {
    var decryptedToken;

    if (this.cert) {
        var decipher = crypto.createDecipher('aes256', this.cert);

        decryptedToken = decipher.update(token, 'base64', 'utf8');
        decryptedToken += decipher.final('utf8');
    }
    else {
        // base64 decode
        decryptedToken = (new Buffer(token, 'base64')).toString('utf8');
    }

    decryptedToken = JSON.parse(decryptedToken);

    return decryptedToken;
};

/**
 * Verify the user session. This is a simple verification - it simply asserts that the token can be base64 decoded or
 * decrypted with the provided cert and that the 'expires' timestamp, if present, is not in the past. Note that this is
 * NOT secure if a cert is not provided, as a base64 encoded object could be spoofed trivially.
 * 
 */
OAuth.prototype.verify = function (token, callback) {
    var error;
    var valid = false;

    try {
        var decryptedToken = this.decrypt(token);

        // dumb check - make sure this decodes to a non-empty object.
        valid = _.isObject(decryptedToken) && !_.isEmpty(decryptedToken);

        // check expires timestamp if we have one
        if (decryptedToken && decryptedToken.expires && (decryptedToken.expires < Date.now())) {
            valid = false;
        }
    }
    catch (e) {
        error = e; // could be a decode or json parsing error, either of which would indicate a bad token.
        // TODO - should we actually pass this back as an error, or just log it?
    }

    callback(error, valid);
};

module.exports = OAuth;