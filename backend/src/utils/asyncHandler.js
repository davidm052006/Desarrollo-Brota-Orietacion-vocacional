const { responderErrorInterno } = require('./errorInterno');

// Envuelve un handler de Express async para no repetir el mismo try/catch
// en cada controlador. `label` se usa solo para identificar el origen en
// los logs de error (mismo formato que antes: "controller.funcion: err").
// El cliente recibe un 500 genérico: el detalle del error queda solo en el log.
function asyncHandler(label, fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      responderErrorInterno(res, label, err);
    }
  };
}

module.exports = asyncHandler;
