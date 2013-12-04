var events = require('events'),
  express = require('express'),
  exphbs  = require('express3-handlebars'),
  helpers = require('./helpers.js'),
  passport = require('passport'),
  util = require('util'),
  TwitterStrategy = require('passport-twitter').Strategy
  config = require('../config.js');

var Web = function(rootDir) {
  var self = this;
  // Passport session setup.
  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.  However, since this example does not
  //   have a database of user records, the complete Twitter profile is serialized
  //   and deserialized.
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });


  // Use the TwitterStrategy within Passport.
  //   Strategies in passport require a `verify` function, which accept
  //   credentials (in this case, a token, tokenSecret, and Twitter profile), and
  //   invoke a callback with a user object.
  passport.use(new TwitterStrategy({
      consumerKey: config.twitter.app.consumer_key,
      consumerSecret: config.twitter.app.consumer_secret,
      callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
    },
    function processAuth(token, tokenSecret, profile, done) {
      // To keep the example simple, the user's Twitter profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Twitter account with a user record in your database,
      // and return that user instead.
      var user = {
        token: token,
        tokenSecret: tokenSecret,
        profile: profile
      };
      return done(null, user);
    }
  ));

  var app = express(),
    hbs = exphbs.create({
      defaultLayout: 'main',
      helpers: helpers,
      layoutsDir: rootDir + '/web/views/layouts/',
      partialsDir: rootDir + '/web/views/partials/'
  });

  app.engine('handlebars', hbs.engine);
  //app.set('view engine', 'handlebars');

  app.configure(function() {
    app.set('views', rootDir + '/web/views');
    app.set('view engine', 'handlebars');
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.json());
    app.use(express.urlencoded())
    app.use(express.methodOverride());
    app.use(express.session({ secret: 'keyboard cat' }));
    // Initialize Passport!  Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(rootDir + '/web/public'));
  });
  
  app.get('/', function (req, res) {
      res.render('index', {user: req.user});
  });

  app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
  });

  app.get('/login', function(req, res){
    res.render('login', { user: req.user });
  });

  // GET /auth/twitter
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in Twitter authentication will involve redirecting
  //   the user to twitter.com.  After authorization, the Twitter will redirect
  //   the user back to this application at /auth/twitter/callback
  app.get('/auth/twitter',
    passport.authenticate('twitter'),
    function(req, res){
      // The request will be redirected to Twitter for authentication, so this
      // function will not be called.
  });

  // GET /auth/twitter/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
      self.emit('auth', req.user);
      res.redirect('/');
  });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
  };  

  this.startServer = function() {
    app.listen(3000, function createSuccess() {
      console.log('Created web server');
    });
  };
  
};

util.inherits(Web, events.EventEmitter);

module.exports = Web;