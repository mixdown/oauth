module.exports = {
    OAuth: require('./lib/oauth'),
    FacebookOAuth: require('./lib/facebook'),
    GoogleOAuth: require('./lib/google'),
    
    Plugin: require('./plugin/oauth'),
    FacebookPlugin: require('./plugin/facebook'),
    GooglePlugin: require('./plugin/google')
};
