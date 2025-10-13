// src/server.js
require("dotenv").config();
const app = require("./app");
const connectDB = require("./db");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    // Esperar a que la DB se conecte correctamente antes de iniciar el servidor
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 ${signal} recibido. Cerrando el servidor...`);

      // Cerrar servidor HTTP
      server.close(async () => {
        console.log("🔻 Servidor HTTP cerrado.");

        try {
          // Cerrar conexión con MongoDB
          await mongoose.connection.close(false);
          console.log("🔒 Conexión con MongoDB cerrada correctamente.");
          process.exit(0);
        } catch (err) {
          console.error("❌ Error al cerrar MongoDB:", err);
          process.exit(1);
        }
      });
    };

    // Escuchar señales del sistema
    process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C en terminal
    process.on("SIGTERM", () => shutdown("SIGTERM")); // Parada desde sistema
  } catch (err) {
    console.error("❌ Error al iniciar el servidor:", err);
    process.exit(1);
  }
})();
