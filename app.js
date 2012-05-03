var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy;
  
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);  

var mongoose    = require("mongoose");
var Schema      = mongoose.Schema;
var ObjectId    = Schema.ObjectId;


var io = require('socket.io'),
    express = require('express'),
    MemoryStore = express.session.MemoryStore,
    app = express.createServer(),
    sessionStore = new MemoryStore();

var redis = require("redis"),
client = redis.createClient();


var parseCookie = require('connect').utils.parseCookie;
// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.set('controllers path', __dirname + '/controllers/');
  app.use(express.session({store: sessionStore
        , secret: 'secret'
        , key: 'express.sid'}));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/../../public'));
 
});

mongoose.connect('mongodb://localhost/my_database');

mongoose.model("User", require("./models/UserModel").User);
// passport authentication 


passport = require('passport');
LocalStrategy = require('passport-local').Strategy;

var mongoose    = require("mongoose");
var Schema      = mongoose.Schema;
var ObjectId    = Schema.ObjectId;
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10); 

function findById(id, fn) {
var User      = mongoose.model("User");
User.find({$where : "this._id == '"+id+"' "}, function(error, data){
  var user = data[0];
  if (user) {
    fn(null, user);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
});
  
}

function checkroom(id, room, fn) {
var User      = mongoose.model("User");
User.find({_id:id, rooms:room}, function(error, data){
  var user = data[0];
  if (user) {
    fn(null, user);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
});
  
}

function findByUsername(username, fn) {
var User      = mongoose.model("User");

User.find({$where : "this.username == '"+username+"' "}, function(error, data){
    var user = data[0];
    console.log(data);
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


passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
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

sio = io.listen(app);


require('./routes')(app);
app.listen(3000);





/*

mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/my_database');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;


var Users = new Schema({
    id    : ObjectId
  , username     : String
  , password      : String
  , email       : String
  , rooms       : String

});



var User = mongoose.model('Users', Users);
var instance = new User();
instance.username = "Josh";
instance.password = "$2a$10$MRUOM54rYkFxIjDLYvK9Be9.v9pYz38vcI92N2EMYFTLxA6CH1UwO";
instance.email = "josh@epiclabs.com";
instance.rooms = "test";
instance.save();
*/


 
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

    socket.on('send_chat', function(message, room){
      var userid = socket.handshake.session.passport.user;
       checkroom(userid,room, function (err, user) {
          if(user){
            sio.sockets.in(room).emit('update_chat', user.username, message);
          }
       });
    });

    socket.on('join_room', function(room){
      var userid = socket.handshake.session.passport.user;
      checkroom(userid,room, function (err, user) {
          if(room){
            socket.join(room);
          }
       });
    })
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


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}


