var oauth = require('../plugins/oauth.js');
var App = require('mixdown-server').App;
var assert = require('assert');
var url = require('url');

var config = {
    plugins: {
        googleoauth: {
            module: '/#GooglePlugin',
            options: {
                clientSecret: "oscar's stash of diamonds",
                clientId: 'sesamestreet',
                callbackUrl: 'http://localhost:8080/oauth2callback'
            }
        }
    }
};

suite('Google OAuth plugin', function () {
    var app = new App(config);

    test('should init', function (done) {
        app.init(function (e) {
            if (e) {
                throw e;
            }
            done();
        })
    });

    test('should attach namespace', function () {
        assert.ok(app, 'app exists');
        assert.ok(app.plugins, 'plugins exist');
        assert.ok(app.plugins.oauth, 'oauth plugin exists');
        assert.ok(app.plugins.oauth.google, 'attached to correct provider name');
    });

    test('should generate an oauth url', function () {
        var authUrl = app.plugins.oauth.google.getAuthUrl();

        assert.ok(authUrl, 'got an oauth url');

        var parsedUrl = url.parse(authUrl, true);

        assert.ok(parsedUrl, 'url is parsable');
    });
})