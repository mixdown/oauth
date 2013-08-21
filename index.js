module.exports = {
    OAuth: require('./lib/oauth'),
    FacebookOAuth: require('./lib/facebook'),
    GoogleOAuth: require('./lib/google'),
    
    Plugin: require('./plugins/oauth'),
    FacebookPlugin: require('./plugins/facebook'),
    GooglePlugin: require('./plugins/google')
};
