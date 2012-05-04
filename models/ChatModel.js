var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Chat = new Schema({
    id    : ObjectId
  , name     : String
  , owner      : String

});

exports.Chat = Chat;