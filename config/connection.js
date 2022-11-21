const MongoClient=require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=((done)=>{

    // local db connection
    // const url='mongodb://localhost:27017'
    
    // Atlas Db Connection 

    //change mongodb password to env
    

    const url = 'mongodb+srv://nextgen-admin:pKmrgXuxaANtkecN@cluster0.elzql1z.mongodb.net/?retryWrites=true&w=majority'


    const dbname='nextgen'
    MongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
})
module.exports.get=(()=>state.db)