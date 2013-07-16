var _ = require('lodash'),
    tape = require('tape'),
    url = require('url'),
    oauth = require('../plugins/oauth.js'),
    App = require('mixdown-server').App;

var config = {
    plugins: {
        oauth: {
            module: '/plugins/oauth.js',
            options: {
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

tape('test oauth plugin', function (t) {
    // TODO - test bad configs

    var app = new App(config);

    app.on('error', function (e) {
        t.error(e, 'error on app init');
    })

    app.init(function () {
        t.ok(app, 'app exists');
        t.ok(app.plugins, 'plugins exist');
        t.ok(app.plugins.oauth, 'oauth plugin exists');
        
        var authUrl = app.plugins.oauth.getAuthUrl();

        t.ok(authUrl, 'got an oauth url');

        var parsedUrl = url.parse(authUrl, true);

        t.ok(parsedUrl, 'url is parsable');
        t.equal(parsedUrl.protocol, 'https:', 'protocol matches');
        t.equal(parsedUrl.host, 'accounts.google.com', 'host matches');
        t.equal(parsedUrl.pathname, config.plugins.oauth.options.authorizePath, 'auth path matches')
        t.equal(parsedUrl.query.redirect_uri, config.plugins.oauth.options.callbackUrl, 'callback matches');
        t.equal(parsedUrl.query.client_id, config.plugins.oauth.options.clientId, 'client id matches')

        t.end();
    })
})