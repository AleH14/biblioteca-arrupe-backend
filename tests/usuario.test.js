const Usuario = require("../src/modules/usuarios/usuario.model");

describe("Modelo Usuario", () => {
  it("debe crear un usuario válido", async () => {
    const user = await Usuario.create({
      nombre: "Juan Pérez",
      email: "juan@example.com",
      password: "hashed_password",
      telefono: "555-12345",
      rol: "estudiante"
    });

    expect(user._id).toBeDefined();
    expect(user.email).toBe("juan@example.com");
    expect(user.rol).toBe("estudiante");
    expect(user.activo).toBe(true);
  });

  it("no debe permitir emails duplicados", async () => {
    // Asegurar que los índices estén creados
    await Usuario.ensureIndexes();
    
    // Crear el primer usuario
    await Usuario.create({
      nombre: "Usuario 1",
      email: "test@example.com",
      password: "123456"
    });

    // Intentar crear un segundo usuario con el mismo email debe fallar
    await expect(Usuario.create({
      nombre: "Usuario 2",
      email: "test@example.com",
      password: "abcdef"
    })).rejects.toThrow();
  });
});
