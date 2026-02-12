const mongoose = require('mongoose');
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Email is required for creating a user"],
        trim:true,
        lowercase:true,
        match:[ /^[a-zA-Z0-9]+([._-][0-9a-zA-Z]+)*@[a-zA-Z0-9]+([.-][0-9a-zA-Z]+)*\.[a-zA-Z]{2,}$/,"invalid email address"],
        unique:[true,"Email already exists"]
    },
    name:{
        type:String,
        required:[true,"Name is required for creating an account"]
    },
    password:{
        type:String,
        required:[true,"password is required for creating an account"],
        minlength:[6,"password should be more than 6 character"],
        select:false
    }
},{
    timestamps:true
})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        next(err);
    }
})

userSchema.methods.comparePassword = async function(password){
    return bcrypt.compare(password,this.password)
}


const userModel = mongoose.model("user",userSchema)

module.exports = userModel;