/**
 * This example illustrates boilerplate for attaching Google and Facebook OAuth2 plugins. Here, we use two separate
 * callback URLs, but other approaches are possible. For example, you could use the "state" parameter as an option. It
 * would be returned as a query string parameter and could be used to identify the provider.
 **/
var App = require('mixdown-server').App
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var winston = require('winston');
var fs = require('fs');
var _ = require('lodash')

var logger = new winston.Logger();
logger.add(winston.transports.Console, {colorize: true});

global.logger = logger;

var templates = {
    index: './examples/index.html',
    success: './examples/success.html'
};

_.each(templates, function (file, name) {
    fs.readFile(file, {encoding: 'utf8'}, function (e, html) {
        if (e) {
            logger.error(e);
        }
        templates[name] = _.template(html);
    });
});

// var config = {
//     plugins: {
//         google: {
//             module: '/#Plugin', // normally would use 'mixdown-oauth#Plugin'
//             options: {
//                 provider: 'google',
//                 clientSecret: 'v75vSYduofxAu1nizreK4HUT',
//                 clientId: '527660584577.apps.googleusercontent.com',
//                 callbackUrl: 'http://localhost:8080/oauth2callback',
//                 authorizePath: 'https://accounts.google.com/o/oauth2/auth',
//                 accessTokenPath: 'https://accounts.google.com/o/oauth2/token',
//                 scope: 'openid profile'
//             }
//         },
//         facebook: {
//             module: '/#Plugin', // normally would use 'mixdown-oauth#Plugin'
//             options: {
//                 provider: 'facebook',
//                 clientSecret: 'a0028d29c434a19f5820484d13b37771',
//                 clientId: '502218416528431',
//                 callbackUrl: 'http://localhost:8080/fboauth2callback',
//                 authorizePath: 'https://www.facebook.com/dialog/oauth',
//                 accessTokenPath: 'https://graph.facebook.com/oauth/access_token',
//                 scope: 'email'
//             }
//         }
//     }
// };

// note that you could also use the google/facebook plugins with a shortened config
var config = {
    plugins: {
        google: {
            module: '/#GooglePlugin', // normally would use 'mixdown-oauth#GooglePlugin'
            options: {
                clientSecret: 'v75vSYduofxAu1nizreK4HUT',
                clientId: '527660584577.apps.googleusercontent.com',
                callbackUrl: 'http://localhost:8080/oauth2callback',
                scope: 'openid profile email'
            }
        },
        facebook: {
            module: '/#FacebookPlugin', // normally would use 'mixdown-oauth#FacebookPlugin'
            options: {
                clientSecret: 'a0028d29c434a19f5820484d13b37771',
                clientId: '502218416528431',
                callbackUrl: 'http://localhost:8080/fboauth2callback',
                scope: 'email'
            }
        }
    }
};


var app = new App(config);

app.on('error', function (e) {
    // uh oh!
    logger.error(e.stack);
})

app.init(function () {
    logger.info('app started, visit http://localhost:8080');

    http.createServer(function (req, res) {
        var parsedUrl = url.parse(req.url, true);

        var handleOAuthCallback = function (provider) {
            logger.info('received oauth2callback, exchanging code for tokens');
            
            app.plugins.oauth[provider].handleAuthCallback(parsedUrl.query, function (err, data) {
                if (err) {
                    logger.error('received error exchanging code for tokens', err.stack);

                    res.writeHead(401, {'content-type': 'text/plain'});
                    res.end(err.stack);
                }
                else {
                    var userUrl = '/' + provider + 'user?access_token=' + data.access_token;
                    var html = templates.success({userUrl: userUrl, json: JSON.stringify(data)});
                    
                    res.writeHead(200, {'content-type': 'text/html'});
                    res.end(html);
                }
            });
        };

        var getUser = function (provider) {
            var token = parsedUrl.query.access_token;

            app.plugins.oauth[provider].getUser(token, function (error, data) {
                if (error) {
                    logger.error('received error exchanging code for tokens', error.stack);

                    res.writeHead(401, {'content-type': 'text/plain'});
                    res.end(error.stack);
                }
                else {
                    res.writeHead(200, {'content-type': 'application/json'});
                    res.end(JSON.stringify(data));
                }
            });
        };        
        if (parsedUrl.pathname === '/') {
            // render login button
            var googleAuthUrl = app.plugins.oauth.google.getAuthUrl();
            var fbAuthUrl = app.plugins.oauth.facebook.getAuthUrl();
            var html = templates.index({googleAuthUrl: googleAuthUrl, fbAuthUrl: fbAuthUrl});
            
            res.writeHead(200, {'content-type': 'text/html'});
            res.end(html);
        }


        else if (parsedUrl.pathname === '/oauth2callback') {
            handleOAuthCallback('google');
        }

        else if (parsedUrl.pathname === '/fboauth2callback') {
            handleOAuthCallback('facebook');
        }


        else if (parsedUrl.pathname === '/googleuser') {
            getUser('google')
        }
        else if (parsedUrl.pathname === '/facebookuser') {
            getUser('facebook');
        }
    }).listen(8080);
});