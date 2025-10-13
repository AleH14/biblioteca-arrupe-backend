const UsuarioRepository = require("./usuario.repository");

const UsuarioService = {
  listar: async () => await UsuarioRepository.findAll(),
  obtener: async (id) => await UsuarioRepository.findById(id),
  crear: async (data) => await UsuarioRepository.create(data),
  actualizar: async (id, data) => await UsuarioRepository.update(id, data),
  eliminar: async (id) => await UsuarioRepository.remove(id),
};

module.exports = UsuarioService;
