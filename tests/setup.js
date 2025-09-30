const mongoose = require("mongoose");
require("dotenv").config();

beforeAll(async () => {
  console.log("Conectando a la base de datos de test...");
  // Usamos una DB específica para test - usar mongo:27017 para contenedor
  const uri = process.env.MONGO_URI_TEST;
  await mongoose.connect(uri);
  
  // Asegurar que los índices se creen
  const models = mongoose.modelNames();
  for (const modelName of models) {
    await mongoose.model(modelName).ensureIndexes();
  }
}, 10000); // Aumentar timeout a 10 segundos

afterEach(async () => {
  // Limpiar colecciones después de cada test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  // Cerrar conexión al terminar
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
