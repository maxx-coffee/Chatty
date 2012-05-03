var mongoose		= require("mongoose");

var User 			= mongoose.model("User");


exports.index = function(req, res){
  res.render('account', { user: req.user });
};

exports.test = function(req, res){
  res.render('account', { user: req.user });
};

exports.account = function(req, res){
  res.render('account/account', { user: req.user });
};



