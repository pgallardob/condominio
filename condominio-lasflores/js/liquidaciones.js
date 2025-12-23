// CORRECCIÓN COMPLETA DE liquidaciones.js
let modalLiquidacion;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inicializando módulo...');
    try {
        await cargarLiquidaciones();  // Llama a la función real de carga (corrige aquí tu lógica)
    } catch(error) {
        console.error('Error fatal:', error);
        alert('Error al inicializar el módulo');
    }
});

// Ejemplo de función de carga de liquidaciones usando fetchAPI
async function cargarLiquidaciones() {
    try {
        const response = await Utils.fetchAPI('liquidaciones.php?action=listar', 'GET');
        if (response && response.success && response.data) {
            window.liquidaciones = response.data;
            renderizarLiquidaciones(window.liquidaciones);
        } else {
            window.liquidaciones = [];
            renderizarLiquidaciones([]);
            Utils.showAlert('No se encontraron liquidaciones.', 'warning');
        }
    } catch (error) {
        window.liquidaciones = [];
        renderizarLiquidaciones([]);
        Utils.showAlert('Error al cargar liquidaciones.', 'danger');
    }
}

// Ejemplo de función de renderizado (ajusta según tu HTML)
function renderizarLiquidaciones(lista) {
    const tbody = document.getElementById('tablaLiquidaciones');
    if (!tbody) return;
    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay liquidaciones registradas</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(liq => `
        <tr>
            <td>${liq.id}</td>
            <td>${liq.rut_empleado}</td>
            <td>${liq.nombre_empleado}</td>
            <td>${Utils.formatearFecha(liq.fecha_liquidacion)}</td>
            <td>${Utils.formatearMonto(liq.monto_liquidacion)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarLiquidacion(${liq.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger" onclick="eliminarLiquidacion(${liq.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Inicializando módulo de liquidaciones...');
    inicializarLiquidaciones();
});

async function inicializarLiquidaciones() {
    try {
        modalLiquidacion = new bootstrap.Modal(document.getElementById('modalLiquidacion'));
        inicializarFiltros();
        await cargarEmpleados();
        await cargarLiquidaciones();
        document.getElementById('btnGuardarLiquidacion').addEventListener('click', guardarLiquidacion);
        document.getElementById('btnFiltrar').addEventListener('click', aplicarFiltros);
        document.getElementById('btnLimpiar').addEventListener('click', limpiarFiltros);

        ['sueldoBase', 'bonos', 'horasExtra', 'otrosDescuentos'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', calcularLiquidacion);
            }
        });
        const modal = document.getElementById('modalLiquidacion');
        if (modal) {
            modal.addEventListener('show.bs.modal', limpiarFormulario);
        }
    } catch (error) {
        console.error('Error al inicializar liquidaciones:', error);
        Utils.showAlert('Error al inicializar el módulo', 'danger');
    }
}

function inicializarFiltros() {
    const filtroMes = document.getElementById('filtroMes');
    const filtroAnio = document.getElementById('filtroAnio');
    const mes = document.getElementById('mes');
    const anio = document.getElementById('anio');
    Utils.generarOpcionesMeses(filtroMes);
    Utils.generarOpcionesAnios(filtroAnio);
    Utils.generarOpcionesMeses(mes, false);
    Utils.generarOpcionesAnios(anio, 2024);
    const fechaActual = new Date();
    if (filtroMes) filtroMes.value = fechaActual.getMonth() + 1;
    if (filtroAnio) filtroAnio.value = fechaActual.getFullYear();
    if (mes) mes.value = fechaActual.getMonth() + 1;
    if (anio) anio.value = fechaActual.getFullYear();
}

function aplicarFiltros() {
    cargarLiquidaciones();
}

function limpiarFiltros() {
    document.getElementById('filtroEmpleado').value = '';
    const fechaActual = new Date();
    document.getElementById('filtroMes').value = fechaActual.getMonth() + 1;
    document.getElementById('filtroAnio').value = fechaActual.getFullYear();
    cargarLiquidaciones();
}

async function cargarEmpleados() {
    try {
        // Simulación: reemplaza por tu llamada API si lo requieres
        const empleados = [
            { id: 1, nombre: 'Juan Pérez - Conserje', cargo: 'Conserje', sueldo_base: 450000, estado: 'ACTIVO' },
            { id: 2, nombre: 'María López - Jardinería', cargo: 'Jardinería', sueldo_base: 380000, estado: 'ACTIVO' },
            { id: 3, nombre: 'Carlos Díaz - Seguridad', cargo: 'Seguridad', sueldo_base: 520000, estado: 'ACTIVO' }
        ];
        const selectFiltro = document.getElementById('filtroEmpleado');
        const selectForm = document.getElementById('idEmpleado');
        if (selectFiltro) {
            selectFiltro.innerHTML = '<option value="">Todos</option>';
            empleados.forEach(empleado => {
                const option = document.createElement('option');
                option.value = empleado.id;
                option.textContent = empleado.nombre;
                selectFiltro.appendChild(option);
            });
        }
        if (selectForm) {
            selectForm.innerHTML = '<option value="">Seleccione empleado...</option>';
            empleados.forEach(empleado => {
                const option = document.createElement('option');
                option.value = empleado.id;
                option.textContent = empleado.nombre;
                option.dataset.sueldo = empleado.sueldo_base;
                selectForm.appendChild(option);
            });
            selectForm.addEventListener('change', function() {
                const option = this.options[this.selectedIndex];
                const sueldoBase = document.getElementById('sueldoBase');
                if (sueldoBase && option.dataset.sueldo) {
                    sueldoBase.value = option.dataset.sueldo;
                    calcularLiquidacion();
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar empleados:', error);
    }
}

async function cargarLiquidaciones() {
    try {
        // Simulación: reemplaza por tu llamada API si lo requieres
        await new Promise(resolve => setTimeout(resolve, 600));
        const liquidaciones = [
            {
                id: 1,
                nombre_empleado: 'Juan Pérez',
                rut: '12.345.678-9',
                mes: new Date().getMonth(),
                anio: new Date().getFullYear(),
                sueldo_base: 450000,
                bonos: 50000,
                total_descuentos: 80000,
                liquido_pagar: 420000,
                fecha_pago: new Date().toISOString().split('T')[0]
            },
            {
                id: 2,
                nombre_empleado: 'María López',
                rut: '98.765.432-1',
                mes: new Date().getMonth() - 1,
                anio: new Date().getFullYear(),
                sueldo_base: 380000,
                bonos: 20000,
                total_descuentos: 60000,
                liquido_pagar: 340000,
                fecha_pago: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ];
        const tbody = document.getElementById('tablaLiquidaciones');
        if (!tbody) return;
        if (liquidaciones.length > 0) {
            tbody.innerHTML = liquidaciones.map(liq => `
                <tr>
                    <td>${liq.id}</td>
                    <td>${liq.nombre_empleado}</td>
                    <td>${liq.rut}</td>
                    <td>${Utils.getNombreMes(liq.mes)} ${liq.anio}</td>
                    <td>${Utils.formatearMonto(liq.sueldo_base)}</td>
                    <td>${Utils.formatearMonto(liq.bonos)}</td>
                    <td>${Utils.formatearMonto(liq.total_descuentos)}</td>
                    <td class="fw-bold text-success">${Utils.formatearMonto(liq.liquido_pagar)}</td>
                    <td>${Utils.formatearFecha(liq.fecha_pago)}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="verLiquidacion(${liq.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editarLiquidacion(${liq.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarLiquidacion(${liq.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No hay liquidaciones disponibles</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar las liquidaciones:', error);
    }
}

