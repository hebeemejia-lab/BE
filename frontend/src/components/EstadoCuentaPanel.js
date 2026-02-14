import React, { useState } from 'react';
import BuscadorUsuarios from './BuscadorUsuarios';
import EstadoCuentaUsuario from './EstadoCuentaUsuario';

const EstadoCuentaPanel = () => {
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  return (
    <div>
      <h2>Buscar usuario y ver estado de cuenta</h2>
      <BuscadorUsuarios onSelectUsuario={setUsuarioSeleccionado} />
      {usuarioSeleccionado && (
        <EstadoCuentaUsuario usuario={usuarioSeleccionado} />
      )}
    </div>
  );
};

export default EstadoCuentaPanel;
