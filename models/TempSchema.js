const mongoose = require('mongoose');

const TempBetSchema = new mongoose.Schema({
  marketId: { type: String, required: true },
  selectionId: { type: String, required: true },
  amount: { type: Number, default: null },
  odds: { type: Number,  required: true },
  side: { type: String, enum: ['BACK', 'LAY'], required: true },
  status: { type: String, enum: ['MATCHED', 'UNMATCHED'], default: 'UNMATCHED' },
  matchName: { type: String },
  playerName: { type: String },
  eventName: { type: String },
  strategy: { type: String },
  date: { type: Date, default: Date.now }
});

const TempBet = mongoose.model('TempBet', TempBetSchema);

module.exports = TempBet;