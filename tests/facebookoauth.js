var FBOAuth = require('../lib/facebook.js');
var assert = require('assert');
var url = require('url');

var options = {
    clientSecret: 'spy dogs',
    clientId: 'dogs',
    callbackUrl: 'http://localhost:8080/oauth2callback'
};

suite('Facebook OAuth', function () {
    var oauth;

    test('should initialize without error', function () {
        oauth = new FBOAuth(options);
    });
    
    test('should be able to generate an auth url', function () {
        var authUrl = oauth.getAuthUrl();

        assert.ok(authUrl, 'should get url');

        var parsedUrl = url.parse(authUrl, true);

        assert.ok(parsedUrl, 'url is parsable');
    });
});