// reportes.js
import { generarReporteResumen } from './reporteResumen.js';
import { generarReporteIngresos } from './reporteIngresos.js';
import { generarReporteEgresos } from './reporteEgresos.js';
import { generarReporteMorosidad } from './reporteMorosidad.js';
import { generarReporteComparativo } from './reporteComparativo.js';




let chartResumen = null;
let chartComparativo = null;

// Evento principal DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inicializando módulo...');
    
    try {
        await cargarReportes();  // Llama a la API real
    } catch(error) {
        console.error('Error fatal:', error);
        alert('Error al inicializar el módulo');
    }
});

// Función principal corregida para cargar datos
async function cargarReportes(filtros = {}) {
    try {
        let url = 'reportes.php?action=resumen';
        const params = [];
        if (filtros.mes) params.push(`mes=${filtros.mes}`);
        if (filtros.anio) params.push(`anio=${filtros.anio}`);
        if (params.length > 0) url += '&' + params.join('&');
        const response = await Utils.fetchAPI(url, 'GET');
        
        if (response && response.success && response.data) {
            renderizarResumen(response.data);
            await cargarComparativo(filtros);
        } else {
            renderizarResumen(null);
            Utils.showAlert('No se encontraron datos de reportes.', 'warning');
        }
    } catch(error) {
        renderizarResumen(null);
        Utils.showAlert('Error al cargar los reportes.', 'danger');
    }
}

function renderizarResumen(datos) {
    document.getElementById('totalIngresosReporte').textContent = datos ? Utils.formatearMonto(datos.total_ingresos) : '$0';
    document.getElementById('totalEgresosReporte').textContent = datos ? Utils.formatearMonto(datos.total_egresos) : '$0';
    document.getElementById('saldoReporte').textContent = datos ? Utils.formatearMonto(datos.saldo) : '$0';
    if (datos && datos.egresos_categoria) {
        renderizarGraficoEgresos(datos.egresos_categoria);
    }
}

async function cargarComparativo(filtros = {}) {
    try {
        let url = 'reportes.php?action=comparativo';
        const params = [];
        if (filtros.mes) params.push(`mes=${filtros.mes}`);
        if (filtros.anio) params.push(`anio=${filtros.anio}`);
        if (params.length > 0) url += '&' + params.join('&');
        const response = await Utils.fetchAPI(url, 'GET');
        
        if (response && response.success && response.data) {
            renderizarGraficoComparativo(response.data);
        } else {
            if (chartComparativo) { 
                chartComparativo.destroy(); 
                chartComparativo = null; 
            }
        }
    } catch {
        if (chartComparativo) { 
            chartComparativo.destroy(); 
            chartComparativo = null; 
        }
    }
}

function renderizarGraficoEgresos(data) {
    const ctx = document.getElementById('chartResumen');
    if (!ctx) return;
    if (chartResumen) chartResumen.destroy();
    const labels = data.map(item => item.name || item.categoria);
    const valores = data.map(item => parseFloat(item.value || item.total));
    
    chartResumen = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: ['#17a2b8', '#ffc107', '#dc3545', '#28a745', '#7952b3'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}
function renderizarGraficoComparativo(data) {
    const ctx = document.getElementById('chartComparativo');
    if (!ctx) return;
    if (chartComparativo) chartComparativo.destroy();
    const labels = data.map(item => item.periodo);
    const ingresos = data.map(item => parseFloat(item.ingresos));
    const egresos = data.map(item => parseFloat(item.egresos));
    
    chartComparativo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresos,
                    backgroundColor: '#28a745'
                },
                {
                    label: 'Egresos',
                    data: egresos,
                    backgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Filtro visual: puedes llamar cargarReportes({mes, anio}) con los valores seleccionados en tu UI
document.getElementById('btnFiltrarReporte')?.addEventListener('click', async function() {
    const mes = document.getElementById('selectMesReporte').value;
    const anio = document.getElementById('selectAnioReporte').value;
    await cargarReportes({ mes, anio });
});
document.addEventListener('DOMContentLoaded', function() {
    console.log('📈 Inicializando módulo de reportes...');
    inicializarReportes();
});

function inicializarReportes() {
    try {
        document.getElementById('btnGenerarReporte').addEventListener('click', generarReporte);

        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 3);

        document.getElementById('fechaInicio').value = Utils.formatearFechaInput(fechaInicio);
        document.getElementById('fechaFin').value = Utils.formatearFechaInput(fechaFin);
    } catch (error) {
        console.error('Error al inicializar reportes:', error);
        Utils.showAlert('Error al inicializar el módulo de reportes', 'danger');
    }
}

async function generarReporte() {
    const tipoReporte = document.getElementById('tipoReporte').value;
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    if (!fechaInicio || !fechaFin) {
        Utils.showAlert('Debe seleccionar fechas de inicio y fin', 'warning');
        return;
    }

    try {
        document.querySelectorAll('.reporte-seccion').forEach(sec => {
            sec.style.display = 'none';
        });

        document.getElementById('areaResultados').style.display = 'block';

        switch (tipoReporte) {
            case 'resumen':
                await generarReporteResumen(fechaInicio, fechaFin);
                break;
            case 'ingresos':
                await generarReporteIngresos(fechaInicio, fechaFin);
                break;
            case 'egresos':
                await generarReporteEgresos(fechaInicio, fechaFin);
                break;
            case 'morosidad':
                await generarReporteMorosidad(fechaInicio, fechaFin);
                break;
            case 'comparativo':
                await generarReporteComparativo(fechaInicio, fechaFin);
                break;
        }

    } catch (error) {
        console.error('Error al generar reporte:', error);
        Utils.showAlert('Error al generar el reporte', 'danger');
    }
}

// Los siguientes métodos generan cada tipo de reporte. 
// Puedes continuar con los reportes de resumen, ingresos, egresos, morosidad y comparativo.
