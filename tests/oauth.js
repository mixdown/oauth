var OAuth = require('../lib/oauth.js');
var assert = require('assert');
var url = require('url');
var _ = require('lodash');

var options = {
    clientSecret: 'v75vSYduofxAu1nizreK4HUT',
    clientId: '527660584577.apps.googleusercontent.com',
    callbackUrl: 'http://localhost:8080/oauth2callback',
    authorizePath: "https://accounts.google.com/o/oauth2/auth",
    accessTokenPath: 'https://accounts.google.com/o/oauth2/token'
};

suite('Generic OAuth', function () {
    var oauth;

    test('should initialize without error', function () {
        oauth = new OAuth(options);
    });

    test('should be able to generate an auth url', function () {
        var authUrl = oauth.getAuthUrl();

        assert.ok(authUrl, 'should get url');

        var parsedUrl = url.parse(authUrl, true);

        assert.ok(parsedUrl, 'url is parsable');
        assert.equal(parsedUrl.protocol, 'https:', 'protocol matches');
        assert.equal(parsedUrl.host, 'accounts.google.com', 'host matches');
        assert.equal(parsedUrl.pathname, '/o/oauth2/auth', 'auth path matches');
        assert.equal(parsedUrl.query.redirect_uri, options.callbackUrl, 'callback matches');
        assert.equal(parsedUrl.query.client_id, options.clientId, 'client id matches');
    });

    suite('should be able to handle the auth callback', function () {
        test('should throw an error when called incorrectly', function () {
            try {
                oauth.handleAuthCallback();
                assert.fail('should throw error if params & callback are omitted');
            }
            catch (e) {}
        });

        suite('should pass an error when the response from the provider looks bad', function () {
            test('no code or error', function (done) {
                oauth.handleAuthCallback({}, function (e, token) {
                    if (!e) {
                        assert.fail('expected an error');
                    }
                    done();
                });
            });

            test('error', function (done) {
                oauth.handleAuthCallback({error: 'wolves ate it'}, function (e, token) {
                    if (!e) {
                        assert.fail('expected an error');
                    }
                    done();
                });
            });
        });
    });
});