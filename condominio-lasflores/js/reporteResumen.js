async function generarReporteResumen(fechaInicio, fechaFin) {
    await new Promise(resolve => setTimeout(resolve, 800));  // Simulación de tiempo de espera

    const datos = {
        ingresos: 5250000,
        egresos: 3600000,
        saldo: 1650000,
        morosidad: 210000
    };

    // Actualizar los valores en la UI
    document.getElementById('resumenIngresos').textContent = Utils.formatearMonto(datos.ingresos);
    document.getElementById('resumenEgresos').textContent = Utils.formatearMonto(datos.egresos);
    document.getElementById('resumenSaldo').textContent = Utils.formatearMonto(datos.saldo);
    document.getElementById('resumenMorosidad').textContent = Utils.formatearMonto(datos.morosidad);

    // Generar gráfico
    generarGraficoResumen(datos);

    document.getElementById('reporteResumen').style.display = 'block';  // Mostrar sección del reporte
}

function generarGraficoResumen(datos) {
    const ctx = document.getElementById('chartResumen').getContext('2d');
    if (chartResumen) {
        chartResumen.destroy();  // Eliminar gráfico previo, si existe
    }
    chartResumen = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ingresos', 'Egresos', 'Saldo', 'Morosidad'],
            datasets: [{
                label: 'Monto',
                data: [datos.ingresos, datos.egresos, datos.saldo, datos.morosidad],
                backgroundColor: [
                    '#28a745',  // Ingresos
                    '#dc3545',  // Egresos
                    '#007bff',  // Saldo
                    '#ffc107'   // Morosidad
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
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
                            return '$' + (value / 1000).toFixed(0) + 'K';  // Formato en miles
                        }
                    }
                }
            }
        }
    });
}
