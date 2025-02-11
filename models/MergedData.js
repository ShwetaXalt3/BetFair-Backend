
const mongoose = require("mongoose");
const mergedDataSchema =new mongoose.Schema({
    Amount: {type: Number},
    Match: {type: String},
    layOdds: {type: Number},
    backOdds : {type :Number},
    Player: {type: String},
    ProfitLoss: {type: Number},
    Status: {type: String},
    // Probability : {type : Number},
    Type : {type :String},
    date: {type: String},
    market_id:{type: Number},
    strategy: {type: String},
    Sport:{type: String}
}
)
const MergedData = mongoose.model("MergeData",mergedDataSchema);
module.exports = MergedData;


