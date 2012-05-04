var user = require('./controllers/user');
var chat = require('./controllers/chat');


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

module.exports = function(app) {
  app.all('/', user.index);
  app.all('/user/test', ensureAuthenticated,user.account);
  app.all('/login', user.login);
  app.all('/logout', user.logout);
  //chat routes
  app.all('/chat',  chat.index);
  app.post('/chat/new',  chat.new);
  app.get('/chat/new', chat.new);
   app.all('/chat/:team/:id',  chat.index);
}