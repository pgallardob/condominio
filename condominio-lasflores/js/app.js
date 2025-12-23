const APP = {
    API_URL: 'http://localhost/condominio-lasflores/api/',
    MONTO_GASTO_COMUN: 35000,
    TOTAL_CASAS: 50,
    TASA_MORA_MENSUAL: 2.0,
    currentPage: 'dashboard',
    userData: null
};

async function cargarDatos() {
    try {
        const resultado = await Utils.fetchAPI('obtener_datos_dashboard.php', 'GET');
        if (!resultado || resultado.success === false) {
            throw new Error('No se pudieron cargar los datos del dashboard');
        }
        // Procesa los datos aquí según la estructura, ejemplo:
        // renderizarDashboard(resultado.datos);
    } catch (err) {
        throw err;
    }
}

const Utils = {
    async fetchAPI(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            const response = await fetch(APP.API_URL + endpoint, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error en fetchAPI:', error);
            return { success: false, message: 'Error de comunicación con el servidor' };
        }
    },

    formatearRUT(rut) {
        if (!rut) return '';
        rut = rut.replace(/\./g, '').replace(/-/g, '');
        if (rut.length < 2) return rut;
        const dv = rut.slice(-1);
        let cuerpo = rut.slice(0, -1);
        cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return cuerpo + '-' + dv.toUpperCase();
    },

    formatearMonto(monto) {
        return '$' + parseInt(monto || 0).toLocaleString('es-CL');
    },

    formatearFechaInput(fecha) {
        if (!fecha) {
            return new Date().toISOString().split('T')[0];
        }
        try {
            const d = new Date(fecha);
            return d.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    },

    formatearFecha(fecha) {
        if (!fecha) return '';
        try {
            const d = new Date(fecha);
            const dia = String(d.getDate()).padStart(2, '0');
            const mes = String(d.getMonth() + 1).padStart(2, '0');
            const anio = d.getFullYear();
            return `${dia}/${mes}/${anio}`;
        } catch {
            return fecha;
        }
    },

    getNombreMes(mes) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[mes - 1] || '';
    },

    generarOpcionesCasas(selectElement) {
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="">Seleccione casa</option>';
        for (let i = 1; i <= APP.TOTAL_CASAS; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Casa ${i}`;
            selectElement.appendChild(option);
        }
    },

    generarOpcionesMeses(selectElement, incluirVacio = true) {
        if (!selectElement) return;
        selectElement.innerHTML = incluirVacio ? '<option value="">Seleccione mes</option>' : '';
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = this.getNombreMes(i);
            selectElement.appendChild(option);
        }
    },

    // 🔧 CORRECCIÓN: Generar años 2025 a 2030 en orden ascendente
    generarOpcionesAnios(selectElement, inicio = 2025, fin = 2030) {
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="">Seleccione año</option>';

        for (let i = inicio; i <= fin; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            selectElement.appendChild(option);
        }
    }
};

// ✅ CORREGIDO: SOLO CARGAR DATOS EN DASHBOARD, NO EN TODAS LAS PÁGINAS
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Inicializando módulo...');

    const isDashboard = window.location.pathname.includes('index.html') || 
                        window.location.pathname.endsWith('/') ||
                        window.location.pathname.includes('dashboard');
    
    if (isDashboard) {
        try {
            await cargarDatos();
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App inicializada correctamente');

    const fechaInputs = document.querySelectorAll('input[type="date"]:not([value])');
    fechaInputs.forEach(input => {
        input.value = Utils.formatearFechaInput();
    });

    const horaInputs = document.querySelectorAll('input[type="time"]:not([value])');
    horaInputs.forEach(input => {
        input.value = new Date().toTimeString().split(' ')[0].substring(0, 5);
    });

    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('rut-input')) {
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const newValue = Utils.formatearRUT(e.target.value);
            if (newValue !== oldValue) {
                e.target.value = newValue;
                const newCursorPos = cursorPos + (newValue.length - oldValue.length);
                e.target.setSelectionRange(newCursorPos, newCursorPos);
            }
        }
    });

    // Llamada al select de años para llenarlo de 2025 a 2030
    const selectAnio = document.getElementById('selectAnio');
    if (selectAnio) {
        Utils.generarOpcionesAnios(selectAnio, 2025, 2030);
    }

    // Filtrado por mes y año
    const btnFiltrar = document.getElementById('btnFiltrar');
    const selectMes = document.getElementById('selectMes');

    if (btnFiltrar && selectMes && selectAnio) {
        btnFiltrar.addEventListener('click', async function() {
            try {
                const mes = selectMes.value;
                const anio = selectAnio.value;
                const url = `obtener_datos_dashboard.php?mes=${mes}&anio=${anio}`;
                const resultado = await Utils.fetchAPI(url, 'GET');
                if (!resultado.success) {
                    alert('Error de conexión con el servidor. Verifica que el archivo API existe.');
                    return;
                }
                // Procesa el resultado filtrado aquí...
                // renderizarDashboard(resultado.datos);
            } catch (error) {
                alert('Error de conexión con el servidor. Verifica que el archivo API existe.');
            }
        });
    }
});

window.APP = APP;
window.Utils = Utils;
