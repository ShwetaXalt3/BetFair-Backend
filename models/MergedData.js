// const mongoose = require('mongoose');

// // Define the schema for merged data
// const mergedDataSchema = new mongoose.Schema(
//   {
//     username: { type: String, required: true },
//     eventName: { type: String, required: true },
//     eventId: { type: String, required: true }, // You can change this to ObjectId if it's referenced from another model
//     sportName: { type: String, required: true },
//     sportId: { type: String, required: true }, // You can change this to ObjectId if it's referenced from another model
//     matchName: { type: String, required: true },
//     playerName: { type: String, required: true },
//     matchStatus: { type: String, required: true },
//     profit: { type: Number, required: true, min: 0 }, // Ensures profit is a positive number
//     odds: { type: Number, required: true, min: 0 }, // Ensures odds are a positive number
    
//   },
//   { timestamps: true } // Automatically adds createdAt and updatedAt fields
// );

// // Index for better querying performance (optional)
// mergedDataSchema.index({ eventId: 1, sportId: 1 }); // Example of a compound index

// const MergedData = mongoose.model('MergedData', mergedDataSchema);

// module.exports = MergedData;


const mongoose = ("mongoose");
const mergedDataSchema =new mongoose.Schema({
    Amount: {type: String},
    Match: {type: String},
    Odds: {type: Number},
    Player: {type: String},
    ProfitLoss: {type: Number},
    Status: {type: String},
    Type: {type: String},
    date: {type: Date},
    market_id:{type: Number},
    strategy: {type: String},
    Sport:{type: String}
}
)
const mergedData =mongoose.model("MergeData",mergedDataSchema);
module.exports=mergedData;


