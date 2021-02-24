const mongoonse = require('mongoose');

const connectDB = async ()=>{
    try{
        const connect = await mongoonse.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true  
        });
        console.log(`MongoDb connected: ${connect.connection.host}`);
    }
    catch(err){
        if(err) console.log(err);
    }
}

module.exports = connectDB;