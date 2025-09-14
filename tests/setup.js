const mongoose = require("mongoose");
require("dotenv").config();

beforeAll(async () => {
  console.log("Conectando a la base de datos de test...");
  // Usamos una DB específica para test
  const uri = process.env.MONGO_URI_TEST || "mongodb://localhost:27017/biblioteca_arrupe_test";
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

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
