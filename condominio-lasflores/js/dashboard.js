let chartPagos = null;
let chartEgresos = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Inicializando dashboard...');
    inicializarDashboard();
});

function inicializarDashboard() {
    try {
        const mesActual = new Date().getMonth() + 1;
        const anioActual = new Date().getFullYear();
        Utils.generarOpcionesMeses(document.getElementById('filtroMes'), false);
        Utils.generarOpcionesAnios(document.getElementById('filtroAnio'));

        document.getElementById('filtroMes').value = mesActual;
        document.getElementById('filtroAnio').value = anioActual;

        document.getElementById('btnFiltrar').addEventListener('click', cargarDashboard);
        document.getElementById('btnLimpiar').addEventListener('click', limpiarFiltros);

        cargarDashboard();
    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
        Utils.showAlert('Error al inicializar el dashboard', 'danger');
    }
}

function limpiarFiltros() {
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();
    document.getElementById('filtroMes').value = mesActual;
    document.getElementById('filtroAnio').value = anioActual;
    cargarDashboard();
}

async function cargarDashboard() {
    const mes = document.getElementById('filtroMes').value;
    const anio = document.getElementById('filtroAnio').value;

    if (!mes || !anio) {
        Utils.showAlert('Debe seleccionar mes y año', 'warning');
        return;
    }

    Utils.showLoading(true);
    try {
        // RUTA RELATIVA CORRECTA (sin barra inicial) 👇
        const resultado = await Utils.fetchAPI('api/obtener_datos_dashboard.php?mes=' + mes + '&anio=' + anio, 'GET');

        if (!resultado || !resultado.success || !resultado.data) {
            Utils.showAlert('No se pudieron cargar los datos del dashboard', 'danger');
            return;
        }
        const data = resultado.data;

        actualizarTarjetasResumen(data);
        actualizarTarjetaMorosos(data.propietarios_morosos || []);
        actualizarTablaUltimosPagos(data.pagos_recientes || []);
        actualizarTablaUltimosEgresos(data.egresos_recientes || []);
        actualizarGraficoPagos(data.estado_pagos || []);
        actualizarGraficoEgresos(data.egresos_categoria || []);

        if (data.propietarios_morosos && data.propietarios_morosos.length > 0) {
            mostrarTablaMorosos(data.propietarios_morosos);
        } else {
            const seccionMorosos = document.getElementById('seccionMorosos');
            if (seccionMorosos) seccionMorosos.style.display = 'none';
        }
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        Utils.showAlert('Error al cargar los datos del dashboard', 'danger');
    } finally {
        Utils.showLoading(false);
    }
}

function actualizarTarjetasResumen(data) {
    const totalIngresos = document.getElementById('totalIngresos');
    const textoIngresos = document.getElementById('textoIngresos');
    const totalEgresos = document.getElementById('totalEgresos');
    const textoEgresos = document.getElementById('textoEgresos');
    const saldoPeriodo = document.getElementById('saldoPeriodo');

    if (totalIngresos) totalIngresos.textContent = Utils.formatearMonto(data.ingresos);
    if (textoIngresos) textoIngresos.textContent = `${(data.pagos_recientes || []).length} pagos recibidos`;
    if (totalEgresos) totalEgresos.textContent = Utils.formatearMonto(data.egresos);
    if (textoEgresos) textoEgresos.textContent = `${(data.egresos_recientes || []).length} gastos registrados`;
    if (saldoPeriodo) {
        saldoPeriodo.textContent = Utils.formatearMonto(data.saldo);
        if (data.saldo > 0) {
            saldoPeriodo.className = 'text-success';
        } else if (data.saldo < 0) {
            saldoPeriodo.className = 'text-danger';
        } else {
            saldoPeriodo.className = 'text-primary';
        }
    }
}

function actualizarTarjetaMorosos(morosos) {
    const totalMorosos = morosos.length;
    const deudaTotal = morosos.reduce((sum, m) => sum + parseFloat(m.total_deuda || m.deuda_total || 0), 0);
    const totalMorososElem = document.getElementById('totalMorosos');
    const textoMorososElem = document.getElementById('textoMorosos');
    if (totalMorososElem) totalMorososElem.textContent = totalMorosos;
    if (textoMorososElem) textoMorososElem.textContent = `Deuda: ${Utils.formatearMonto(deudaTotal)}`;
}

function actualizarTablaUltimosPagos(pagos) {
    const tbody = document.getElementById('ultimosPagos');
    if (!tbody) return;
    if (!pagos || pagos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay pagos registrados</td></tr>';
        return;
    }
    tbody.innerHTML = pagos.map(pago => `
        <tr>
            <td>${pago.num_casa || pago.casa}</td>
            <td>${pago.nombre} ${pago.apellido_paterno}</td>
            <td class="text-success fw-bold">${Utils.formatearMonto(pago.monto || pago.total_pagado)}</td>
            <td>${Utils.formatearFecha(pago.fecha)}</td>
        </tr>
    `).join('');
}

function actualizarTablaUltimosEgresos(egresos) {
    const tbody = document.getElementById('ultimosEgresos');
    if (!tbody) return;
    if (!egresos || egresos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay egresos registrados</td></tr>';
        return;
    }
    tbody.innerHTML = egresos.map(egreso => `
        <tr>
            <td><span class="badge bg-info">${egreso.categoria || egreso.nombre_categoria}</span></td>
            <td>${egreso.descripcion}</td>
            <td class="text-danger fw-bold">${Utils.formatearMonto(egreso.monto || egreso.total)}</td>
            <td>${Utils.formatearFecha(egreso.fecha)}</td>
        </tr>
    `).join('');
}

function mostrarTablaMorosos(morosos) {
    const tbody = document.getElementById('tablaMorosos');
    const seccion = document.getElementById('seccionMorosos');
    if (!tbody || !seccion) return;
    tbody.innerHTML = morosos.map(moroso => `
        <tr>
            <td><strong>Casa ${moroso.num_casa || moroso.numero_casa}</strong></td>
            <td>${moroso.nombre} ${moroso.apellido_paterno}</td>
            <td>${moroso.telefono_1 || moroso.telefono || 'No registrado'}</td>
            <td><span class="badge bg-warning">${moroso.meses_pendientes || moroso.meses_adeudados} ${(moroso.meses_pendientes || moroso.meses_adeudados) == 1 ? 'mes' : 'meses'}</span></td>
            <td class="text-danger fw-bold">${Utils.formatearMonto(moroso.deuda_total || moroso.total_deuda)}</td>
            <td>
                <a href="pages/pagos.html?rut=${moroso.rut}" class="btn btn-sm btn-primary">
                    <i class="bi bi-cash"></i> Registrar Pago
                </a>
            </td>
        </tr>
    `).join('');
    seccion.style.display = 'block';
}

function actualizarGraficoPagos(estadoPagosArray) {
    const ctx = document.getElementById('chartPagos');
    if (!ctx) return;
    if (chartPagos) { chartPagos.destroy(); }
    let pagados = 0, pendientes = 0, morosos = 0;
    if (Array.isArray(estadoPagosArray)) {
        estadoPagosArray.forEach(item => {
            if (item.name === 'Pagados') pagados = item.value;
            if (item.name === 'Pendientes') pendientes = item.value;
            if (item.name === 'Morosos') morosos = item.value;
        });
    }
    chartPagos = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pagados', 'Pendientes', 'Morosos'],
            datasets: [{
                data: [pagados, pendientes, morosos],
                backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function actualizarGraficoEgresos(categoriasArray) {
    const ctx = document.getElementById('chartEgresos');
    if (!ctx) return;
    if (chartEgresos) { chartEgresos.destroy(); }
    const labels = categoriasArray.map(item => item.name || item.categoria);
    const valores = categoriasArray.map(item => parseFloat(item.value || item.total));
    chartEgresos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monto Gastado',
                data: valores,
                backgroundColor: '#17a2b8',
                borderColor: '#138496',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return Utils.formatearMonto(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-CL');
                        }
                    }
                }
            }
        }
    });
}
