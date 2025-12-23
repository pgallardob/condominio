document.addEventListener("DOMContentLoaded", () => {
    const tablaBody = document.getElementById("tbodyPropietarios");
    const infoPaginacion = document.getElementById("infoPaginacion");
    const paginacion = document.getElementById("paginacion");
    const formPropietario = document.getElementById("formPropietario");
    const modalPropietarioEl = document.getElementById("modalPropietario");
    const modalEliminarEl = document.getElementById("modalEliminar");
    const propietarioEliminarNombre = document.getElementById("propietarioEliminar");

    const modalPropietario = modalPropietarioEl ? new bootstrap.Modal(modalPropietarioEl) : null;
    const modalEliminar = modalEliminarEl ? new bootstrap.Modal(modalEliminarEl) : null;

    // Filtros
    const filtroRut = document.getElementById("filtroRut");
    const filtroNombre = document.getElementById("filtroNombre");
    const filtroCasa = document.getElementById("filtroCasa");
    const filtroEstado = document.getElementById("filtroEstado");
    const btnFiltrar = document.getElementById("btnFiltrar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnExportar = document.getElementById("btnExportar");

    let propietarios = [];
    let paginaActual = 1;
    const registrosPorPagina = 5;
    let propietarioSeleccionadoId = null; // Usamos id_propietario internamente

    function inicializarCasas() {
        if (!filtroCasa) return;
        filtroCasa.innerHTML = '<option value="">Todas</option>';
        const numCasa = document.getElementById("numCasa");
        if (numCasa) numCasa.innerHTML = '<option value="">Seleccione casa</option>';
        for (let i = 1; i <= 50; i++) {
            filtroCasa.innerHTML += `<option value="${i}">${i}</option>`;
            if (numCasa) numCasa.innerHTML += `<option value="${i}">${i}</option>`;
        }
    }

    async function cargarPropietarios() {
        try {
            const res = await fetch("../api/propietarios.php?action=listar");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            propietarios = Array.isArray(json.data) ? json.data : [];
            mostrarPropietarios();
        } catch (error) {
            console.error("Error cargando propietarios:", error);
            if (tablaBody) {
                tablaBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error cargando datos</td></tr>`;
                if (infoPaginacion) infoPaginacion.textContent = `Mostrando 0 de 0 registros`;
            }
        }
    }

    function mostrarPropietarios() {
        const rutFilter = (filtroRut ? filtroRut.value : "").toLowerCase();
        const nombreFilter = (filtroNombre ? filtroNombre.value : "").toLowerCase();
        const casaFilter = filtroCasa ? filtroCasa.value : "";
        const estadoFilter = filtroEstado ? filtroEstado.value : "";

        let filtrados = propietarios.filter(p => {
            const rut = (p.rut ?? "").toString().toLowerCase();
            const nombreCompleto = ((p.nombre ?? "") + " " + (p.apellido_paterno ?? "") + " " + (p.apellido_materno ?? "")).toLowerCase();
            const numCasaStr = (p.num_casa ?? "").toString();
            return (
                (!rutFilter || rut.includes(rutFilter)) &&
                (!nombreFilter || nombreCompleto.includes(nombreFilter)) &&
                (!casaFilter || Number(numCasaStr) === Number(casaFilter)) &&
                (!estadoFilter || (p.estado ?? "") === estadoFilter)
            );
        });

        const totalRegistros = filtrados.length;
        const totalPaginas = Math.max(Math.ceil(totalRegistros / registrosPorPagina), 1);
        if (paginaActual > totalPaginas) paginaActual = 1;

        const inicio = (paginaActual - 1) * registrosPorPagina;
        const fin = inicio + registrosPorPagina;
        const paginados = filtrados.slice(inicio, fin);

        if (!tablaBody) return;

        tablaBody.innerHTML = "";

        if (paginados.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="7" class="text-center">No hay registros</td></tr>`;
            infoPaginacion.textContent = `Mostrando 0 de 0 registros`;
        } else {
            paginados.forEach(p => {
                tablaBody.innerHTML += `
                    <tr>
                        <td>${p.num_casa ?? ""}</td>
                        <td>${p.rut ?? ""}</td>
                        <td>${p.nombre ?? ""} ${p.apellido_paterno ?? ""} ${p.apellido_materno ?? ""}</td>
                        <td>${p.email ?? ""}</td>
                        <td>${p.telefono_1 ?? ""}</td>
                        <td>${p.estado ?? ""}</td>
                        <td>
                            <button class="btn btn-sm btn-warning me-1 btnEditar" data-id="${p.id_propietario}"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-danger btnEliminar" data-id="${p.id_propietario}" data-nombre="${(p.nombre ?? "") + " " + (p.apellido_paterno ?? "") + " " + (p.apellido_materno ?? "")}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>`;
            });

            infoPaginacion.textContent = `Mostrando ${inicio + 1} a ${Math.min(fin, totalRegistros)} de ${totalRegistros}`;
        }

        renderizarPaginacion(totalPaginas);
        agregarEventosAcciones();
    }

    function renderizarPaginacion(totalPaginas) {
        if (!paginacion) return;
        paginacion.innerHTML = "";
        for (let i = 1; i <= totalPaginas; i++) {
            const activeClass = (i === paginaActual) ? "active" : "";
            paginacion.innerHTML += `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`;
        }

        document.querySelectorAll("#paginacion .page-link").forEach(link => {
            link.addEventListener("click", e => {
                e.preventDefault();
                const page = Number(link.dataset.page) || 1;
                if (page === paginaActual) return;
                paginaActual = page;
                mostrarPropietarios();
            });
        });
    }

    function agregarEventosAcciones() {
        document.querySelectorAll(".btnEliminar").forEach(btn => {
            btn.addEventListener("click", () => {
                propietarioSeleccionadoId = btn.dataset.id;
                if (propietarioEliminarNombre) propietarioEliminarNombre.textContent = btn.dataset.nombre;
                if (modalEliminar) modalEliminar.show();
            });
        });

        document.querySelectorAll(".btnEditar").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const p = propietarios.find(x => x.id_propietario == id);

                if (p) {
                    const get = id => document.getElementById(id);
                    if (get("accion")) get("accion").value = "actualizar";
                    if (get("idPropietario")) get("idPropietario").value = p.id_propietario ?? "";
                    if (get("rut")) get("rut").value = p.rut ?? "";
                    if (get("numCasa")) get("numCasa").value = p.num_casa ?? "";
                    if (get("nombre")) get("nombre").value = p.nombre ?? "";
                    if (get("apellidoPaterno")) get("apellidoPaterno").value = p.apellido_paterno ?? "";
                    if (get("apellidoMaterno")) get("apellidoMaterno").value = p.apellido_materno ?? "";
                    if (get("email")) get("email").value = p.email ?? "";
                    if (get("telefono1")) get("telefono1").value = p.telefono_1 ?? "";
                    if (get("telefono2")) get("telefono2").value = p.telefono_2 ?? "";
                    if (get("estado")) get("estado").value = p.estado ?? "activo";

                    if (modalPropietario) modalPropietario.show();
                }
            });
        });
    }

    // Form submit (crear / actualizar)
    if (formPropietario) {
        formPropietario.addEventListener("submit", async e => {
            e.preventDefault();

            const data = {
                id_propietario: document.getElementById("idPropietario")?.value || null,
                rut: document.getElementById("rut").value,
                num_casa: document.getElementById("numCasa").value,
                nombre: document.getElementById("nombre").value,
                apellido_paterno: document.getElementById("apellidoPaterno").value,
                apellido_materno: document.getElementById("apellidoMaterno").value,
                email: document.getElementById("email").value,
                telefono_1: document.getElementById("telefono1").value,
                telefono_2: document.getElementById("telefono2").value,
                estado: document.getElementById("estado").value
            };

            // Validar duplicidad de casa
            const numCasaSeleccionada = Number(data.num_casa);
            const propietarioActual = data.id_propietario;
            const casaOcupada = propietarios.some(p =>
                Number(p.num_casa) === numCasaSeleccionada && p.id_propietario != propietarioActual
            );

            if (casaOcupada) {
                alert(`La casa Nº ${numCasaSeleccionada} ya está asignada a otro propietario.`);
                return;
            }

            const accion = document.getElementById("accion").value;
            const url = `../api/propietarios.php?action=${accion}`;

            try {
                const res = await fetch(url, {
                    method: "POST",
                    body: JSON.stringify(data)
                });
                const json = await res.json();

                if (json.success) {
                    if (modalPropietario) modalPropietario.hide();
                    formPropietario.reset();
                    cargarPropietarios();
                } else {
                    alert(json.message || "Error al guardar");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Error en la petición. Revisa la consola.");
            }
        });
    }

    // Confirmar eliminación
    const btnConfirmarEliminar = document.getElementById("btnConfirmarEliminar");
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener("click", async () => {
            const url = "../api/propietarios.php?action=eliminar";
            try {
                const res = await fetch(url, {
                    method: "POST",
                    body: JSON.stringify({ id_propietario: propietarioSeleccionadoId })
                });
                const json = await res.json();

                if (json.success) {
                    if (modalEliminar) modalEliminar.hide();
                    cargarPropietarios();
                } else {
                    alert(json.message || "No se pudo eliminar");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Error en la petición de eliminación. Revisa la consola.");
            }
        });
    }

    // Filtros
    if (btnFiltrar) btnFiltrar.addEventListener("click", () => { paginaActual = 1; mostrarPropietarios(); });
    if (btnLimpiar) btnLimpiar.addEventListener("click", () => {
        if (filtroRut) filtroRut.value = "";
        if (filtroNombre) filtroNombre.value = "";
        if (filtroCasa) filtroCasa.value = "";
        if (filtroEstado) filtroEstado.value = "";
        paginaActual = 1;
        mostrarPropietarios();
    });

    // Exportar
    if (btnExportar) {
        btnExportar.addEventListener("click", () => {
            let filtrados = propietarios.filter(p => {
                const rut = (p.rut ?? "").toLowerCase();
                const nombreCompleto = ((p.nombre ?? "") + " " + (p.apellido_paterno ?? "") + " " + (p.apellido_materno ?? "")).toLowerCase();
                const numCasaStr = (p.num_casa ?? "").toString();
                return (!filtroRut.value || rut.includes(filtroRut.value.toLowerCase())) &&
                       (!filtroNombre.value || nombreCompleto.includes(filtroNombre.value.toLowerCase())) &&
                       (!filtroCasa.value || Number(numCasaStr) === Number(filtroCasa.value)) &&
                       (!filtroEstado.value || p.estado === filtroEstado.value);
            });

            if (filtrados.length === 0) { alert("No hay datos para exportar."); return; }

            const datosExcel = filtrados.map(p => ({
                "Casa": p.num_casa,
                "RUT": p.rut,
                "Nombre Completo": `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno}`,
                "Email": p.email || "",
                "Teléfono 1": p.telefono_1 || "",
                "Teléfono 2": p.telefono_2 || "",
                "Estado": p.estado
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(datosExcel);
            const anchoColumnas = Object.keys(datosExcel[0]).map(k => ({ wch: Math.max(10, Math.min(40, k.length + 20)) }));
            ws['!cols'] = anchoColumnas;
            XLSX.utils.book_append_sheet(wb, ws, "Propietarios");
            XLSX.writeFile(wb, "Propietarios.xlsx");
        });
    }

    inicializarCasas();
    cargarPropietarios();
});
