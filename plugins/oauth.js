var _ = require('lodash'),
    OAuth2Client = require('googleapis').OAuth2Client,
    url = require('url'),
    request = require('request'),
    querystring = require('querystring');

var OAuth = function () {};

/**
 * Attach an OAuth plugin to the app.
 */
OAuth.prototype.attach = function (options) {
    var that = this,
        options = options || {};

    // validate options
    if (!options.client_id) {
        throw new Error('client_id is required');
    }
    if (!options.client_secret) {
        throw new Error('client_secret is required');
    }
    if (!options.redirect_uri) {
        throw new Error('redirect_uri is required')
    }

    _.defaults(options, {
        response_type: 'code',
        scope: 'openid profile'
    });

    // factory to get a new OAuth2Client
    var getOAuth2Client = function () {
        return new OAuth2Client(
            options.client_id,
            options.client_secret,
            options.redirect_uri
        );
    };

    var authUrlDefaults = _.omit(options, 'client_secret');

    this.oauth = this.oauth || {};

    this.oauth.google = {
        /**
         * Get URL for user consent page.
         */
        getAuthUrl: function () {
            return getOAuth2Client().generateAuthUrl(authUrlDefaults);
        },

        /**
         * Handle the response from the auth server.
         * @param req      {http.IncomingMessage}    HTTP request from auth server
         * @param callback {function(error, tokens)} callback function. tokens is an object containing access_token and optionally refresh_token
         */
        handleAuthResponse: function (req, callback) {
            debugger;
            if (!req) {
                throw new Error('req is required');
            }
            if (!callback || !_.isFunction(callback)) {
                throw new Error('callback is required');
            }
            if (options.response_type === 'token') {
                throw new Error("this method should not be used with response_type=token, it can't parse the URL");
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
                getOAuth2Client().getToken(query.code, function (err, tokens) {
                    // google API doesn't seem to always use error objects, so wrap the error if necessary.
                    if (err && !(err instanceof Error)) {
                        err = new Error(err);
                    }

                    callback(err, tokens);
                });
            }
        },

        /**
         * Gets user info from an auth token
         */
        getUserInfo: function (token, callback) {
            // TODO - googleapis seems to barf on auth here and i'm nervous about some possible concurrency
            // issues in their current implementation, so let's just do a direct request for now.
            request(
                {
                    uri: 'https://www.googleapis.com/oauth2/v3/userinfo?access_token=' + token,
                    json: true
                },
                function (err, response, body) {
                    debugger;
                    if (err) {
                        callback(err);
                    }
                    else if (response.statusCode !== 200) {
                        callback(new Error('received ' + response.statusCode + ' from userinfo API'), body);
                    }
                    else {
                        callback(null, body);
                    }
                }
            );
        },

        /**
         * Verify the user session.
         */
        verify: function (token, callback) {
            
        }
    };
};

module.exports = OAuth;