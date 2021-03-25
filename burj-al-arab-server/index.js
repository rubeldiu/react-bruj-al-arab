const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
//const admin = require('firebase-admin');
const app = express();

const port = 5000;

app.use(cors());
app.use(bodyParser.json());

require('dotenv').config()


const admin = require("firebase-admin");

const serviceAccount = require("./configs/buruj-al-firebase-adminsdk-l75we-58e92f3aa7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const MongoClient = require("mongodb").MongoClient;
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ulzfk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");

  //Insert Data
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // Read Data
  app.get("/bookings", (req, res) => {
    // console.log(req.query.email);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
          let uid = decodedToken.uid;
          let tokenEmail = decodedToken.email;
          let queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings
              .find({
                email: queryEmail,
              })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              });
          } else {
            res.status(401).send("unauthorized access");
          }
        })
        .catch((error) => {
          res.status(401).send("unauthorized access");
        });
    } else {
      res.status(401).send("unauthorized access");
    }
  });

  console.log("database connected");
});

app.listen(port);
