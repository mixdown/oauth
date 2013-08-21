var GoogleOAuth = require('../').GoogleOAuth;
var assert = require('assert');
var url = require('url');

var options = {
    clientSecret: 'secret dogs',
    clientId: 'dogs',
    callbackUrl: 'http://localhost:8080/oauth2callback'
};

suite('Google OAuth', function () {
    var oauth;

    test('should initialize without error', function () {
        oauth = new GoogleOAuth(options);
    });
    
    test('should be able to generate an auth url', function () {
        var authUrl = oauth.getAuthUrl();

        assert.ok(authUrl, 'should get url');

        var parsedUrl = url.parse(authUrl, true);

        assert.ok(parsedUrl, 'url is parsable');
    });
});