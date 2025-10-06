// tests/auth.test.js
const request = require("supertest");
const app = require("../src/app"); // importar la app directamente
const Usuario = require("../src/models/Usuario");
const bcrypt = require("bcrypt");

describe("POST /api/auth/login", () => {
  const email = "testuser@example.com";
  const plainPassword = "Test12345!";

  beforeEach(async () => {
    // crear usuario con password hasheado
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const hashed = await bcrypt.hash(plainPassword, saltRounds);
    await Usuario.create({
      nombre: "Test User",
      email,
      password: hashed,
      rol: "estudiante"
    });
  });

  it("debe autenticar y devolver token y user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: plainPassword })
      .expect(200);

    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it("debe fallar con credenciales incorrectas", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrongpassword" })
      .expect(401);
  });

  it("debe fallar si falta un campo", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email })
      .expect(400);
  });
});
