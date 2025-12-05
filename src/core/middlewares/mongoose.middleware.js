//src/core/middleware/mongoose.middleware.js

// Función auxiliar para validar ObjectId de MongoDB
exports.isValidObjectId = (id) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(id);
}