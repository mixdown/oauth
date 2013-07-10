var App = require('mixdown-server').App,
    http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    winston = require('winston')

var logger = new winston.Logger();
logger.add(winston.transports.Console, {colorize: true});

var config = {
    "plugins": {
        "oauth": {
            "module": "/plugins/oauth.js",
            "options": {
                "client_secret": "v75vSYduofxAu1nizreK4HUT",
                "client_id": "527660584577.apps.googleusercontent.com",
                "redirect_uri": "http://localhost:8080/oauth2callback"
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

        if (parsedUrl.pathname === '/') {
            // render login button
            var authUrl = app.plugins.oauth.google.getAuthUrl();
            
            res.writeHead(200, {'content-type': 'text/html'});
            res.end('<html><head><title>Mixdown OAuth2 Plugin Example</title></head><body><a href="' + authUrl + '">Click to log in</a></body></html>');
        }

        else if (parsedUrl.pathname === '/oauth2callback') {
            logger.log('received oauth2callback, exchanging code for tokens');

            app.plugins.oauth.google.handleAuthResponse(req, function (err, tokens) {
                if (err) {
                    logger.error('received error exchanging code for tokens', err.stack);

                    res.writeHead(401, {'content-type': 'text/plain'});
                    res.end(err.stack);
                }
                else {
                    logger.debug('received tokens', tokens);

                    res.writeHead(200, {'content-type': 'text/html'});
                    res.end(JSON.stringify(tokens));
                }
            });
        }
    }).listen(8080);
});