import Button from '../Shared/Button';

function CuentaBloqueada({ hasta, onSalir }) {
  const fecha = hasta
    ? new Date(hasta).toLocaleString('es-CO', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : null;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="modal-card-in w-full max-w-md text-center p-8 rounded-[var(--radius-md)]"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          className="mx-auto mb-5 flex items-center justify-center rounded-full"
          style={{
            width: 72,
            height: 72,
            background: 'var(--accent-soft)',
          }}
        >
          <span style={{ fontSize: 32 }}>🔒</span>
        </div>

        <h1
          className="font-display"
          style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}
        >
          Cuenta bloqueada
        </h1>

        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 8 }}>
          Un administrador ha restringido temporalmente el acceso a tu cuenta.
        </p>

        {fecha ? (
          <div
            className="rounded-[var(--radius-md)]"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              padding: '14px 16px',
              margin: '20px 0',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4 }}>
              Podrás volver a ingresar el
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {fecha}
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--ink)', margin: '20px 0', fontWeight: 600 }}>
            Tu cuenta permanecerá bloqueada hasta que un administrador la desbloquee.
          </p>
        )}

        <Button onClick={onSalir} variant="primary" className="w-full justify-center">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}

export default CuentaBloqueada;