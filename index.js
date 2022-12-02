const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_PASS}@cluster0.p8ggzbb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Access Denied");
  }
  const token = authHeader.split("")[1];
  jwt.verify(token, process.env.DB_AccessToken, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const categoryCollection = client
      .db("Bike-Mart")
      .collection("allbikedetails");
    const bikeCollection = client.db("Bike-Mart").collection("allbikecategory");
    const wishCollection = client.db("Bike-Mart").collection("Wishlist");
    const reportCollection = client.db("Bike-Mart").collection("report");
    const adCollection = client.db("Bike-Mart").collection("Ad");

    const orderCollection = client.db("Bike-Mart").collection("orders");
    const usersCollection = client.db("Bike-Mart").collection("users");
    const sellersCollection = client.db("Bike-Mart").collection("sellers");
    const paymentsCollection = client.db("Bike-Mart").collection("payments");

    app.get("/bikes", async (req, res) => {
      const id = req.params.id;
      const query = {};
      const cursor = await categoryCollection.find(query).toArray();
      const orderQuery = { orderId: id };
      const email = req.query.email;
      const queryEmailSeller = { email: email };
      const orders = await orderCollection.find(queryEmailSeller).toArray();
      const alreadyBooked = await orderCollection.find(orderQuery).toArray();
      cursor.forEach((cur) => {
        const curBooked = alreadyBooked.filter(
          (book) => book.orderId === cur.orderId
        );
        console.log(curBooked);
      });

      res.send(cursor);
    });
    app.get("/bikes/:id", async (req, res) => {
      const id = req.params.id;
      const result = { category_id: id };
      const cursor = await categoryCollection.find(result).toArray();
      res.send(cursor);
    });

  }}