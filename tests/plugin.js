var _ = require('lodash'),
    url = require('url'),
    oauth = require('../plugins/oauth.js'),
    App = require('mixdown-server').App;
    assert = require('assert');

var config = {
    plugins: {
        oauth: {
            module: '/plugins/oauth.js',
            options: {
                provider: 'google',
                clientSecret: 'v75vSYduofxAu1nizreK4HUT',
                clientId: '527660584577.apps.googleusercontent.com',
                callbackUrl: 'http://localhost:8080/oauth2callback',
                baseSite: 'https://accounts.google.com',
                authorizePath: "/o/oauth2/auth",
                accessTokenPath: '/o/oauth2/token'
            }
        }
    }
};

suite('OAuth plugin', function () {
    // TODO - test bad configs?
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
        assert.equal(parsedUrl.protocol, 'https:', 'protocol matches');
        assert.equal(parsedUrl.host, 'accounts.google.com', 'host matches');
        assert.equal(parsedUrl.pathname, config.plugins.oauth.options.authorizePath, 'auth path matches');
        assert.equal(parsedUrl.query.redirect_uri, config.plugins.oauth.options.callbackUrl, 'callback matches');
        assert.equal(parsedUrl.query.client_id, config.plugins.oauth.options.clientId, 'client id matches');
    });
})