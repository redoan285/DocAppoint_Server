const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();  // ⚠️ app প্রথমে ডিক্লেয়ার করুন

// CORS সেটআপ - সব অনুমতি (ডেভেলপমেন্টের জন্য)
app.use(cors());
app.use(express.json());  // একবারই যথেষ্ট

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// MongoDB ক্লায়েন্ট
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// outside variable
let allDoctors;

async function run() {
  try {
    await client.connect();
    const db = client.db("docapoint2");
    allDoctors = db.collection("doctors");
    
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

run();

// রাউটগুলি
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/doctors", async (req, res) => {
  try {
    // allDoctors রেডি কিনা চেক করুন
    if (!allDoctors) {
      return res.status(503).json({
        success: false,
        error: "Database not ready yet"
      });
    }

    const result = await allDoctors
      .find()
      .sort({ rating: -1 }) 
      .limit(3)
      .toArray();

    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error fetching doctors:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


app.get("/all-appointments", async(req, res) =>{
  const result = await allDoctors.find().toArray();
  res.json(result);
})


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 CORS enabled for all origins`);
  console.log(`📍 http://localhost:${PORT}/doctors`);
});