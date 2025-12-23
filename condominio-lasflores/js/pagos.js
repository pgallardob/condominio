let pagos = [];
let pagosFiltrados = [];
let paginaActual = 1;
const registrosPorPagina = 15;
let modalPago;
let propietarioSeleccionado = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inicializando módulo de pagos...');
    inicializarPagos();
});

function inicializarPagos() {
    try {
        modalPago = new bootstrap.Modal(document.getElementById('modalPago'));
        
        Utils.generarOpcionesCasas(document.getElementById('filtroCasa'));
        Utils.generarOpcionesMeses(document.getElementById('filtroMes'));
        Utils.generarOpcionesAnios(document.getElementById('filtroAnio'));
        Utils.generarOpcionesMeses(document.getElementById('mesPago'), false);
        Utils.generarOpcionesAnios(document.getElementById('anioPago'));

        document.getElementById('fechaPago').value = Utils.formatearFechaInput();
        document.getElementById('horaPago').value = new Date().toTimeString().split(' ')[0].substring(0,5);

        document.getElementById('btnGuardarPago').addEventListener('click', guardarPago);
        document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltros);
        document.getElementById('btnCalcularTotales').addEventListener('click', calcularTotalesFiltrados);
        document.getElementById('btnExportar').addEventListener('click', exportarExcel);

        const filtroRut = document.getElementById('filtroRut');
        const filtroCasa = document.getElementById('filtroCasa');
        const filtroMes = document.getElementById('filtroMes');
        const filtroAnio = document.getElementById('filtroAnio');
        const filtroEstado = document.getElementById('filtroEstado');

        if(filtroRut) filtroRut.addEventListener('input', Utils.debounce(filtrarPagos, 500));
        if(filtroCasa) filtroCasa.addEventListener('change', filtrarPagos);
        if(filtroMes) filtroMes.addEventListener('change', filtrarPagos);
        if(filtroAnio) filtroAnio.addEventListener('change', filtrarPagos);
        if(filtroEstado) filtroEstado.addEventListener('change', filtrarPagos);

        document.getElementById('rutPropietario').addEventListener('blur', buscarPropietario);
        document.getElementById('mesPago').addEventListener('change', calcularMora);
        document.getElementById('anioPago').addEventListener('change', calcularMora);
        document.getElementById('descuento').addEventListener('input', calcularTotal);
        document.getElementById('recargo').addEventListener('input', calcularTotal);

        const modal = document.getElementById('modalPago');
        if(modal){
            modal.addEventListener('hidden.bs.modal', limpiarFormulario);
        }

        cargarPagos();
    } catch(error) {
        console.error('Error al inicializar pagos:', error);
        Utils.showAlert('Error al inicializar el módulo de pagos', 'danger');
    }
}

async function cargarPagos() {
    Utils.showLoading(true);
    try {
        const response = await Utils.fetchAPI('pagos.php?action=estado_cuenta');
        pagos = response.data || [];
        pagosFiltrados = [...pagos];
        paginaActual = 1;
        mostrarPagos();
        actualizarTotalesResumen();
    } catch(error){
        console.error('Error al cargar pagos:', error);
        Utils.showAlert('Error al cargar los pagos', 'danger');
    } finally {
        Utils.showLoading(false);
    }
}

function mostrarPagos() {
    const tabla = document.getElementById('tbodyPagos');
    if(!tabla) return;

    const inicio = (paginaActual-1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const sliced = pagosFiltrados.slice(inicio, fin);

    if(sliced.length === 0){
        tabla.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No hay pagos registrados</td></tr>`;
        document.getElementById('paginacion').innerHTML = '';
        return;
    }

    tabla.innerHTML = sliced.map(pago => `
        <tr>
            <td>${pago.num_casa}</td>
            <td>${pago.nombre} ${pago.apellido_paterno}</td>
            <td>${Utils.getNombreMes(pago.mes)} ${pago.anio}</td>
            <td>${Utils.formatearMonto(pago.monto_base)}</td>
            <td>${Utils.formatearMonto(pago.interes_mora)}</td>
            <td>${Utils.formatearMonto(pago.total_pagado)}</td>
            <td>${Utils.formatearFecha(pago.fecha_pago)}</td>
            <td>
                <span class="badge bg-${
                    pago.estado_pago === 'PAGADO' ? 'success' :
                    pago.estado_pago === 'MOROSO' ? 'danger' : 'secondary'
                }">${pago.estado_pago}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="registrarPagoRapido('${pago.rut}', ${pago.mes}, ${pago.anio})">
                    <i class="bi bi-cash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    actualizarPaginacion();
}

function actualizarPaginacion() {
    const totalPaginas = Math.ceil(pagosFiltrados.length / registrosPorPagina);
    const paginacion = document.getElementById('paginacion');
    if(!paginacion || totalPaginas<=1){
        if(paginacion) paginacion.innerHTML = '';
        return;
    }

    let html = '';
    for(let i=1;i<=totalPaginas;i++){
        html += `<li class="page-item ${i===paginaActual?'active':''}">
                    <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
                 </li>`;
    }
    paginacion.innerHTML = html;
}

function cambiarPagina(pagina){
    paginaActual = pagina;
    mostrarPagos();
}

function filtrarPagos() {
    const rut = document.getElementById('filtroRut').value.trim();
    const casa = document.getElementById('filtroCasa').value.trim();
    const mes = document.getElementById('filtroMes').value.trim();
    const anio = document.getElementById('filtroAnio').value.trim();
    const estado = document.getElementById('filtroEstado').value.trim();

    pagosFiltrados = pagos.filter(pago => {
        return (!rut || pago.rut.includes(rut)) &&
               (!casa || pago.num_casa.includes(casa)) &&
               (!mes || pago.mes == mes) &&
               (!anio || pago.anio == anio) &&
               (!estado || pago.estado_pago === estado);
    });
    paginaActual = 1;
    mostrarPagos();
}

function limpiarFiltros() {
    document.getElementById('filtroRut').value = '';
    document.getElementById('filtroCasa').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroAnio').value = '';
    document.getElementById('filtroEstado').value = '';
    cargarPagos();
}

function calcularTotalesFiltrados(){
    const totales = pagosFiltrados.reduce((acc, pago) => {
        acc.base += pago.monto_base || 0;
        acc.mora += pago.interes_mora || 0;
        acc.total += pago.total_pagado || 0;
        return acc;
    }, {base:0, mora:0, total:0});

    document.getElementById('totalBase').textContent = Utils.formatearMonto(totales.base);
    document.getElementById('totalMora').textContent = Utils.formatearMonto(totales.mora);
    document.getElementById('totalPagado').textContent = Utils.formatearMonto(totales.total);
}

function exportarExcel(){
    const headers = ['Casa','Propietario','Periodo','Monto Base','Interés Mora','Total Pagado','Estado'];
    const rows = pagosFiltrados.map(pago => [
        pago.num_casa,
        `${pago.nombre} ${pago.apellido_paterno}`,
        `${Utils.getNombreMes(pago.mes)} ${pago.anio}`,
        pago.monto_base,
        pago.interes_mora,
        pago.total_pagado,
        pago.estado_pago
    ]);
    Utils.exportarExcel(headers, rows, 'Pagos');
}

async function buscarPropietario(){
    const rut = document.getElementById('rutPropietario').value.trim();
    if(!rut) return;

    try{
        const response = await Utils.fetchAPI(`propietarios.php?action=buscar&rut=${rut}`);
        if(response.success && response.data){
            propietarioSeleccionado = response.data;
            document.getElementById('nombrePropietario').value = `${propietarioSeleccionado.nombre} ${propietarioSeleccionado.apellido_paterno}`;
            document.getElementById('numCasaPago').value = propietarioSeleccionado.num_casa || '';
            document.getElementById('rutPropietario').classList.remove('is-invalid');
            document.getElementById('btnGuardarPago').disabled = false;
        } else {
            propietarioSeleccionado = null;
            document.getElementById('nombrePropietario').value = '';
            document.getElementById('numCasaPago').value = '';
            document.getElementById('rutPropietario').classList.add('is-invalid');
            document.getElementById('btnGuardarPago').disabled = true;
        }
    } catch(error){
        console.error('Error al buscar propietario:', error);
    }
}

function limpiarFormulario(){
    propietarioSeleccionado = null;
    document.getElementById('rutPropietario').value = '';
    document.getElementById('nombrePropietario').value = '';
    document.getElementById('numCasaPago').value = '';
    document.getElementById('descuento').value = 0;
    document.getElementById('recargo').value = 0;
    document.getElementById('montoBase').textContent = '$35.000';
    document.getElementById('interesMora').textContent = '$0';
    document.getElementById('totalPagar').textContent = '$35.000';
}

function calcularMora(){
    const mes = parseInt(document.getElementById('mesPago').value);
    const anio = parseInt(document.getElementById('anioPago').value);
    if(!mes || !anio) return;

    const fechaLimite = new Date(anio, mes-1, 10);
    const fechaActual = new Date();
    let mora = 0;
    if(fechaActual > fechaLimite){
        const dias = Math.ceil((fechaActual - fechaLimite)/(1000*60*60*24));
        mora = dias * 1000;
        document.getElementById('diasMora').textContent = `${dias} días`;
    } else {
        document.getElementById('diasMora').textContent = `0 días`;
    }
    document.getElementById('interesMora').textContent = Utils.formatearMonto(mora);
    calcularTotal();
}

function calcularTotal(){
    const montoBase = parseFloat(document.getElementById('montoBase').textContent.replace(/[^\d.-]/g,'')) || 0;
    const descuento = parseFloat(document.getElementById('descuento').value) || 0;
    const recargo = parseFloat(document.getElementById('recargo').value) || 0;
    const mora = parseFloat(document.getElementById('interesMora').textContent.replace(/[^\d.-]/g,'')) || 0;

    const total = montoBase + recargo + mora - descuento;
    document.getElementById('totalPagar').textContent = Utils.formatearMonto(total);
}

async function guardarPago(){
    if(!propietarioSeleccionado){
        Utils.showAlert('Seleccione un propietario válido', 'warning');
        return;
    }

    const pago = {
        rut_propietario: propietarioSeleccionado.rut,
        mes: parseInt(document.getElementById('mesPago').value),
        anio: parseInt(document.getElementById('anioPago').value),
        fecha_pago: document.getElementById('fechaPago').value,
        hora_pago: document.getElementById('horaPago').value,
        forma_pago: document.getElementById('formaPago').value,
        monto_base: parseFloat(document.getElementById('montoBase').textContent.replace(/[^\d.-]/g,'')),
        interes_mora: parseFloat(document.getElementById('interesMora').textContent.replace(/[^\d.-]/g,'')),
        descuento: parseFloat(document.getElementById('descuento').value),
        recargo: parseFloat(document.getElementById('recargo').value),
        total_pagado: parseFloat(document.getElementById('totalPagar').textContent.replace(/[^\d.-]/g,'')),
        num_comprobante: document.getElementById('numComprobante').value,
        observaciones: document.getElementById('observaciones').value
    };

    try{
        Utils.showLoading(true);
        const response = await Utils.fetchAPI('pagos.php?action=crear','POST',pago);
        Utils.showLoading(false);
        if(response.success){
            Utils.showAlert('Pago registrado correctamente', 'success');
            modalPago.hide();
            limpiarFormulario();
            cargarPagos();
        } else {
            Utils.showAlert(response.error || 'Error al registrar pago','danger');
        }
    } catch(error){
        Utils.showLoading(false);
        console.error('Error al guardar pago:', error);
        Utils.showAlert('Error al conectar con el servidor', 'danger');
    }
}

function registrarPagoRapido(rut, mes, anio){
    propietarioSeleccionado = { rut: rut };
    document.getElementById('mesPago').value = mes;
    document.getElementById('anioPago').value = anio;
    modalPago.show();
    calcularMora();
}

// Actualizar totales de resumen de tarjetas superiores
function actualizarTotalesResumen(){
    const totalPagado = pagos.reduce((acc,p)=>acc+(p.total_pagado||0),0);
    const totalMora = pagos.reduce((acc,p)=>acc+(p.interes_mora||0),0);
    const casasMorosas = pagos.filter(p=>p.estado_pago==='MOROSO').length;

    document.getElementById('totalPagado').textContent = Utils.formatearMonto(totalPagado);
    document.getElementById('totalMora').textContent = Utils.formatearMonto(totalMora);
    document.getElementById('totalCasasMorosas').textContent = casasMorosas;
}
