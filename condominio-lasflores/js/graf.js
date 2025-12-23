
let chartPagos = null;
let chartEgresos = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Inicializando dashboard...');
    inicializarDashboard();
});

function inicializarDashboard() {
    llenarSelectores();
    // -- CAMBIO: establece selects en blanco por defecto --
    document.getElementById('filtroMes').value = "";
    document.getElementById('filtroAnio').value = "";

    // -- CAMBIO: elimina carga automática, SOLO carga al hacer clic en Filtrar --
    // (No más listeners de change)

    document.getElementById('btnFiltrar').addEventListener('click', function() {
        const mes = document.getElementById('filtroMes').value;
        const anio = document.getElementById('filtroAnio').value;
        cargarDatos(mes, anio);
    });
    document.getElementById('btnLimpiar').addEventListener('click', function() {
        document.getElementById('filtroMes').value = "";
        document.getElementById('filtroAnio').value = "";
        // No carga datos si no hay selección
    });
}

function llenarSelectores() {
    const selectMes = document.getElementById('filtroMes');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    selectMes.innerHTML = "";
    // -- CAMBIO: opción por defecto "Seleccion" --
    const optionMesDefault = document.createElement('option');
    optionMesDefault.value = "";
    optionMesDefault.textContent = "Seleccion";
    selectMes.appendChild(optionMesDefault);
    meses.forEach((mes, i) => {
        const option = document.createElement('option');
        option.value = i + 1;
        option.textContent = mes;
        selectMes.appendChild(option);
    });

    const selectAnio = document.getElementById('filtroAnio');
    selectAnio.innerHTML = "";
    // -- CAMBIO: opción por defecto "Seleccion" --
    const optionAnioDefault = document.createElement('option');
    optionAnioDefault.value = "";
    optionAnioDefault.textContent = "Seleccion";
    selectAnio.appendChild(optionAnioDefault);
    const anioActual = new Date().getFullYear();
    for(let i = anioActual; i >= 2020; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        selectAnio.appendChild(option);
    }
}

async function cargarDatos(mes, anio) {
    if (!mes || !anio) {  // -- CAMBIO: obligar selección válida antes de cargar datos --
        mostrarAlerta('Selecciona mes y año antes de consultar.', 'warning');
        return;
    }
    try {
        const response = await fetch(`api/obtener_datos_dashboard.php?mes=${mes}&anio=${anio}`);
        const result = await response.json();
        
        if(result.success) {
            actualizarTarjetas(result.data);
            actualizarTablas(result.data);
            actualizarGraficos(result.data);
        } else {
            console.error('Error:', result.message);
            mostrarAlerta('Error al cargar datos: ' + (result.message || 'Desconocido'), 'danger');
        }
    } catch(error) {
        console.error('Error de conexión:', error);
        mostrarAlerta('Error de conexión con el servidor. Verifica que el archivo API existe.', 'danger');
    }
}

function actualizarTarjetas(data) {
    document.getElementById('totalIngresos').textContent = '$' + (data.ingresos || 0).toLocaleString();
    document.getElementById('textoIngresos').textContent = (data.pagos_recientes ? data.pagos_recientes.length : 0) + ' pagos recibidos';
    document.getElementById('totalEgresos').textContent = '$' + (data.egresos || 0).toLocaleString();
    document.getElementById('textoEgresos').textContent = (data.egresos_recientes ? data.egresos_recientes.length : 0) + ' gastos registrados';
    document.getElementById('saldoPeriodo').textContent = '$' + (data.saldo || 0).toLocaleString();
    document.getElementById('totalMorosos').textContent = (data.propietarios_morosos ? data.propietarios_morosos.length : 0);
    document.getElementById('textoMorosos').textContent = (data.propietarios_morosos && data.propietarios_morosos[0]) ? 'Deuda: info no disponible' : 'Deuda: $0';
}

function actualizarTablas(data) {
    // Pagos
    const tbodyPagos = document.getElementById('ultimosPagos');
    tbodyPagos.innerHTML = '';
    if(data.pagos_recientes && data.pagos_recientes.length > 0) {
        data.pagos_recientes.forEach(pago => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>Casa N/D</td>
                <td>${pago.nombre || ''} ${pago.apellido_paterno || ''}</td>
                <td>$${parseFloat(pago.monto || 0).toLocaleString()}</td>
                <td>${pago.fecha ? new Date(pago.fecha).toLocaleDateString() : '-'}</td>
            `;
            tbodyPagos.appendChild(tr);
        });
    } else {
        tbodyPagos.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay pagos registrados</td></tr>';
    }
    
    // Egresos
    const tbodyEgresos = document.getElementById('ultimosEgresos');
    tbodyEgresos.innerHTML = '';
    if(data.egresos_recientes && data.egresos_recientes.length > 0) {
        data.egresos_recientes.forEach(egreso => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${egreso.categoria || '-'}</td>
                <td>${egreso.descripcion || '-'}</td>
                <td>$${parseFloat(egreso.monto || 0).toLocaleString()}</td>
                <td>${egreso.fecha ? new Date(egreso.fecha).toLocaleDateString() : '-'}</td>
            `;
            tbodyEgresos.appendChild(tr);
        });
    } else {
        tbodyEgresos.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay egresos registrados</td></tr>';
    }
}

function actualizarGraficos(data) {
    // Gráfico de Pagos
    const ctxPagos = document.getElementById('chartPagos').getContext('2d');
    if(chartPagos) chartPagos.destroy();
    let pagados = 0, pendientes = 0, morosos = 0;
    if(Array.isArray(data.estado_pagos)) {
        data.estado_pagos.forEach(item => {
            if(item.name === 'Pagados') pagados = item.value;
            if(item.name === 'Pendientes') pendientes = item.value;
            if(item.name === 'Morosos') morosos = item.value;
        });
    }
    chartPagos = new Chart(ctxPagos, {
        type: 'doughnut',
        data: {
            labels: ['Pagados', 'Pendientes', 'Morosos'],
            datasets: [{
                data: [pagados, pendientes, morosos],
                backgroundColor: ['#198754', '#ffc107', '#dc3545']
            }]
        }
    });
    
    // Gráfico de Egresos
    const ctxEgresos = document.getElementById('chartEgresos').getContext('2d');
    if(chartEgresos) chartEgresos.destroy();
    const categorias = data.egresos_categoria || [];
    chartEgresos = new Chart(ctxEgresos, {
        type: 'bar',
        data: {
            labels: categorias.map(c => c.name || c.categoria),
            datasets: [{
                label: 'Monto',
                data: categorias.map(c => parseFloat(c.value || c.total)),
                backgroundColor: '#0dcaf0'
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function mostrarAlerta(mensaje, tipo = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo} alert-dismissible fade show`;
    alert.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}