const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  admNo: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  registeredAt: { type: Date, default: Date.now },
  registeredFrom: { type: String },
  status: { type: String, default: "active" },
  version: { type: String, default: "1.0.0" }
});

module.exports = mongoose.model('Guest', guestSchema);
