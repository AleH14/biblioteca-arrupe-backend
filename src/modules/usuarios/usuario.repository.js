const Usuario = require("./usuario.model");

const UsuarioRepository = {
  findByName: (nombre) => Usuario.find({ nombre: new RegExp(nombre, 'i') }),
  findByEmail: (email) => Usuario.find({ email: new RegExp(email, 'i') }),
  findAll: () => Usuario.find(),
  findById: (id) => Usuario.findById(id),
  create: (data) => Usuario.create(data),
  update: (id, data) => Usuario.findByIdAndUpdate(id, data, { new: true }),

  disable: (id) => Usuario.findByIdAndUpdate(id, { activo: false }, { new: true }),
};

module.exports = UsuarioRepository;
