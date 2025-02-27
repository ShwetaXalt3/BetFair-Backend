
const mongoose = require("mongoose");
const mergedDataSchema =new mongoose.Schema({
    Match: {type: String},
    strategy: {type: String},
    Amount: {type: Number},
    Type : {type :String},
    // layOdds: {type: Number},
    Odds : {type :Number},
    Status: {type: String},
    Player: {type: String},
    "Profit/Loss": {type: Number},
    // Probability : {type : Number},
    market_id:{type: Number},
    date: {type: String},
    Sport:{type: String}
}
)
const MergedData = mongoose.model("MergeData",mergedDataSchema);
module.exports = MergedData;


