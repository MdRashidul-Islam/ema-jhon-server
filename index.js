const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const { MongoClient } = require("mongodb");

const stripe = require("stripe")(process.env.STRIPE_SECRET);

const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1wea1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    const database = client.db("ema_jhon");
    const productsCollection = database.collection("products");
    const orderCollection = database.collection("orders");
    const shoppingCollection = database.collection("shoppingCart");

    app.get("/allProducts", async (req, res) => {
      const cursor = await productsCollection.find({}).toArray();
      res.json(cursor);
    });

    app.get("/products", async (req, res) => {
      const page = req.query.page;
      const size = parseInt(req.query.size);
      const count = await productsCollection.countDocuments();
      let products;
      if (page) {
        products = await productsCollection
          .find({})
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        products = await productsCollection.find({}).toArray();
      }
      res.send({ products, count });
    });

    app.post("/products/keys", async (req, res) => {
      const keys = req.body;

      const query = { key: { $in: keys } };

      const products = await productsCollection.find(query).toArray();

      res.json(products);
    });

    //get order collection
    app.get("/orders", async (req, res) => {
      const cursor = await orderCollection.find({}).toArray();
      res.json(cursor);
    });

    app.post("/payments/create", async (req, res) => {
      const grandTotal = req.query.total;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: grandTotal,
        currency: "usd",
      });
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Ema-Jhon");
});

app.listen(port, () => {
  console.log(`Find port:${port}`);
});
