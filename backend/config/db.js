const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Clean up old unique indexes on Booking collection
    try {
      const db = mongoose.connection.db;
      const bookingCollection = db.collection('bookings');
      
      // Get all indexes
      const indexes = await bookingCollection.listIndexes().toArray();

      
      // Drop problematic unique indexes
      for (const index of indexes) {
        if ((index.name === 'event_1_user_1' || index.name === 'event_1_seatNumber_1' || index.name === 'user_1_event_1') && index.unique) {
          await bookingCollection.dropIndex(index.name);

        }
      }
    } catch (indexError) {

    }
  } catch (error) {
    console.error(`❌ DB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;