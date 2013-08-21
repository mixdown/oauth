# mixdown-oauth
OAuth library and [mixdown](https://github.com/mixdown) plugin. Facilitates communication between browsers and OAuth providers. Wraps [node-oauth](https://github.com/ciaranj/node-oauth).

## Installation
Install with `npm install mixdown-oauth`.

Run tests with `npm test`.

See a basic example site with `node examples/example.js`.

## Usage
Just require, configure and use.

### Library
Here's a simple example configured against Google.

```
var GoogleOAuth = require('mixdown-oauth').GoogleOAuth;

var oauth = new GoogleOAuth({
    clientSecret: 'v75vSYduofxAu1nizreK4HUT',            // your app's client secret
    clientId: '527660584577.apps.googleusercontent.com', // your app's client id
    callbackUrl: 'http://localhost:8080/oauth2callback'  // callback URL from oauth provider
});
```

You can also configure against any provider which implements OAuth 2. The above could also be implemented as follows:

```
var OAuth = require('mixdown-oauth').OAuth;

var oauth = new OAuth({
    clientSecret: 'v75vSYduofxAu1nizreK4HUT',
    clientId: '527660584577.apps.googleusercontent.com',
    callbackUrl: 'http://localhost:8080/oauth2callback',
    authorizePath: 'https://accounts.google.com/o/oauth2/auth',
    accessTokenPath: 'https://accounts.google.com/o/oauth2/token',
    scope: 'openid profile'
});
```

Once initialized, you can generate an authentication URL. This will take you to the provider's login page where the user can grant permissions to your app.

```
var authUrl = oauth.getAuthUrl();
```

When they accept, they'll be redirected back to the callback URL you provided in the config. You need to listen to requests on that URL, but can pass them to the OAuth library to handle them.

```
var http = require('http');
var url = require('url');

http.createServer(function (req, req) {
    var parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/oauth2callback') {
        // oauth response is passed back from the provider on the query, just pass that along
        oauth.handleAuthCallback(parsedUrl.query, function (error, response) {
            if (error) {
                // something went wrong - possibly the login failed or the user rejected it.
                res.writeHead(401, {'content-type': 'text/plain})
                res.end(error.stack);
            }
            else {
                /* logged in - you can use the session data to make calls against the oauth
                 * provider's API or use it to maintain a local session
                 */
                res.writeHead(200, {'content-type': 'application/json'});
                res.end(JSON.stringify(response));
            }
        });
    }
    else {
        // other stuff
    }
}).listen(8080);
```

### Plugin
As a mixdown plugin, just point to any of the plugin exports as a module and include your options. Options are the same as the library, with the addition of a required `provider` option, which indicates the attachment point under the OAuth namespace. This allows you to configure multiple OAuth providers or override them if necessary.

```
{
    "plugins": {
        "myOauthProvider": {
            "module": "mixdown-oauth#Plugin",
            "options": {
                "provider": "google",
                "clientSecret": "v75vSYduofxAu1nizreK4HUT",
                "clientId": "527660584577.apps.googleusercontent.com",
                "callbackUrl": "http://localhost:8080/oauth2callback",
                "authorizePath": "https://accounts.google.com/o/oauth2/auth",
                "accessTokenPath": "https://accounts.google.com/o/oauth2/token",
                "scope": "openid profile"
            }
        },
    }
}
```

The usual methods will be available on `app.plugins.oauth.google`.

This should also work as a [broadway](https://github.com/flatiron/broadway) plugin, but that is untested.

## Methods
###OAuth(options)

Build a new OAuth instance against a provider.

- `options.clientId` client ID
- `options.clientSecret` client secret
- `options.authorizePath` authorization path
- `options.accessTokenPath` access token path
- `options.callbackUrl` callback URL
- `options.scope` requested permissions

### getAuthUrl(params)

Get the authorization URL for the provider.

- `params` Optional, overrides for base options on this request. Currently only supports overriding `options.scope`

### handleAuthCallback(params, callback)

Used to parse the callback response upon login. Call this from your callback handler.

- `params` Generally, you should just pass the parsed query from the request to the callback URL as this parameter. See usage/examples.
- `callback(error, response)` Callback function. `error` if the authentication failed, otherwise the response data as an object (after passed through `parseResponse`).

### parseResponse(response)

This is just a hook to inject modifications to the OAuth provider's response. Override this for custom logic and return the parsed results.

- `response` object returned from OAuth provider.