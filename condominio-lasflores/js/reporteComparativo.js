async function generarReporteComparativo(fechaInicio, fechaFin) {
    await new Promise(resolve => setTimeout(resolve, 700));  // Simulación de espera

    const comparativo = [
        { periodo: 'Enero 2024', ingresos: 1200000, egresos: 800000 },
        { periodo: 'Febrero 2024', ingresos: 1400000, egresos: 900000 },
        { periodo: 'Marzo 2024', ingresos: 1600000, egresos: 1000000 }
    ];

    // Llenar tabla con los datos comparativos
    const tbody = document.getElementById('tablaComparativoBody');
    if (tbody) {
        tbody.innerHTML = comparativo.map(item => `
            <tr>
                <td>${item.periodo}</td>
                <td>${Utils.formatearMonto(item.ingresos)}</td>
                <td>${Utils.formatearMonto(item.egresos)}</td>
                <td>${Utils.formatearMonto(item.ingresos - item.egresos)}</td>
            </tr>
        `).join('');
    }

    document.getElementById('reporteComparativo').style.display = 'block';  // Mostrar sección comparativa
}
