// tests/auth.test.js
const request = require("supertest");
const app = require("../src/config/app"); // importar la app directamente
const Usuario = require("../src/modules/usuarios/usuario.model");
const RefreshToken = require("../src/modules/auth/auth.model");
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

  afterEach(async () => {
    // Limpiar base de datos después de cada test
    await Usuario.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  it("debe autenticar y devolver accessToken y user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: plainPassword })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.mensaje).toBe("Inicio de sesión exitoso");
    
    // Verificar que se estableció la cookie refreshToken
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);
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

describe("POST /api/auth/refreshToken", () => {
  const email = "testuser@example.com";
  const plainPassword = "Test12345!";
  let refreshTokenCookie;

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

    // Hacer login para obtener un refresh token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password: plainPassword });

    // Extraer la cookie de refreshToken
    refreshTokenCookie = loginRes.headers['set-cookie']
      .find(cookie => cookie.startsWith('refreshToken='));
  });

  afterEach(async () => {
    await Usuario.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  it("debe refrescar el token cuando se proporciona un refreshToken válido", async () => {
    const res = await request(app)
      .post("/api/auth/refreshToken")
      .set('Cookie', refreshTokenCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.mensaje).toBe("Token refrescado");
    
    // Verificar que se estableció una nueva cookie refreshToken
    const newCookies = res.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    expect(newCookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);
  });

  it("debe fallar cuando no se proporciona refreshToken", async () => {
    await request(app)
      .post("/api/auth/refreshToken")
      .expect(400);
  });

  it("debe fallar cuando el refreshToken no es válido", async () => {
    await request(app)
      .post("/api/auth/refreshToken")
      .set('Cookie', 'refreshToken=token-invalido')
      .expect(401);
  });

  it("debe fallar cuando el usuario asociado al token no existe", async () => {
    // Obtener token válido
    const res = await request(app)
      .post("/api/auth/refreshToken")
      .set('Cookie', refreshTokenCookie);

    // Eliminar el usuario para simular que ya no existe
    await Usuario.deleteOne({ email });

    // Intentar refrescar con un token de usuario eliminado
    await request(app)
      .post("/api/auth/refreshToken")
      .set('Cookie', refreshTokenCookie)
      .expect(401);
  });
});

describe("POST /api/auth/logout", () => {
  const email = "testuser@example.com";
  const plainPassword = "Test12345!";
  let accessToken;

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

    // Hacer login para obtener access token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password: plainPassword });

    accessToken = loginRes.body.data.accessToken;
  });

  afterEach(async () => {
    await Usuario.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  it("debe cerrar sesión exitosamente con un token válido", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.mensaje).toBe("Cierre de sesión exitoso");

    // Verificar que el refresh token fue revocado
    const tokens = await RefreshToken.find({ usuarioId: res.body.data.user.id });
    const activeTokens = tokens.filter(token => !token.fechaRevocacion);
    expect(activeTokens.length).toBe(0);
  });

  it("debe fallar cuando no se proporciona token de autorización", async () => {
    await request(app)
      .post("/api/auth/logout")
      .expect(401); // El middleware verifyToken debería rechazar la petición
  });

  it("debe fallar cuando se proporciona un token inválido", async () => {
    await request(app)
      .post("/api/auth/logout")
      .set('Authorization', 'Bearer token-invalido')
      .expect(403);
  });

  it("debe limpiar la cookie de refreshToken al hacer logout", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set('Authorization', `Bearer ${accessToken}`);

    // Verificar que se envía el header para limpiar la cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    
    // Buscar la cookie que limpia refreshToken
    const clearCookie = cookies.find(cookie => 
      cookie.includes('refreshToken=;') || 
      cookie.includes('Max-Age=0') ||
      cookie.includes('Expires=Thu, 01 Jan 1970')
    );
    expect(clearCookie).toBeDefined();
  });

  it("debe permitir logout incluso si el usuario ya no existe en la base de datos", async () => {
    // Primero obtenemos el ID del usuario
    const user = await Usuario.findOne({ email });
    
    // Hacemos logout
    const res = await request(app)
      .post("/api/auth/logout")
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Eliminamos el usuario después del logout
    await Usuario.deleteOne({ _id: user._id });

    // Intentar hacer logout de nuevo con el mismo token debería fallar
    await request(app)
      .post("/api/auth/logout")
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});

describe("Flujo completo de autenticación", () => {
  const email = "testuser@example.com";
  const plainPassword = "Test12345!";

  beforeEach(async () => {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const hashed = await bcrypt.hash(plainPassword, saltRounds);
    await Usuario.create({
      nombre: "Test User",
      email,
      password: hashed,
      rol: "estudiante"
    });
  });

  afterEach(async () => {
    await Usuario.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  it("debe completar el flujo login → refresh → logout exitosamente", async () => {
    // 1. Login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password: plainPassword })
      .expect(200);

    const accessToken = loginRes.body.data.accessToken;
    const refreshTokenCookie = loginRes.headers['set-cookie']
      .find(cookie => cookie.startsWith('refreshToken='));

    // 2. Refresh token
    const refreshRes = await request(app)
      .post("/api/auth/refreshToken")
      .set('Cookie', refreshTokenCookie)
      .expect(200);

    const newAccessToken = refreshRes.body.data.accessToken;

    // 3. Logout con el nuevo access token
    await request(app)
      .post("/api/auth/logout")
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200);

    // 4. Verificar que ya no se puede usar el refresh token
    await request(app)
      .post("/api/auth/refreshToken")
      .set('Cookie', refreshTokenCookie)
      .expect(401);
  });
});