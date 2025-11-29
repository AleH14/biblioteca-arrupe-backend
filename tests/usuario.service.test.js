const UsuarioService = require("../src/modules/usuarios/usuario.service");
const UsuarioRepository = require("../src/modules/usuarios/usuario.repository");
const hash = require("../src/core/utils/hash");

// Mocks
jest.mock("../src/modules/usuarios/usuario.repository");
jest.mock("../src/core/utils/hash");

describe("UsuarioService", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // crearUsuario
    // =============================================
    describe("crearUsuario", () => {
        it("debería crear un usuario y sanitizarlo", async () => {
            const data = {
                nombre: "Juan",
                email: "juan@test.com",
                password: "12345"
            };

            const hashed = "hashedPassword123";
            hash.hashPassword.mockResolvedValue(hashed);

            const usuarioDB = {
                toObject: () => ({
                    _id: "1",
                    nombre: "Juan",
                    email: "juan@test.com",
                    password: hashed
                })
            };

            UsuarioRepository.create.mockResolvedValue(usuarioDB);

            const result = await UsuarioService.crearUsuario(data);

            expect(hash.hashPassword).toHaveBeenCalledWith("12345");
            expect(UsuarioRepository.create).toHaveBeenCalled();
            expect(result.password).toBeUndefined();
            expect(result.email).toBe("juan@test.com");
        });

        it("debería lanzar error si falta la contraseña", async () => {
            await expect(
                UsuarioService.crearUsuario({ nombre: "Juan" })
            ).rejects.toThrow("La contraseña es obligatoria");
        });
    });

    // =============================================
    // buscarUsuarios
    // =============================================
    describe("buscarUsuarios", () => {
        it("debería buscar por nombre", async () => {
            const usuariosMock = [
                { toObject: () => ({ nombre: "Ana", password: "xx" }) }
            ];

            UsuarioRepository.findByName.mockResolvedValue(usuariosMock);

            const result = await UsuarioService.buscarUsuarios({ nombre: "Ana" });

            expect(UsuarioRepository.findByName).toHaveBeenCalledWith("Ana");
            expect(result[0].password).toBeUndefined();
        });

        it("debería buscar por email", async () => {
            const usuarioMock = {
                toObject: () => ({ email: "test@test.com", password: "xx" })
            };

            UsuarioRepository.findByEmail.mockResolvedValue([usuarioMock]);

            const result = await UsuarioService.buscarUsuarios({ email: "test@test.com" });

            expect(UsuarioRepository.findByEmail).toHaveBeenCalledWith("test@test.com");
            expect(result[0].password).toBeUndefined();
        });

        it("debería traer todos los usuarios si no hay filtros", async () => {
            const usuariosMock = [
                { toObject: () => ({ email: "a@test.com", password: "xx" }) },
                { toObject: () => ({ email: "b@test.com", password: "yy" }) }
            ];

            UsuarioRepository.findAll.mockResolvedValue(usuariosMock);

            const result = await UsuarioService.buscarUsuarios({});

            expect(UsuarioRepository.findAll).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });
    });

    // =============================================
    // obtenerUsuarioById
    // =============================================
    describe("obtenerUsuarioById", () => {
        it("debería regresar usuario sin contraseña", async () => {
            const usuarioMock = {
                toObject: () => ({ _id: "1", email: "aaa@test.com", password: "secret" })
            };

            UsuarioRepository.findById.mockResolvedValue(usuarioMock);

            const result = await UsuarioService.obtenerUsuarioById("1");

            expect(UsuarioRepository.findById).toHaveBeenCalledWith("1");
            expect(result.password).toBeUndefined();
        });
    });

    // =============================================
    // editarUsuario
    // =============================================
    describe("editarUsuario", () => {
        it("debería editar y hashear contraseña si viene en el payload", async () => {
            hash.hashPassword.mockResolvedValue("hashed123");

            const usuarioMock = {
                toObject: () => ({ email: "edit@test.com", password: "hashed123" })
            };

            UsuarioRepository.update.mockResolvedValue(usuarioMock);

            const result = await UsuarioService.editarUsuario("1", { password: "abc" });

            expect(hash.hashPassword).toHaveBeenCalledWith("abc");
            expect(UsuarioRepository.update).toHaveBeenCalled();
            expect(result.password).toBeUndefined();
        });

        it("debería editar sin tocar la contraseña si no se envía", async () => {
            const usuarioMock = {
                toObject: () => ({ email: "edit@test.com", password: "oldpass" })
            };

            UsuarioRepository.update.mockResolvedValue(usuarioMock);

            const result = await UsuarioService.editarUsuario("1", { nombre: "Nuevo" });

            expect(hash.hashPassword).not.toHaveBeenCalled();
            expect(result.password).toBeUndefined();
        });
    });

    // =============================================
    // deshabilitarUsuario
    // =============================================
    describe("deshabilitarUsuario", () => {
        it("debería deshabilitar un usuario", async () => {
            const usuarioMock = {
                toObject: () => ({ email: "aaa@test.com", disabled: true, password: "xx" })
            };

            UsuarioRepository.disable.mockResolvedValue(usuarioMock);

            const result = await UsuarioService.deshabilitarUsuario("1");

            expect(UsuarioRepository.disable).toHaveBeenCalledWith("1");
            expect(result.password).toBeUndefined();
            expect(result.disabled).toBe(true);
        });
    });
});
