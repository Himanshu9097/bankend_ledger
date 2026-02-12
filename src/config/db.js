const mongoose = require('mongoose');

function connectDB(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Server is connected to DB")
    })
    .catch(err=>{
        console.log("error connecting to db")
        process.exit(1)
    })
}

module.exports = connectDB;