const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//MIDDLEWARES
app.use(cors());
app.use(express.json());

//DATABASE CONNECTION
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a85bo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//MAIN FUNCTION
async function run() {
    try {
        await client.connect();
    }
    finally {
        //await client.close();
    }

}

run().catch(console.dir);








//DATABASE RUNNER
console.log(uri);
app.get('/', (req, res) => {
    res.send('RUNNING WATCH FUSION');
});

app.listen(port, () => {
    console.log('WATCH FUSION ON PORT ', port);
})