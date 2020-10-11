
const MongoClient = require('mongodb').MongoClient;

// Database Name
const dbName = 'sonoffDB';
const mongoUrl = 'mongodb://localhost:27017/';

var dbConn = null;

async function connect() {
    if (dbConn) return dbConn;
    try {
        const client = await MongoClient.connect(mongoUrl,{useUnifiedTopology: true, useNewUrlParser: true});
        const db = client.db(dbName);
        dbConn = db;
        return db;
    } catch(err) {
        console.log('Cannot Connect to DB', err)
        throw err;
    }
}


async function getCollection(collectionName) {
    const db = await connect();
    return db.collection(collectionName);
}

module.exports = {
    connect,
    getCollection
}