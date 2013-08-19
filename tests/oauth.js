var OAuth = require('../lib/oauth.js');
var assert = require('assert');
var url = require('url');
var _ = require('lodash');

var options = {
    clientSecret: 'v75vSYduofxAu1nizreK4HUT',
    clientId: '527660584577.apps.googleusercontent.com',
    callbackUrl: 'http://localhost:8080/oauth2callback',
    authorizePath: "https://accounts.google.com/o/oauth2/auth",
    accessTokenPath: 'https://accounts.google.com/o/oauth2/token'
};

suite('Generic OAuth', function () {
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
        assert.equal(parsedUrl.pathname, '/o/oauth2/auth', 'auth path matches');
        assert.equal(parsedUrl.query.redirect_uri, options.callbackUrl, 'callback matches');
        assert.equal(parsedUrl.query.client_id, options.clientId, 'client id matches');
    });

    suite('should be able to handle the auth callback', function () {
        test('should throw an error when called incorrectly', function () {
            try {
                oauth.handleAuthCallback();
                assert.fail('should throw error if params & callback are omitted');
            }
            catch (e) {}
        });

        suite('should pass an error when the response from the provider looks bad', function () {
            test('no code or error', function (done) {
                oauth.handleAuthCallback({}, function (e, token) {
                    if (!e) {
                        assert.fail('expected an error');
                    }
                    done();
                });
            });

            test('error', function (done) {
                oauth.handleAuthCallback({error: 'wolves ate it'}, function (e, token) {
                    if (!e) {
                        assert.fail('expected an error');
                    }
                    done();
                });
            });
        });
    });

    var payload = {object: 'is arbitrary', because: 'implementations vary'};
    var encoded;
    
    test('should be able to encode/decode a payload', function (done) {
        encoded = oauth.encrypt(payload);
        assert.ok(_.isString(encoded) && encoded.length > 0, 'should get back a non-empty base64 encoded string');

        var decoded = oauth.decrypt(encoded);
        assert.deepEqual(decoded, payload, 'decryption should produce the same payload that was encoded');

        oauth.verify(encoded, function (e, valid) {
            if (e) {
                throw e;
            }

            assert.ok(valid);

            done();
        })
    });

    test('should work with a certificate', function (done) {
        var opts = _.clone(options);
        opts.certPath = './tests/cert.txt';

        oauth = new OAuth(opts);

        var encrypted = oauth.encrypt(payload);

        assert.ok(_.isString(encrypted) && encrypted.length > 0, 'should get back a non-empty base64 encoded string');
        assert.notEqual(encrypted, encoded, 'should be different from non-encrypted identical payload');

        var decrypted = oauth.decrypt(encrypted);
        assert.deepEqual(decrypted, payload, 'decryption should produce the same payload that was encrypted');

        oauth.verify(encrypted, function (e, valid) {
            if (e) {
                throw e;
            }

            assert.ok(valid);
            done();
        });
    });

    suite('TTL should be configurable', function () {
        test('should not validate past expiration', function (done) {
            var opts = _.clone(options);
            opts.ttl = 1 // 1 second;

            oauth = new OAuth(opts);

            var payload = {dummy: 'token'};
            oauth.addExpires(payload);
            assert.ok(payload.expires, 'should have added expires timestamp');

            var encoded = oauth.encrypt(payload);

            setTimeout(function () {
                oauth.verify(encoded, function (e, valid) {
                    assert.ok(!valid, 'should not be valid');

                    done();
                });
            }, 1001);
        });

        test('should be disableable', function (done) {
            var opts = _.clone(options);
            opts.ttl = 0;

            oauth = new OAuth(opts);

            var payload = {dummy: 'token'};
            oauth.addExpires(payload);

            assert.ok(!payload.expires, 'should not have an expires field');

            var encoded = oauth.encrypt(payload);

            oauth.verify(encoded, function (e, valid) {
                if (e) {
                    throw e;
                }

                assert.ok(valid, 'should be valid');

                done();
            });
        })
    })
});