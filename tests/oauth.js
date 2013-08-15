var OAuth = require('../lib/oauth.js');
var assert = require('assert');
var url = require('url');

var options = {
    clientSecret: 'v75vSYduofxAu1nizreK4HUT',
    clientId: '527660584577.apps.googleusercontent.com',
    callbackUrl: 'http://localhost:8080/oauth2callback',
    baseSite: 'https://accounts.google.com',
    authorizePath: "/o/oauth2/auth",
    accessTokenPath: '/o/oauth2/token'
};

suite('OAuth', function () {
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
        assert.equal(parsedUrl.pathname, options.authorizePath, 'auth path matches');
        assert.equal(parsedUrl.query.redirect_uri, options.callbackUrl, 'callback matches');
        assert.equal(parsedUrl.query.client_id, options.clientId, 'client id matches');
    });
});