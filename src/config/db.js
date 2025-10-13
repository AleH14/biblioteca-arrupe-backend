// src/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,       // 🔹 Máximo número de conexiones simultáneas (ajusta según tu carga)
      minPoolSize: 2,        // 🔹 Mantiene algunas conexiones abiertas
      serverSelectionTimeoutMS: 5000, // 🔹 Tiempo máximo para encontrar un servidor (5 seg)
      socketTimeoutMS: 45000,         // 🔹 Cierra sockets inactivos tras 45 seg
      connectTimeoutMS: 10000,        // 🔹 Timeout al intentar conectar
      family: 4                       // 🔹 Forzar IPv4 si hay problemas con IPv6
    };

    await mongoose.connect(process.env.MONGO_URI, options);

    console.log("✅ MongoDB conectado correctamente (con pool de conexiones)");
    console.log(`🔹 Tamaño del pool: ${options.maxPoolSize}`);
  } catch (err) {
    console.error("❌ Error al conectar con MongoDB:", err.message);
    process.exit(1);
  }

  // Manejo de eventos globales del pool
  mongoose.connection.on("connected", () => console.log("🟢 Pool de MongoDB activo"));
  mongoose.connection.on("disconnected", () => console.warn("🟠 Pool desconectado"));
  mongoose.connection.on("error", (err) => console.error("🔴 Error de conexión:", err));
};

module.exports = connectDB;
