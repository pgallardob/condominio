async function generarReporteIngresos(fechaInicio, fechaFin) {
    await new Promise(resolve => setTimeout(resolve, 600));  // Simulación de espera

    const ingresos = [
        { fecha: '2024-01-15', casa: 1, propietario: 'Juan Pérez', periodo: 'Enero 2024', gasto_comun: 35000, extras: 0, mora: 0, total: 35000, metodo: 'Transferencia' },
        { fecha: '2024-01-16', casa: 2, propietario: 'María López', periodo: 'Enero 2024', gasto_comun: 35000, extras: 5000, mora: 0, total: 40000, metodo: 'Efectivo' },
        { fecha: '2024-01-17', casa: 3, propietario: 'Carlos Díaz', periodo: 'Enero 2024', gasto_comun: 35000, extras: 0, mora: 2000, total: 37000, metodo: 'Transferencia' }
    ];

    // Llenar tabla con los ingresos
    const tbody = document.getElementById('tablaIngresosBody');
    if (tbody) {
        tbody.innerHTML = ingresos.map(ingreso => `
            <tr>
                <td>${Utils.formatearFecha(ingreso.fecha)}</td>
                <td>${ingreso.casa}</td>
                <td>${ingreso.propietario}</td>
                <td>${ingreso.periodo}</td>
                <td>${Utils.formatearMonto(ingreso.gasto_comun)}</td>
                <td>${Utils.formatearMonto(ingreso.extras)}</td>
                <td>${Utils.formatearMonto(ingreso.mora)}</td>
                <td>${Utils.formatearMonto(ingreso.total)}</td>
                <td>${ingreso.metodo}</td>
            </tr>
        `).join('');

        const total = ingresos.reduce((sum, i) => sum + i.total, 0);
        document.getElementById('totalIngresosTabla').textContent = Utils.formatearMonto(total);
    }
    document.getElementById('reporteIngresos').style.display = 'block';  // Mostrar sección de ingresos
}
