// Envuelve un handler de Express async para no repetir el mismo try/catch
// en cada controlador. `label` se usa solo para identificar el origen en
// los logs de error (mismo formato que antes: "controller.funcion: err").
function asyncHandler(label, fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error(`${label}:`, err);
      res.status(500).json({ success: false, message: err.message });
    }
  };
}

module.exports = asyncHandler;
