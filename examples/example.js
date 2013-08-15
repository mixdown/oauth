/**
 * This example illustrates boilerplate for attaching Google and Facebook OAuth2 plugins. Here, we use two separate
 * callback URLs, but other approaches are possible. For example, you could use the "state" parameter as an option. It
 * would be returned as a query string parameter and could be used to identify the provider.
 **/
var App = require('mixdown-server').App,
    http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    winston = require('winston')

var logger = new winston.Logger();
logger.add(winston.transports.Console, {colorize: true});

global.logger = logger;

var config = {
    plugins: {
        google: {
            module: '/plugins/oauth.js',
            options: {
                provider: 'google',
                clientSecret: 'v75vSYduofxAu1nizreK4HUT',
                clientId: '527660584577.apps.googleusercontent.com',
                callbackUrl: 'http://localhost:8080/oauth2callback',
                authorizePath: 'https://accounts.google.com/o/oauth2/auth',
                accessTokenPath: 'https://accounts.google.com/o/oauth2/token',
                scope: 'openid profile'
            }
        },
        facebook: {
            module: '/plugins/oauth.js',
            options: {
                provider: 'facebook',
                clientSecret: 'a0028d29c434a19f5820484d13b37771',
                clientId: '502218416528431',
                callbackUrl: 'http://localhost:8080/fboauth2callback',
                authorizePath: 'https://www.facebook.com/dialog/oauth',
                accessTokenPath: 'https://graph.facebook.com/oauth/access_token',
                scope: 'email'
            }
        }
    }
}

var app = new App(config);

app.on('error', function (e) {
    // uh oh!
    logger.error(e.stack);
})

app.init(function () {
    logger.info('app started, visit http://localhost:8080');

    http.createServer(function (req, res) {
        var parsedUrl = url.parse(req.url);
        var query = querystring.parse(parsedUrl.query);

        if (parsedUrl.pathname === '/') {
            // render login button
            var googleAuthUrl = app.plugins.oauth.google.getAuthUrl();
            var fbAuthUrl = app.plugins.oauth.facebook.getAuthUrl();
            
            res.writeHead(200, {'content-type': 'text/html'});
            res.end('<html><head><title>Mixdown OAuth2 Plugin Example</title></head><body><p><a href="' + googleAuthUrl + '">Click to log in with google</a></p><p><a href="' + fbAuthUrl + '">Click to log in with facebook</a></p></body></html>');
        }

        else if (parsedUrl.pathname === '/oauth2callback') {
            logger.info('received oauth2callback, exchanging code for tokens');
            
            app.plugins.oauth.google.handleAuthCallback(query, function (err, accessToken, refreshToken, response) {
                if (err) {
                    logger.error('received error exchanging code for tokens', err.stack);

                    res.writeHead(401, {'content-type': 'text/plain'});
                    res.end(err.stack);
                }
                else {
                    logger.debug('received tokens', response);

                    res.writeHead(200, {'content-type': 'text/html'});
                    res.end(JSON.stringify(response));
                }
            });
        }

        else if (parsedUrl.pathname === '/fboauth2callback') {
            logger.info('received fboauth2callback, exchanging code for tokens');

            app.plugins.oauth.facebook.handleAuthCallback(query, function (err, accessToken, refreshToken, response) {
                if (err) {
                    logger.error('received error exchanging code for tokens', err.stack);

                    res.writeHead(401, {'content-type': 'text/plain'});
                    res.end(err.stack);
                }
                else {
                    logger.debug('received tokens', response);

                    res.writeHead(200, {'content-type': 'text/html'});
                    res.end(JSON.stringify(response));
                }
            });
        }
    }).listen(8080);
});