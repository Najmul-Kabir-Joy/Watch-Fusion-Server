const express = require('express');
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
// watch-fusion-firebase-adminsdk-9orvt-d3e964c75f.json


const serviceAccount = require("./watch-fusion-firebase-adminsdk-9orvt-d3e964c75f.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//MIDDLEWARES
app.use(cors());
app.use(express.json());

//DATABASE CONNECTION
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a85bo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function verifyToken(req, res, next) {
    if (req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;

        } catch {

        }
    }
    next();
}

//MAIN FUNCTION
async function run() {
    try {
        await client.connect();
        const database = client.db('watchFusion');
        const productCollection = database.collection('products');
        const ordersCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('reviews');
        const merchantRequestsCollection = database.collection('merchantRequest');
        // PRODUCT RELATED WORKS
        //GET ALL PRODUCTS
        app.get('/products', async (req, res) => {
            const cursor = productCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.findOne(query);
            res.send(result);
        })
        //ADD NEW PRODUCTS
        app.post('/products', async (req, res) => {
            const data = req.body;
            const time = new Date().toLocaleDateString();
            data.time = time;
            const result = await productCollection.insertOne(data);
            res.json(result);
        })
        //UPDATE A PRODUCT
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const update = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    productName: update.productName,
                    brandName: update.brandName,
                    price: update.price,
                    discount: update.discount,
                    img: update.img,
                    shopName: update.shopName,
                    time: new Date().toLocaleDateString()
                }
            };
            const result = await productCollection.updateOne(filter, updateDoc, options)
            res.json(result);
        })
        //DELETE PRODUCT
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.json(result);
        });

        app.get('/orders', verifyToken, async (req, res) => {
            const requester = req.decodedEmail;
            const cursor = ordersCollection.find({});
            const result = await cursor.toArray();
            if (requester) {
                const requesterAcc = await usersCollection.findOne({ email: requester });
                if (requesterAcc.role === 'admin') {
                    res.send(result);
                }
            } else {
                res.status(403).json({ message: 'FORBIDDENN' });
            }
        });

        app.get('/myorders', verifyToken, async (req, res) => {
            const email = req.query.email;
            const requester = req.decodedEmail;
            if (requester === email) {
                const query = { email: email };
                const cursor = ordersCollection.find(query);
                const result = await cursor.toArray();
                res.json(result);
            } else {
                res.status(403).json({ message: 'FORBIDDEN' })
            }

        });
        //ADD NEW ORDER
        app.post('/orders', async (req, res) => {
            const data = req.body;
            const time = new Date().toLocaleDateString();
            data.time = time;
            const result = await ordersCollection.insertOne(data);
            res.json(result);
        });
        //DELETE AN ORDER
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        });
        //UPDATE AN ORDER
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const update = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: update.status,
                    shipment: update.shipment
                }
            };
            const result = await ordersCollection.updateOne(filter, updateDoc, options)
            res.json(result);
        });

        //USERS WORKS
        //ADD NEW USER
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })
        //USER ADD FOR DIRECT GOOGLE LOGIN
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })
        //CHECKING IF THE USER IS ADMIN
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });
        //MAKING AN USER ADMIN
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            } else {
                res.status(403).json({ message: 'you can not make admin' })
            }

        });
        //REVIEW RELATED WORKS
        //GET ALL REVIEW
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });
        //ADD NEW REVIEW
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            review.date = new Date().toLocaleDateString();
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        })
        //DELETE A REVIEW
        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewsCollection.deleteOne(query);
            res.json(result);
        });

        /* //MERCHANT REQUEST
        app.get('/merchant', async (req, res) => {
            const cursor = merchantRequestsCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });
        //MERCHANT POST
        app.post('/merchant', async (req, res) => {
            const data = req.body;
            data.status = 'pending';
            const result = await merchantRequestsCollection.insertOne(data);
            res.json(result);
        }) */




    }
    finally {
        //await client.close();
    }

}

run().catch(console.dir);








//DATABASE RUNNER
app.get('/', (req, res) => {
    res.send('RUNNING WATCH FUSION');
});

app.listen(port, () => {
    console.log('WATCH FUSION ON PORT ', port);
})