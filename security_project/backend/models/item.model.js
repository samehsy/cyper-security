const mongoose = require("mongoose");
const Schema = require("mongoose").Schema;

var PasswordShema = new Schema({
  password: String,
  userId: String,
});

var PasswordItemShema = new Schema({
  email: String,
  passwordObj: {
    type: [PasswordShema],
  },
  address: String,
  discretion: String,
  userId: String,
});

var PasswordShareShema = new Schema({
  owner: mongoose.Schema.Types.ObjectId,
  reciver: mongoose.Schema.Types.ObjectId,
  passwordItem: {
    type: PasswordShema,
  },
  accepted: { type: Boolean, default: false },
});

module.exports = {
  PasswordItem: mongoose.model("PasswordItem", PasswordItemShema),
  PasswordShare: mongoose.model("PasswordShare", PasswordShareShema),
};
