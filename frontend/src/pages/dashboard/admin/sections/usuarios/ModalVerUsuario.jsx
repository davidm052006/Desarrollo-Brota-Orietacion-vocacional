import Modal from '../../components/Modal';
import { Detalle } from '../../components/formPrimitives';
import { formatFecha } from '../../components/formatFecha';
import { ROL_COLORS } from './constants';

// Modal de solo lectura con el detalle completo de un usuario.
export default function ModalVerUsuario({ usuario, onClose }) {
  return (
    <Modal title="Detalle del usuario" onClose={onClose}>
      <div className="space-y-1">
        <Detalle label="Nombre completo"  value={`${usuario.nombre} ${usuario.apellido}`} />
        <Detalle label="Ciudad"           value={usuario.ciudad} />
        <Detalle label="Nivel educativo"          value={usuario.nivel_educativo} />
        <Detalle label="Cond. socioeconómicas"    value={usuario.condiciones_socioeconomicas} />
        <Detalle label="Edad"                     value={usuario.edad} />
        <Detalle label="Rol"
          value={
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROL_COLORS[usuario.rol] || 'bg-gray-100'}`}>
              {usuario.rol}
            </span>
          }
        />
        <Detalle label="Fecha de registro" value={formatFecha(usuario.created_at)} />
      </div>
    </Modal>
  );
}
