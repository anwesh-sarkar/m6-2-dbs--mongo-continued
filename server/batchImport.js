const { MongoClient } = require("mongodb");
require("dotenv").config();
const { MONGO_URI } = process.env;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const assert = require("assert");

const seats = {};
const row = ["A", "B", "C", "D", "E", "F", "G", "H"];
for (let r = 0; r < row.length; r++) {
  for (let s = 1; s < 13; s++) {
    seats[`${row[r]}-${s}`] = {
      _id: `${row[r]}-${[s]}`,
      price: 225,
      isBooked: false,
    };
  }
}

const batchImport = async (req, res) => {
  const client = await MongoClient(MONGO_URI, options);
  try {
    await client.connect();

    const db = await client.db("Workshop6-2");
    const r = await db.collection("seats").insertMany(Object.values(seats));
    assert.strictEqual(Object.values(seats).length, r.insertedCount);
  } catch (err) {
    console.log(err.stack);
  }
  client.close();
};

batchImport();
