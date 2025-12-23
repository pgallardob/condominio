document.addEventListener("DOMContentLoaded", function () {
    const tablaEgresos = document.getElementById("tablaEgresos");
    const totalEgresosEl = document.getElementById("totalEgresos");
    const cantidadEgresosEl = document.getElementById("cantidadEgresos");
    const promedioEgresosEl = document.getElementById("promedioEgresos");
    const filtroCategoria = document.getElementById("filtroCategoria");
    const filtroMes = document.getElementById("filtroMes");
    const filtroAnio = document.getElementById("filtroAnio");
    const btnFiltrar = document.getElementById("btnFiltrar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const modalEgreso = new bootstrap.Modal(document.getElementById("modalEgreso"));
    const btnGuardarEgreso = document.getElementById("btnGuardarEgreso");
    const formEgreso = document.getElementById("formEgreso");
    const egresoIdInput = document.getElementById("egresoId");
    const chartEgresosCanvas = document.getElementById("chartEgresos");
    let chartEgresos;

    const API_URL = "../api/egresos.php";

    function llenarMeses() {
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.text = i;
            filtroMes.appendChild(option);
        }
    }

    function llenarAnios() {
        const yearActual = new Date().getFullYear();
        for (let i = yearActual; i >= yearActual - 10; i--) {
            const option = document.createElement("option");
            option.value = i;
            option.text = i;
            filtroAnio.appendChild(option);
        }
    }

    function mostrarAlerta(mensaje, tipo = "success") {
        const alertContainer = document.getElementById("alertContainer");
        alertContainer.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    }

    function fetchEgresos(categoria = "", mes = "", anio = "") {
        let url = `${API_URL}?action=listar`;
        if (categoria) url += `&categoria=${categoria}`;
        if (mes) url += `&mes=${mes}`;
        if (anio) url += `&anio=${anio}`;

        fetch(url)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    renderTabla(res.data);
                    renderEstadisticas(res.data);
                    renderGrafico(res.data);
                } else {
                    mostrarAlerta(res.error || "Error al obtener egresos", "danger");
                }
            })
            .catch(err => {
                mostrarAlerta("Error de conexión al servidor", "danger");
                console.error(err);
            });
    }

    function renderTabla(egresos) {
        tablaEgresos.innerHTML = "";
        if (egresos.length === 0) {
            tablaEgresos.innerHTML = `<tr><td colspan="9" class="text-center">No se encontraron egresos</td></tr>`;
            return;
        }

        egresos.forEach(e => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${e.id}</td>
                <td>${e.fecha_egreso}</td>
                <td>${e.categoria}</td>
                <td>${e.descripcion}</td>
                <td>${e.nombre_proveedor || "-"}</td>
                <td>$${parseFloat(e.monto).toLocaleString()}</td>
                <td>${e.metodo_pago}</td>
                <td>${e.comprobante || "-"}</td>
                <td>
                    <button class="btn btn-sm btn-warning btnEditar" data-id="${e.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btnEliminar" data-id="${e.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tablaEgresos.appendChild(tr);
        });

        document.querySelectorAll(".btnEditar").forEach(btn => {
            btn.addEventListener("click", () => editarEgreso(btn.dataset.id));
        });

        document.querySelectorAll(".btnEliminar").forEach(btn => {
            btn.addEventListener("click", () => eliminarEgreso(btn.dataset.id));
        });
    }

    function renderEstadisticas(egresos) {
        const total = egresos.reduce((sum, e) => sum + parseFloat(e.monto), 0);
        totalEgresosEl.textContent = `$${total.toLocaleString()}`;
        cantidadEgresosEl.textContent = egresos.length;
        promedioEgresosEl.textContent = `$${(total / (egresos.length || 1)).toFixed(2)}`;
    }

    function renderGrafico(egresos) {
        const categorias = {};
        egresos.forEach(e => {
            categorias[e.categoria] = (categorias[e.categoria] || 0) + parseFloat(e.monto);
        });

        const labels = Object.keys(categorias);
        const data = Object.values(categorias);

        if (chartEgresos) chartEgresos.destroy();

        chartEgresos = new Chart(chartEgresosCanvas, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Monto por Categoría",
                    data,
                    backgroundColor: "rgba(54, 162, 235, 0.7)"
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    function limpiarFiltros() {
        filtroCategoria.value = "";
        filtroMes.value = "";
        filtroAnio.value = "";
        fetchEgresos();
    }

    btnFiltrar.addEventListener("click", () => {
        fetchEgresos(filtroCategoria.value, filtroMes.value, filtroAnio.value);
    });

    btnLimpiar.addEventListener("click", limpiarFiltros);

    function guardarEgreso() {
        const data = {
            fecha_egreso: document.getElementById("fechaEgreso").value,
            categoria: document.getElementById("categoria").value,
            descripcion: document.getElementById("descripcion").value,
            id_proveedor: document.getElementById("idProveedor").value || null,
            monto: document.getElementById("monto").value,
            metodo_pago: document.getElementById("metodoPago").value,
            comprobante: document.getElementById("comprobante").value || null
        };

        let action = "crear";
        if (egresoIdInput.value) {
            action = "actualizar";
            data.id = egresoIdInput.value;
        }

        fetch(`${API_URL}?action=${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                mostrarAlerta(res.message, "success");
                modalEgreso.hide();
                formEgreso.reset();
                egresoIdInput.value = "";
                fetchEgresos();
            } else {
                mostrarAlerta(res.error || "Error al guardar egreso", "danger");
            }
        })
        .catch(err => {
            mostrarAlerta("Error de conexión al servidor", "danger");
            console.error(err);
        });
    }

    btnGuardarEgreso.addEventListener("click", guardarEgreso);

    function editarEgreso(id) {
        fetch(`${API_URL}?action=obtener&id=${id}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    const e = res.data;
                    egresoIdInput.value = e.id;
                    document.getElementById("fechaEgreso").value = e.fecha_egreso;
                    document.getElementById("categoria").value = e.categoria;
                    document.getElementById("descripcion").value = e.descripcion;
                    document.getElementById("idProveedor").value = e.id_proveedor || "";
                    document.getElementById("monto").value = e.monto;
                    document.getElementById("metodoPago").value = e.metodo_pago;
                    document.getElementById("comprobante").value = e.comprobante || "";
                    modalEgreso.show();
                } else {
                    mostrarAlerta(res.error || "Egreso no encontrado", "danger");
                }
            })
            .catch(err => {
                mostrarAlerta("Error de conexión al servidor", "danger");
                console.error(err);
            });
    }

    function eliminarEgreso(id) {
        if (!confirm("¿Desea eliminar este egreso?")) return;

        fetch(`${API_URL}?id=${id}`, { method: "DELETE" })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    mostrarAlerta(res.message, "success");
                    fetchEgresos();
                } else {
                    mostrarAlerta(res.error || "Error al eliminar egreso", "danger");
                }
            })
            .catch(err => {
                mostrarAlerta("Error de conexión al servidor", "danger");
                console.error(err);
            });
    }

    // Inicialización
    llenarMeses();
    llenarAnios();
    fetchEgresos();
});
