// CORRECCIÓN COMPLETA DE morosidad.js
let modalDetalleMoroso;
let morosoActual = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inicializando módulo...');

    try {
        // Elimina la llamada al spinner aquí
        // await cargarDatos();  
    } catch(error) {
        console.error('Error fatal:', error);
        alert('Error al inicializar el módulo');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('⚠️ Inicializando módulo de morosidad...');
    inicializarMorosidad();
});

async function inicializarMorosidad() {
    try {
        modalDetalleMoroso = new bootstrap.Modal(document.getElementById('modalDetalleMoroso'));
        await cargarMorosos();
    } catch (error) {
        console.error('Error al inicializar morosidad:', error);
        Utils.showAlert('Error al inicializar el módulo', 'danger');
    }
}

// --- Cambiado a endpoint real ---
async function cargarMorosos() {
    try {
        // Elimina la llamada al spinner aquí también
        // Utils.showLoading(true);

        const response = await Utils.fetchAPI('morosidad.php?action=listar', 'GET');
        let morosos = [];
        if (response && response.success && response.data) {
            morosos = response.data;
        }

        const tbody = document.getElementById('tablaMorosos');
        if (!tbody) return;

        if (morosos.length > 0) {
            tbody.innerHTML = morosos.map(moroso => `
                <tr>
                    <td>Casa ${moroso.num_casa || moroso.numero_casa}</td>
                    <td>${moroso.nombre || moroso.nombre_propietario} ${moroso.apellido_paterno || ''} ${moroso.apellido_materno || ''}</td>
                    <td>${moroso.rut}</td>
                    <td>${moroso.telefono_1 || moroso.telefono || ''}</td>
                    <td class="text-center">
                        <span class="badge bg-warning">${moroso.meses_adeudados}</span>
                    </td>
                    <td class="text-danger">${Utils.formatearMonto(moroso.deuda || moroso.deuda_total)}</td>
                    <td class="text-info">${Utils.formatearMonto(moroso.interes_mora)}</td>
                    <td class="fw-bold text-danger">${Utils.formatearMonto(moroso.total_deuda || moroso.total_con_mora)}</td>
                    <td class="text-center">${moroso.dias_mora || moroso.dias_mora_max}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="verDetalleMoroso('${moroso.rut}')">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button class="btn btn-sm btn-success" onclick="registrarPago('${moroso.rut}')">
                            <i class="bi bi-cash"></i> Pagar
                        </button>
                    </td>
                </tr>
            `).join('');
            actualizarResumen(morosos);
        } else {
            tbody.innerHTML = ` 
                <tr>
                    <td colspan="10" class="text-center text-success">
                        <i class="bi bi-check-circle" style="font-size: 2rem;"></i>
                        <p class="mt-2">¡No hay propietarios morosos!</p>
                    </td>
                </tr>
            `;
            actualizarResumen([]);
        }

    } catch (error) {
        console.error('Error al cargar morosos:', error);
        Utils.showAlert('Error al cargar los datos de morosidad', 'danger');
    } finally {
        // Elimina el spinner aquí también
        // Utils.showLoading(false);
    }
}

function actualizarResumen(morosos) {
    const totalMorosos = morosos.length;
    const deudaTotal = morosos.reduce((sum, m) => sum + parseFloat(m.deuda || m.deuda_total || 0), 0);
    const totalIntereses = morosos.reduce((sum, m) => sum + parseFloat(m.interes_mora || 0), 0);
    const promedioDias = totalMorosos > 0
        ? Math.round(morosos.reduce((sum, m) => sum + parseInt(m.dias_mora || m.dias_mora_max || 0), 0) / totalMorosos)
        : 0;

    const totalMorososElem = document.getElementById('totalMorosos');
    const deudaTotalElem = document.getElementById('deudaTotal');
    const totalInteresesElem = document.getElementById('totalIntereses');
    const promedioDiasElem = document.getElementById('promedioDias');

    if (totalMorososElem) totalMorososElem.textContent = totalMorosos;
    if (deudaTotalElem) deudaTotalElem.textContent = Utils.formatearMonto(deudaTotal);
    if (totalInteresesElem) totalInteresesElem.textContent = Utils.formatearMonto(totalIntereses);
    if (promedioDiasElem) promedioDiasElem.textContent = promedioDias;
}

// --- Puedes implementar este fetch si tienes el endpoint para el detalle individual ---
async function verDetalleMoroso(rut) {
    try {
        // Elimina la llamada al spinner aquí
        // Utils.showLoading(true);
        // Ejemplo si tienes endpoint detalle
        // const response = await Utils.fetchAPI(`morosidad.php?action=detalle&rut=${rut}`, 'GET');
        // if (response && response.success && response.data) { ...mostrar en modalDetalleMoroso... }
        Utils.showAlert('Función de detalle por implementar para rut: ' + rut, 'warning');
    } catch (error) {
        console.error('Error al cargar detalle:', error);
        Utils.showAlert('Error al cargar el detalle de morosidad', 'danger');
    } finally {
        // Elimina el spinner aquí también
        // Utils.showLoading(false);
    }
}

function registrarPago(rut) {
    Utils.showConfirm(
        'Registrar Pago',
        '¿Desea ir a la página de pagos para registrar el pago de este propietario?',
        () => {
            window.location.href = `pagos.html?rut=${rut}`;
        }
    );
}

function registrarPagoMoroso() {
    if (morosoActual && morosoActual.propietario) {
        window.location.href = `pagos.html?rut=${morosoActual.propietario.rut}`;
    }
}

function exportarMorosos() {
    Utils.exportarTablaExcel('tablaMorosos', 'reporte_morosidad_' + new Date().toISOString().split('T')[0]);
}

window.verDetalleMoroso = verDetalleMoroso;
window.registrarPago = registrarPago;
window.registrarPagoMoroso = registrarPagoMoroso;
window.exportarMorosos = exportarMorosos;
