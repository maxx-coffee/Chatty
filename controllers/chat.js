var mongoose		= require("mongoose");

var Chat 			= mongoose.model("Chat");

//retrieve all the information for the entered room
function get_chat(chat,  fn) {
Chat.find({name:chat}, function(error, data){
  var user = data[0];
  if (user) {
    fn(null, user);
  } else {
    fn(new Error('Room  does not exist'));
  }
});
  
}


exports.index = function(req, res){
  var chat = req.params.id;
  if(req.user){

  get_chat(chat, function (err, room) {
        if(room){

          if (req.user._id == room.owner){
          		var role = "owner";
          	}

            res.render('chat', { 
            	 user: req.user
            	,room: req.params.id  
            	,role: role
            });
            
          
        }else{ 

        	res.render('chat', { 
            	error: err  
            	,user: req.user

            });
        }
  });

  }else{
   res.render('account/index', { user: req.user });
  }

};

exports.new = function(req, res){
if(req.body.name){
	var instance = new Chat();
	instance.name = req.body.name;
	instance.owner = req.user._id;
	instance.save();
	console.log(req.user);
}
	res.render('chat/newchat', { user: req.user });
}
