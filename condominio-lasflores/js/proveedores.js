// CORRECCIÓN COMPLETA DE proveedores.js
let proveedores = [];
let proveedoresFiltrados = [];
let paginaActual = 1;
const registrosPorPagina = 10;
let modalProveedor;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inicializando módulo...');

    try {
        await cargarProveedores(); // Función real de carga
    } catch(error) {
        console.error('Error fatal:', error);
        alert('Error al inicializar el módulo');
    }
});

// Carga proveedores desde la API (puedes agregar filtros; típicamente no se filtra mucho acá)
async function cargarProveedores(filtros = {}) {
    try {
        let url = 'proveedores.php?action=listar';
        const params = [];
        if (filtros.rut) params.push(`rut=${encodeURIComponent(filtros.rut)}`);
        if (filtros.nombre) params.push(`nombre=${encodeURIComponent(filtros.nombre)}`);
        if (params.length > 0) url += '&' + params.join('&');

        const response = await Utils.fetchAPI(url, 'GET');
        if (response && response.success && response.data) {
            proveedores = response.data;
            filtrarYPaginarProveedores();
        } else {
            proveedores = [];
            filtrarYPaginarProveedores();
            Utils.showAlert('No se encontraron proveedores.', 'warning');
        }
    } catch (error) {
        proveedores = [];
        filtrarYPaginarProveedores();
        Utils.showAlert('Error al cargar proveedores.', 'danger');
    }
}

function filtrarYPaginarProveedores() {
    proveedoresFiltrados = proveedores.slice();
    mostrarProveedoresPaginados();
}

function mostrarProveedoresPaginados() {
    const tbody = document.getElementById('tablaProveedores');
    if (!tbody) return;

    const desde = (paginaActual - 1) * registrosPorPagina;
    const hasta = desde + registrosPorPagina;
    const pagina = proveedoresFiltrados.slice(desde, hasta);

    if (!pagina || pagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No hay proveedores registrados</td></tr>';
        return;
    }
    tbody.innerHTML = pagina.map(prov => `
        <tr>
            <td>${prov.rut || ''}</td>
            <td>${prov.nombre || ''}</td>
            <td>${prov.categoria || ''}</td>
            <td>${prov.giro || ''}</td>
            <td>${prov.telefono || ''}</td>
            <td>${prov.email || ''}</td>
            <td>${prov.nombre_contacto || ''}</td>
            <td>${prov.estado || ''}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarProveedor('${prov.id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger" onclick="eliminarProveedor('${prov.id}')"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// Editar proveedor
window.editarProveedor = function (id) {
    Utils.fetchAPI(`proveedores.php?action=obtener&id=${encodeURIComponent(id)}`, 'GET')
        .then(response => {
            if (response.success && response.data) {
                // Completa el form de edición con los datos
                document.getElementById('rutProveedor').value = response.data.rut;
                document.getElementById('nombreProveedor').value = response.data.nombre;
                // ...otros campos...
                modalProveedor.show();
            } else {
                Utils.showAlert('No se encontraron datos del proveedor.', 'warning');
            }
        })
        .catch(() => Utils.showAlert('Error al obtener datos del proveedor.', 'danger'));
};
// Eliminar proveedor
window.eliminarProveedor = function (id) {
    Utils.showConfirm(
        'Eliminar proveedor',
        `¿Seguro que deseas eliminar este proveedor?`,
        async () => {
            try {
                const response = await Utils.fetchAPI(`proveedores.php?action=eliminar&id=${encodeURIComponent(id)}`, 'DELETE');
                if (response.success) {
                    Utils.showAlert('Proveedor eliminado correctamente.', 'success');
                    await cargarProveedores();
                } else {
                    Utils.showAlert(response.message || 'No se pudo eliminar el proveedor.', 'danger');
                }
            } catch {
                Utils.showAlert('Error al eliminar el proveedor.', 'danger');
            }
        }
    );
};

// Agrega lógica para crear o actualizar proveedores usando POST o PUT

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚚 Inicializando módulo de proveedores...');
    inicializarProveedores();
});

async function inicializarProveedores() {
    try {
        modalProveedor = new bootstrap.Modal(document.getElementById('modalProveedor'));

        await cargarProveedores();

        document.getElementById('btnGuardarProveedor').addEventListener('click', guardarProveedor);
        document.getElementById('btnBuscar').addEventListener('click', buscarProveedores);
        document.getElementById('btnLimpiar').addEventListener('click', limpiarBusqueda);

        document.getElementById('modalProveedor').addEventListener('show.bs.modal', limpiarFormulario);

    } catch (error) {
        console.error('Error al inicializar proveedores:', error);
        Utils.showAlert('Error al inicializar el módulo', 'danger');
    }
}

async function cargarProveedores() {
    try {
        await new Promise(resolve => setTimeout(resolve, 600));

        const proveedores = [
            {
                id: 1,
                rut: '76.543.210-1',
                nombre: 'Aguas Andinas S.A.',
                categoria: 'SERVICIOS',
                telefono: '+56222345678',
                email: 'contacto@aguasandinas.cl',
                nombre_contacto: 'Roberto Sánchez',
                telefono_contacto: '+56988776655',
                estado: 'ACTIVO'
            },
            {
                id: 2,
                rut: '65.432.109-2',
                nombre: 'Chilquinta Energía',
                categoria: 'SERVICIOS',
                telefono: '+56222456789',
                email: 'clientes@chilquinta.cl',
                nombre_contacto: 'Ana Fernández',
                telefono_contacto: '+56977665544',
                estado: 'ACTIVO'
            },
            {
                id: 3,
                rut: '54.321.098-3',
                nombre: 'Servicio de Limpieza ABC Ltda.',
                categoria: 'LIMPIEZA',
                telefono: '+56222567890',
                email: 'abc@limpieza.cl',
                nombre_contacto: 'Carlos Muñoz',
                telefono_contacto: '+56966554433',
                estado: 'ACTIVO'
            },
            {
                id: 4,
                rut: '43.210.987-4',
                nombre: 'Seguridad Total S.A.',
                categoria: 'SEGURIDAD',
                telefono: '+56222678901',
                email: 'info@seguridadtotal.cl',
                nombre_contacto: 'Laura Rojas',
                telefono_contacto: '+56955443322',
                estado: 'ACTIVO'
            }
        ];

        const tbody = document.getElementById('tablaProveedores');
        if (!tbody) return;

        if (proveedores.length > 0) {
            tbody.innerHTML = proveedores.map(prov => `
                <tr>
                    <td>${prov.id}</td>
                    <td>${Utils.formatearRUT(prov.rut)}</td>
                    <td>${prov.nombre}</td>
                    <td><span class="badge bg-info">${prov.categoria}</span></td>
                    <td>${prov.telefono}</td>
                    <td>${prov.email}</td>
                    <td>${prov.nombre_contacto}</td>
                    <td>
                        <span class="badge bg-${prov.estado === 'ACTIVO' ? 'success' : 'secondary'}">
                            ${prov.estado}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editarProveedor(${prov.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarProveedor(${prov.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            actualizarResumen(proveedores);
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted">
                        No se encontraron proveedores
                    </td>
                </tr>
            `;
            actualizarResumen([]);
        }

    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        Utils.showAlert('Error al cargar los proveedores', 'danger');
    }
}
function actualizarResumen(proveedores) {
    const totalProveedores = proveedores.length;
    const totalActivos = proveedores.filter(p => p.estado === 'ACTIVO').length;
    const gastoAnual = 2500000;

    const totalProveedoresElem = document.getElementById('totalProveedores');
    const totalActivosElem = document.getElementById('totalActivos');
    const gastoAnualElem = document.getElementById('gastoAnual');

    if (totalProveedoresElem) totalProveedoresElem.textContent = totalProveedores;
    if (totalActivosElem) totalActivosElem.textContent = totalActivos;
    if (gastoAnualElem) gastoAnualElem.textContent = Utils.formatearMonto(gastoAnual);
}

function buscarProveedores() {
    const busqueda = document.getElementById('buscarProveedor').value.toLowerCase();
    const categoria = document.getElementById('filtroCategoria').value;
    const estado = document.getElementById('filtroEstado').value;

    Utils.showAlert('Búsqueda realizada (función en desarrollo)', 'info');
}

function limpiarBusqueda() {
    document.getElementById('buscarProveedor').value = '';
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('filtroEstado').value = '';

    cargarProveedores();
}

async function guardarProveedor() {
    try {
        const form = document.getElementById('formProveedor');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('proveedorId').value;
        const data = {
            rut: Utils.limpiarRUT(document.getElementById('rut').value),
            nombre: document.getElementById('nombre').value,
            categoria: document.getElementById('categoria').value,
            giro: document.getElementById('giro').value,
            telefono: document.getElementById('telefono').value,
            email: document.getElementById('email').value,
            direccion: document.getElementById('direccion').value,
            nombre_contacto: document.getElementById('nombreContacto').value,
            telefono_contacto: document.getElementById('telefonoContacto').value,
            banco: document.getElementById('banco').value,
            numero_cuenta: document.getElementById('numeroCuenta').value,
            observaciones: document.getElementById('observaciones').value,
            activo: document.getElementById('activo').checked
        };

        const endpoint = id ? `proveedores.php?action=actualizar&id=${id}` : 'proveedores.php?action=crear';
        const method = id ? 'PUT' : 'POST';

        const response = await Utils.fetchAPI(endpoint, method, data);

        if (response.success) {
            Utils.showAlert('Proveedor guardado correctamente', 'success');
            modalProveedor.hide();
            await cargarProveedores();
        }

    } catch (error) {
        console.error('Error al guardar proveedor:', error);
        Utils.showAlert('Error al guardar el proveedor', 'danger');
    }
}

function eliminarProveedor(id) {
    Utils.showConfirm(
        'Confirmar Inactivación',
        '¿Está seguro que desea inactivar este proveedor?',
        async () => {
            try {
                const response = await Utils.fetchAPI(`proveedores.php?action=eliminar&id=${id}`, 'DELETE');

                if (response.success) {
                    Utils.showAlert('Proveedor inactivado correctamente', 'success');
                    await cargarProveedores();
                }

            } catch (error) {
                console.error('Error al eliminar proveedor:', error);
                Utils.showAlert('Error al inactivar el proveedor', 'danger');
            }
        }
    );
}

function limpiarFormulario() {
    const form = document.getElementById('formProveedor');
    if (form) {
        form.reset();
    }
    document.getElementById('proveedorId').value = '';
    document.getElementById('activo').checked = true;
    document.getElementById('modalProveedorTitle').innerHTML = '<i class="bi bi-plus-circle"></i> Nuevo Proveedor';
}

window.editarProveedor = editarProveedor;
window.eliminarProveedor = eliminarProveedor;
