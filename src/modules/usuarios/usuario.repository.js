const Usuario = require("./usuario.model");

const UsuarioRepository = {
  findAll: () => Usuario.find(),
  findById: (id) => Usuario.findById(id),
  create: (data) => Usuario.create(data),
  update: (id, data) => Usuario.findByIdAndUpdate(id, data, { new: true }),
  remove: (id) => Usuario.findByIdAndDelete(id)
};

module.exports = UsuarioRepository;
