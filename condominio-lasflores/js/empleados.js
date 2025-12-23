let empleados = [];
let liquidaciones = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inicializando módulo...');
    try {
        // Ya no activamos el spinner
        await cargarEmpleados(); // Llamamos a cargar empleados sin spinner
    } catch(error) {
        console.error('Error fatal:', error);
        alert('Error al inicializar el módulo');
    }
});

async function cargarEmpleados() {
    try {
        const response = await Utils.fetchAPI('empleados.php?action=listar', 'GET');
        if (response && response.success && response.data) {
            empleados = response.data;
            renderizarEmpleados(empleados);
        } else {
            empleados = [];
            renderizarEmpleados(empleados);
            Utils.showAlert('No se encontraron empleados.', 'warning');
        }
    } catch (error) {
        empleados = [];
        renderizarEmpleados(empleados);
        Utils.showAlert('Error al cargar empleados.', 'danger');
    }
}

function renderizarEmpleados(lista) {
    const tbody = document.getElementById('tablaEmpleados');
    if (!tbody) return;
    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay empleados registrados</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(emp => `
        <tr>
            <td>${emp.rut}</td>
            <td>${emp.nombre}</td>
            <td>${emp.apellido_paterno}</td>
            <td>${emp.cargo}</td>
            <td>${emp.telefono}</td>
            <td>${emp.email}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarEmpleado('${emp.rut}')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger" onclick="eliminarEmpleado('${emp.rut}')"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('👥 Inicializando módulo de empleados...');
    inicializar();
});

function inicializar() {
    try {
        document.getElementById('btnGuardarEmpleado').addEventListener('click', guardarEmpleado);
        document.getElementById('btnGenerarLiquidacion').addEventListener('click', generarLiquidacion);
        document.getElementById('empleadoLiq').addEventListener('change', mostrarSueldoBase);
        Utils.generarOpcionesMeses(document.getElementById('mesLiq'), false);
        Utils.generarOpcionesAnios(document.getElementById('anioLiq'));
        cargarDatos();
    } catch (error) {
        console.error('Error al inicializar empleados:', error);
        Utils.showAlert('Error al inicializar el módulo de empleados', 'danger');
    }
}

async function cargarDatos() {
    try {
        // Simulamos la carga de empleados y liquidaciones sin spinner
        await new Promise(resolve => setTimeout(resolve, 800));
        empleados = [
            { rut_empleado: '12345678-9', nombre: 'Juan', apellido_paterno: 'Pérez', apellido_materno: 'González', cargo: 'Conserje', sueldo_base: 450000, estado: 'activo' },
            { rut_empleado: '98765432-1', nombre: 'María', apellido_paterno: 'López', apellido_materno: 'Martínez', cargo: 'Jardinería', sueldo_base: 380000, estado: 'activo' }
        ];
        liquidaciones = [
            { id_liquidacion: 1, nombre: 'Juan', apellido_paterno: 'Pérez', mes: new Date().getMonth(), anio: new Date().getFullYear(), sueldo_base: 450000, total_descuentos: 80000, liquido_pagar: 370000, estado: 'pagada' }
        ];
        mostrarEmpleados();
        mostrarLiquidaciones();
        llenarSelectEmpleados();
    } catch (error) {
        Utils.showAlert('Error al cargar datos', 'danger');
    }
}

function llenarSelectEmpleados() {
    const select = document.getElementById('empleadoLiq');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione empleado</option>';
    empleados.filter(e => e.estado === 'activo').forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.rut_empleado;
        option.textContent = `${emp.nombre} ${emp.apellido_paterno} - ${emp.cargo}`;
        option.setAttribute('data-sueldo', emp.sueldo_base);
        select.appendChild(option);
    });
}

function mostrarSueldoBase() {
    const select = document.getElementById('empleadoLiq');
    if (!select) return;
    const option = select.options[select.selectedIndex];
    const sueldo = option.getAttribute('data-sueldo') || 0;
    const sueldoBaseLiq = document.getElementById('sueldoBaseLiq');
    if (sueldoBaseLiq) {
        sueldoBaseLiq.textContent = Utils.formatearMonto(sueldo);
    }
}

async function guardarEmpleado() {
    const form = document.getElementById('formEmpleado');
    if (!form) return;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    const rut = document.getElementById('rutEmpleado').value;
    if (!Utils.validarRUT(rut)) {
        Utils.showAlert('RUT inválido', 'danger');
        return;
    }
    const datos = {
        action: 'crear',
        rut_empleado: Utils.limpiarRUT(rut),
        nombre: document.getElementById('nombreEmpleado').value,
        apellido_paterno: document.getElementById('apellidoPaternoEmp').value,
        apellido_materno: document.getElementById('apellidoMaternoEmp').value,
        cargo: document.getElementById('cargoEmpleado').value,
        tipo_contrato: document.getElementById('tipoContrato').value,
        fecha_ingreso: document.getElementById('fechaIngreso').value,
        sueldo_base: parseInt(document.getElementById('sueldoBase').value),
        afp: document.getElementById('afpEmpleado').value,
        salud: document.getElementById('saludEmpleado').value
    };

    try {
        const response = await Utils.fetchAPI('empleados.php', 'POST', datos);
        Utils.showAlert('Empleado registrado correctamente', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEmpleado'));
        if (modal) modal.hide();
        form.reset();
        await cargarDatos();
    } catch (error) {
        Utils.showAlert('Error al guardar empleado', 'danger');
    }
}

async function generarLiquidacion() {
    const form = document.getElementById('formLiquidacion');
    if (!form) return;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    const select = document.getElementById('empleadoLiq');
    if (!select || !select.value) {
        Utils.showAlert('Seleccione un empleado', 'warning');
        return;
    }
    const option = select.options[select.selectedIndex];
    const sueldoBase = parseFloat(option.getAttribute('data-sueldo')) || 0;
    const horasExtra = parseFloat(document.getElementById('horasExtra').value) || 0;
    const bonos = parseFloat(document.getElementById('bonos').value) || 0;
    const totalHaberes = sueldoBase + (horasExtra * 10000) + bonos;
    const descAFP = Math.round(totalHaberes * 0.1);
    const descSalud = Math.round(totalHaberes * 0.07);
    const totalDescuentos = descAFP + descSalud;
    const liquidoPagar = totalHaberes - totalDescuentos;
    const datos = {
        action: 'crear_liquidacion',
        rut_empleado: select.value,
        mes: document.getElementById('mesLiq').value,
        anio: document.getElementById('anioLiq').value,
        sueldo_base: sueldoBase,
        horas_extra: horasExtra,
        bonos: bonos,
        total_haberes: totalHaberes,
        desc_afp: descAFP,
        desc_salud: descSalud,
        total_descuentos: totalDescuentos,
        liquido_pagar: liquidoPagar
    };

    try {
        const response = await Utils.fetchAPI('empleados.php', 'POST', datos);
        Utils.showAlert('Liquidación generada correctamente', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalLiquidacion'));
        if (modal) modal.hide();
        form.reset();
        await cargarDatos();
    } catch (error) {
        Utils.showAlert('Error al generar liquidación', 'danger');
    }
}

window.eliminarEmpleado = eliminarEmpleado;
window.verLiquidacion = verLiquidacion;
