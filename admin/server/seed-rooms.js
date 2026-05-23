const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  size: Number,
  category: { type: String, enum: ['vip', 'classic', 'cheap'], default: 'classic' },
  imageUrl: String,
  description: String,
  maxGuests: { type: Number, default: 2 },
  amenities: [String],
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

const roomsData = {
  vip: [
    { name: "Presidential Suite", price: 650, size: 120, imageUrl: "/assets/images/VIProom1.png", description: "Luxury suite with panoramic views" },
    { name: "Royal Deluxe", price: 450, size: 85, imageUrl: "/assets/images/VIProom2.png", description: "Elegant room with a jacuzzi" },
    { name: "Ocean View", price: 380, size: 70, imageUrl: "/assets/images/VIProom3.png", description: "Room with an ocean view" }
  ],
  classic: [
    { name: "Superior Room", price: 220, size: 45, imageUrl: "/assets/images/CLASSICroom1.png", description: "Comfortable classic room" },
    { name: "Deluxe Room", price: 280, size: 55, imageUrl: "/assets/images/CLASSICroom2.png", description: "Spacious room with a balcony" },
    { name: "Executive Room", price: 320, size: 60, imageUrl: "/assets/images/CLASSICroom3.png", description: "Business room with a work area" }
  ],
  cheap: [
    { name: "Standard Room", price: 140, size: 35, imageUrl: "/assets/images/CHEAProom1.png", description: "Cozy economy room" },
    { name: "Economy Room", price: 95, size: 30, imageUrl: "/assets/images/CHEAProom2.png", description: "Budget room with essential amenities" },
    { name: "Single Room", price: 75, size: 25, imageUrl: "/assets/images/CHEAProom3.png", description: "Compact single room" }
  ]
};

async function seed() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
    }

    const count = await Room.countDocuments();
    if (count > 0) {
      console.log('Rooms already exist. Clearing...');
      await Room.deleteMany({});
    }

    let toInsert = [];
    for (const [category, rooms] of Object.entries(roomsData)) {
      rooms.forEach(r => {
        toInsert.push({ ...r, category });
      });
    }

    await Room.insertMany(toInsert);
    console.log(`Successfully seeded ${toInsert.length} rooms`);
    return toInsert.length;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seed };
