"use strict";
const { Typography } = require("@material-ui/core");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const { MONGO_URI } = process.env;

const assert = require("assert");

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const NUM_OF_ROWS = 8;
const SEATS_PER_ROW = 12;

//////// HELPERS
const getRowName = (rowIndex) => {
  return String.fromCharCode(65 + rowIndex);
};

const randomlyBookSeats = (num) => {
  const bookedSeats = {};

  while (num > 0) {
    const row = Math.floor(Math.random() * NUM_OF_ROWS);
    const seat = Math.floor(Math.random() * SEATS_PER_ROW);

    const seatId = `${getRowName(row)}-${seat + 1}`;

    bookedSeats[seatId] = true;

    num--;
  }

  return bookedSeats;
};

let state;

const getSeats = async (req, res) => {
  const client = await MongoClient(MONGO_URI, options);

  if (!state) {
    state = {
      bookedSeats: randomlyBookSeats(30),
    };
  }

  try {
    await client.connect();
    const db = await client.db("Workshop6-2");
    const allSeats = await db.collection("seats").find().toArray();
    console.log(allSeats);

    let seats = {};
    allSeats.forEach((seat) => {
      seats[seat._id] = seat;
    });

    res.json({
      seats: seats,
      bookedSeats: state.bookedSeats,
      numOfRows: 8,
      seatsPerRow: 12,
    });
  } catch (err) {
    console.log(err.stack);
  }
};

let lastBookingAttemptSucceeded = false;

const bookSeat = async (req, res) => {
  const { seatId, creditCard, expiration, fullName, email } = req.body;

  const client = await MongoClient(MONGO_URI, options);
  await client.connect();
  const db = await client.db("Workshop6-2");
  const bookedSeat = await db.collection("seats").findOne({ _id: seatId });

  if (bookedSeat.isBooked) {
    return res.status(400).json({
      message: "This seat has already been booked!",
    });
  }

  if (!fullName || !email) {
    return res.status(400).json({
      status: 400,
      message: "Please provide full name and email!",
    });
  }

  if (!creditCard || !expiration) {
    return res.status(400).json({
      status: 400,
      message: "Please provide credit card information!",
    });
  }

  if (lastBookingAttemptSucceeded) {
    lastBookingAttemptSucceeded = !lastBookingAttemptSucceeded;

    return res.status(500).json({
      message: "An unknown error has occurred. Please try your request again.",
    });
  }

  lastBookingAttemptSucceeded = !lastBookingAttemptSucceeded;
  const newValues = {
    $set: { isBooked: true, fullName, email, creditCard, expiration },
  };
  const updateSeat = await db
    .collection("seats")
    .updateOne({ _id: seatId }, newValues);

  assert.strictEqual(1, updateSeat.modifiedCount);

  return res.status(200).json({
    status: 200,
    success: true,
  });
};
module.exports = { getSeats, bookSeat };
