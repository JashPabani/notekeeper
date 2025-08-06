const { default: mongoose } = require("mongoose");
const userschema = new mongoose.Schema({
    username : String,
    password : String
})

const User = mongoose.model("User",userschema);
module.exports = User;
