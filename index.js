const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// CORS সেটআপ
app.use(cors());
app.use(express.json());

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

// Database collections
let doctorsCollection;

async function run() {
  try {
    await client.connect();
    const db = client.db("docapoint2");
    doctorsCollection = db.collection("doctors");
    
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

run();

// রুট
app.get("/", (req, res) => {
  res.send("Doctor Appointment API is running!");
});

// ✅ সব ডাক্তার দেখানোর জন্য (পেজিনেশন সহ)
app.get("/doctors", async (req, res) => {
  try {
    if (!doctorsCollection) {
      return res.status(503).json({
        success: false,
        error: "Database not ready yet"
      });
    }

    const { page = 1, limit = 10, specialty, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // ফিল্টার তৈরি
    let filter = {};
    if (specialty) {
      filter.specialty = { $regex: specialty, $options: 'i' };
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const result = await doctorsCollection
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await doctorsCollection.countDocuments(filter);
    
    res.json({
      success: true,
      data: result,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ টপ রেটেড ডাক্তার (লিমিট সহ)
app.get("/doctors/top-rated", async (req, res) => {
  try {
    if (!doctorsCollection) {
      return res.status(503).json({
        success: false,
        error: "Database not ready yet"
      });
    }

    const limit = parseInt(req.query.limit) || 6;
    
    const result = await doctorsCollection
      .find()
      .sort({ rating: -1 })
      .limit(limit)
      .toArray();
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error fetching top-rated doctors:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ নির্দিষ্ট ডাক্তারের বিস্তারিত তথ্য
app.get("/doctors/:id", async (req, res) => {
  try {
    if (!doctorsCollection) {
      return res.status(503).json({
        success: false,
        error: "Database not ready yet"
      });
    }

    const { id } = req.params;
    
    // ID valid কিনা চেক করুন
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid doctor ID format"
      });
    }
    
    const result = await doctorsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Doctor not found"
      });
    }
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error fetching doctor details:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ⚠️ পুরোনো এন্ডপয়েন্ট (কম্প্যাটিবিলিটির জন্য)
app.get("/all-appointments", async (req, res) => {
  try {
    if (!doctorsCollection) {
      return res.status(503).json({
        success: false,
        error: "Database not ready yet"
      });
    }
    
    const result = await doctorsCollection.find().toArray();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}/doctors`);
  console.log(`📍 http://localhost:${PORT}/doctors/top-rated`);
  console.log(`📍 http://localhost:${PORT}/all-appointments`);
});


// Details apge http://localhost:5000