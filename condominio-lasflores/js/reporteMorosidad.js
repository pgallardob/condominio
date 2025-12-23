async function generarReporteMorosidad(fechaInicio, fechaFin) {
    await new Promise(resolve => setTimeout(resolve, 600));  // Simulación de espera

    const morosidad = [
        { casa: 15, propietario: 'Juan Pérez', rut: '12.345.678-9', telefono: '+56912345678', meses_adeudados: 2, deuda: 70000, dias_mora: 45, interes_mora: 5000, total_deuda: 75000 },
        { casa: 23, propietario: 'María López', rut: '98.765.432-1', telefono: '+56987654321', meses_adeudados: 1, deuda: 35000, dias_mora: 25, interes_mora: 2000, total_deuda: 37000 }
    ];

    // Llenar tabla con los morosos
    const tbody = document.getElementById('tablaMorosidadBody');
    if (tbody) {
        tbody.innerHTML = morosidad.map(moroso => `
            <tr>
                <td>${moroso.casa}</td>
                <td>${moroso.propietario}</td>
                <td>${moroso.rut}</td>
                <td>${moroso.telefono}</td>
                <td>${moroso.meses_adeudados}</td>
                <td>${Utils.formatearMonto(moroso.deuda)}</td>
                <td>${moroso.dias_mora}</td>
                <td>${Utils.formatearMonto(moroso.interes_mora)}</td>
                <td>${Utils.formatearMonto(moroso.total_deuda)}</td>
            </tr>
        `).join('');

        const total = morosidad.reduce((sum, m) => sum + m.total_deuda, 0);
        document.getElementById('totalMorosidadTabla').textContent = Utils.formatearMonto(total);
    }
    document.getElementById('reporteMorosidad').style.display = 'block';  // Mostrar sección de morosidad
}
