var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy;
  
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);  

mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/my_database');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;


var Users = new Schema({
    id    : ObjectId
  , username     : String
  , password      : String
  , email       : String

});



/*
var instance = new User();
instance.username = "Josh";
instance.password = "$2a$10$MRUOM54rYkFxIjDLYvK9Be9.v9pYz38vcI92N2EMYFTLxA6CH1UwO";
instance.email = "josh@epiclabs.com";
instance.save();
*/
var users = [
    { id: 1, username: 'bob', password: '$2a$10$MRUOM54rYkFxIjDLYvK9Be9.v9pYz38vcI92N2EMYFTLxA6CH1UwO', email: 'bob@example.com' }
];

function findById(id, fn) {
var User = mongoose.model('User', Users);
User.find({$where : "this._id == '"+id+"' "}, function(error, data){
  var user = data[0];
  if (user) {
    fn(null, user);
    //return users[idx];
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
});
  
}
/*
function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}
*/
function findByUsername(username, fn) {
var User = mongoose.model('User', Users);
User.find({$where : "this.username == '"+username+"' "}, function(error, data){
    var user = data[0];
    if (user.username === username) {
      return fn(null, user);
    }else{
      return fn(null, null);
    }
    
});
}






// Passport session setup.

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        
        var check_password = bcrypt.compareSync(password, user.password);
         

        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unkown user ' + username }); }
        if (check_password == false) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));


var io = require('socket.io'),
    express = require('express'),
    MemoryStore = express.session.MemoryStore,
    app = express.createServer(),
    sessionStore = new MemoryStore();


// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({store: sessionStore
        , secret: 'secret'
        , key: 'express.sid'}));

  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/../../public'));
 
});




app.listen(3000);
var sio = io.listen(app);


var parseCookie = require('connect').utils.parseCookie;
 
sio.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
        data.cookie = parseCookie(data.headers.cookie);
        data.sessionID = data.cookie['express.sid'];
        // (literally) get the session data from the session store
        sessionStore.get(data.sessionID, function (err, session) {
            if (err || !session) {
                // if we cannot grab a session, turn down the connection
                accept('Error', false);
            } else {
                // save the session data and accept the connection
                data.session = session;
                accept(null, true);
            }
        });
    } else {
       return accept('No cookie transmitted.', false);
    }
});

sio.sockets.on('connection', function (socket) {
    socket.on('message', function (message) {
       var userid = socket.handshake.session.passport.user;
       findById(userid, function (err, user) {
          console.log(user);
       });
    });
});

app.get('/', function(req, res){
  res.render('account', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account/account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('account/login', { user: req.user, message: req.flash('error') });
});

// POST /login
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  });
  
//logout
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('account');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}


