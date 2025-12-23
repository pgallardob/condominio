async function generarReporteEgresos(fechaInicio, fechaFin) {
    await new Promise(resolve => setTimeout(resolve, 600));  // Simulación de espera

    const egresos = [
        { fecha: '2024-01-10', categoria: 'SERVICIOS', descripcion: 'Pago agua potable', proveedor: 'Aguas Andinas', monto: 120000, metodo: 'Transferencia', comprobante: 'FAC-001' },
        { fecha: '2024-01-12', categoria: 'MANTENCION', descripcion: 'Reparación ascensor', proveedor: 'Ascensores Seguros', monto: 85000, metodo: 'Transferencia', comprobante: 'FAC-002' },
        { fecha: '2024-01-15', categoria: 'SUELDOS', descripcion: 'Sueldo conserje', proveedor: 'Nómina', monto: 450000, metodo: 'Transferencia', comprobante: 'LIQ-001' }
    ];

    // Llenar tabla con los egresos
    const tbody = document.getElementById('tablaEgresosBody');
    if (tbody) {
        tbody.innerHTML = egresos.map(egreso => `
            <tr>
                <td>${Utils.formatearFecha(egreso.fecha)}</td>
                <td>${egreso.categoria}</td>
                <td>${egreso.descripcion}</td>
                <td>${egreso.proveedor}</td>
                <td>${Utils.formatearMonto(egreso.monto)}</td>
                <td>${egreso.metodo}</td>
                <td>${egreso.comprobante}</td>
            </tr>
        `).join('');

        const total = egresos.reduce((sum, e) => sum + e.monto, 0);
        document.getElementById('totalEgresosTabla').textContent = Utils.formatearMonto(total);
    }
    document.getElementById('reporteEgresos').style.display = 'block';  // Mostrar sección de egresos
}
