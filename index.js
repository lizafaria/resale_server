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

    app.get("/bikescategory", async (req, res) => {
      const email = req.query.email;
      const queryByEmailForSeller = { email: email };
      const cursor = await bikeCollection.find(query).toArray();
      res.send(cursor);
    });

    app.post("/bikes", async (req, res) => {
      const bikes = req.body;
      const result = await bikeCollection.insertOne(bikes);
      res.send(result);
    });

    app.post("/wishlist", async (req, res) => {
      const bikes = req.body;
      const id = bikes._id;

      const query = {
        _id: new ObjectId(id),
        email: bikes.email,
      };
      const available = await wishCollection.find(query).toArray();
      if (available.length) {
        const message = `You have already added to wishlist this item`;
        return res.send({ acknowledged: false, message });
      }
      const result = await wishCollection.insertOne(bikes);
      res.send(result);
    });

    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      console.log(email);
      const orders = await wishCollection.find(query).toArray();
      res.send(orders);
    });

    app.post("/reports", async (req, res) => {
      const phones = req.body;
      const id = phones._id;

      const query = {
        _id: new ObjectId(id),
        email: phones.email,
      };
      const available = await reportCollection.find(query).toArray();
      if (available.length) {
        const message = `You have reported this Item Already`;
        return res.send({ acknowledged: false, message });
      }
      const result = await reportCollection.insertOne(phones);
      res.send(result);
    });

    app.delete("/reports/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reportCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/reports", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const orders = await reportCollection.find(query).toArray();
      res.send(orders);
    });

  // orders....
  app.get("/orders", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const order = await orderCollection.find(query).toArray();
    res.send(order);
  });

  app.post("/orders", async (req, res) => {
    const order = req.body;
    const query = {
      order_id: order.order_id,
      email: order.email,
    };

    const alreadyordered = await orderCollection.find(query).toArray();
    if (alreadyordered.length) {
      const message = `You have a order for ${order.BikeName} already `;
      return res.send({ acknowledged: false, message });
    }
    const result = await orderCollection.insertOne(order);
    res.send(result);
  });
  // Ad

  app.post("/ad", async (req, res) => {
    const mobiles = req.body;
    const id = mobiles._id;
    const query = {
      _id: ObjectId(id),
      email: mobiles.email,
    };
    const filter = { _id: ObjectId(id) };
    const updatedDoc = {
      $set: {
        advertiesed: true,
      },
    };
    const updateFilter = await adCollection.updateOne(filter, updatedDoc);
    const result = await adCollection.insertOne(mobiles);
    res.send(result);
  });

  app.get("/ad", async (req, res) => {
    const query = {};
    const mobile = await adCollection.find(query).toArray();
    res.send(mobile);
  });

  // JWT...
  app.get("/jwt", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    if (user && user?.email) {
      const token = jwt.sign({ email }, process.env.DB_AccessToken, {
        expiresIn: "23h",
      });
      return res.send({ accessToken: token });
    }
    res.status(403).send({ accessToken: "Restricted Access" });
  });

  // Users....
  app.post("/allusers", async (req, res) => {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    res.send(result);
  });

  app.get("/users/admin/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email };
    const user = await usersCollection.findOne(query);
    res.send({ isAdmin: user?.role === "admin" });
  });
  app.get("/users/seller/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email };
    const user = await usersCollection.findOne(query);
    res.send({ isSeller: user?.role === "seller" });
  });
  app.get("/users", async (req, res) => {
    const query = {};
    const users = await usersCollection.find(query).toArray();
    res.send(users);
  });
  app.delete("/users/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await usersCollection.deleteOne(query);
    res.send(result);
  });
} finally {
}
}

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
res.send("Server is running");
});

app.listen(port, () => {
console.log(`Server is running on ${port}`);
});
