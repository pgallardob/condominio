<?php
// api/reportes.php
require_once 'db.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    if ($method == 'GET') {
        switch($action) {
            case 'resumen':
                $mes = $_GET['mes'] ?? date('m');
                $anio = $_GET['anio'] ?? date('Y');
                generarResumenFinanciero($conn, $mes, $anio);
                break;
            case 'estado_pagos':
                $mes = $_GET['mes'] ?? date('m');
                $anio = $_GET['anio'] ?? date('Y');
                obtenerEstadoPagos($conn, $mes, $anio);
                break;
            case 'egresos_categoria':
                $mes = $_GET['mes'] ?? date('m');
                $anio = $_GET['anio'] ?? date('Y');
                obtenerEgresosPorCategoria($conn, $mes, $anio);
                break;
            case 'ingresos':
                $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
                $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-t');
                obtenerReporteIngresos($conn, $fechaInicio, $fechaFin);
                break;
            case 'egresos':
                $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
                $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-t');
                obtenerReporteEgresos($conn, $fechaInicio, $fechaFin);
                break;
            case 'morosidad':
                obtenerReporteMorosidad($conn);
                break;
            case 'comparativo':
                $anio = $_GET['anio'] ?? date('Y');
                obtenerComparativoMensual($conn, $anio);
                break;
            default:
                sendResponse(false, null, '', 'Acción no válida');
        }
    } else {
        sendResponse(false, null, '', 'Método no permitido');
    }
} catch (Exception $e) {
    sendResponse(false, null, '', $e->getMessage());
}

function generarResumenFinanciero($conn, $mes, $anio) {
    $ingresosStmt = $conn->prepare("SELECT COALESCE(SUM(total_pagado), 0) as total_ingresos, COUNT(*) as total_pagos
        FROM pagos WHERE mes = ? AND anio = ? AND fecha_pago IS NOT NULL");
    $ingresosStmt->bind_param("ii", $mes, $anio);
    $ingresosStmt->execute();
    $ingresos = $ingresosStmt->get_result()->fetch_assoc();
    $ingresosStmt->close();

    $egresosStmt = $conn->prepare("SELECT COALESCE(SUM(monto), 0) as total_egresos, COUNT(*) as total_gastos
        FROM egresos WHERE MONTH(fecha_egreso) = ? AND YEAR(fecha_egreso) = ?");
    $egresosStmt->bind_param("ii", $mes, $anio);
    $egresosStmt->execute();
    $egresos = $egresosStmt->get_result()->fetch_assoc();
    $egresosStmt->close();

    $resumen = [
        'total_ingresos' => floatval($ingresos['total_ingresos']),
        'total_egresos' => floatval($egresos['total_egresos']),
        'saldo' => floatval($ingresos['total_ingresos']) - floatval($egresos['total_egresos']),
        'total_pagos' => intval($ingresos['total_pagos']),
        'total_gastos' => intval($egresos['total_gastos'])
    ];
    sendResponse(true, $resumen, 'Resumen financiero generado correctamente');
}

function obtenerEstadoPagos($conn, $mes, $anio) {
    $stmt = $conn->prepare("SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN fecha_pago IS NOT NULL THEN 1 ELSE 0 END) as pagados,
        SUM(CASE WHEN fecha_pago IS NULL AND interes_mora = 0 THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN fecha_pago IS NULL AND interes_mora > 0 THEN 1 ELSE 0 END) as morosos
        FROM pagos WHERE mes = ? AND anio = ?");
    $stmt->bind_param("ii", $mes, $anio);
    $stmt->execute();
    $estado = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    sendResponse(true, [
        'pagados' => intval($estado['pagados']),
        'pendientes' => intval($estado['pendientes']),
        'morosos' => intval($estado['morosos'])
    ], 'Estado de pagos obtenido correctamente');
}

function obtenerEgresosPorCategoria($conn, $mes, $anio) {
    $stmt = $conn->prepare("SELECT categoria as nombre_categoria, SUM(monto) as total
        FROM egresos WHERE MONTH(fecha_egreso) = ? AND YEAR(fecha_egreso) = ?
        GROUP BY categoria ORDER BY total DESC");
    $stmt->bind_param("ii", $mes, $anio);
    $stmt->execute();
    $result = $stmt->get_result();
    $egresos = [];
    while ($row = $result->fetch_assoc()) {
        $egresos[] = $row;
    }
    $stmt->close();
    sendResponse(true, $egresos, 'Egresos por categoría obtenidos correctamente');
}

function obtenerReporteIngresos($conn, $fechaInicio, $fechaFin) {
    $stmt = $conn->prepare("SELECT 
        p.fecha_pago as fecha,
        prop.num_casa as casa,
        CONCAT(prop.nombre, ' ', prop.apellido_paterno) as propietario,
        CONCAT(p.mes, '/', p.anio) as periodo,
        p.monto_base as gasto_comun,
        0 as extras,
        p.interes_mora as mora,
        p.total_pagado as total,
        p.forma_pago as metodo
        FROM pagos p
        INNER JOIN propietarios prop ON p.rut_propietario = prop.rut
        WHERE p.fecha_pago BETWEEN ? AND ?
        ORDER BY p.fecha_pago DESC");
    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $result = $stmt->get_result();
    $ingresos = [];
    while ($row = $result->fetch_assoc()) {
        $ingresos[] = $row;
    }
    $stmt->close();
    sendResponse(true, $ingresos, 'Reporte de ingresos generado correctamente');
}

function obtenerReporteEgresos($conn, $fechaInicio, $fechaFin) {
    $stmt = $conn->prepare("SELECT 
        e.fecha_egreso as fecha,
        e.categoria,
        e.descripcion,
        p.nombre as proveedor,
        e.monto,
        e.metodo_pago as metodo,
        e.comprobante
        FROM egresos e
        LEFT JOIN proveedores p ON e.id_proveedor = p.id
        WHERE e.fecha_egreso BETWEEN ? AND ?
        ORDER BY e.fecha_egreso DESC");
    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $result = $stmt->get_result();
    $egresos = [];
    while ($row = $result->fetch_assoc()) {
        $egresos[] = $row;
    }
    $stmt->close();
    sendResponse(true, $egresos, 'Reporte de egresos generado correctamente');
}

function obtenerReporteMorosidad($conn) {
    $query = "
        SELECT 
            p.num_casa as casa,
            CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')) as propietario,
            p.rut,
            p.telefono_1 as telefono,
            COUNT(pa.id) as meses_adeudados,
            SUM(pa.monto_base) as deuda,
            MAX(DATEDIFF(CURDATE(), STR_TO_DATE(CONCAT(pa.anio, '-', pa.mes, '-10'), '%Y-%m-%d'))) as dias_mora,
            SUM(pa.interes_mora) as interes_mora,
            SUM(pa.monto_base + COALESCE(pa.interes_mora, 0)) as total_deuda
        FROM propietarios p
        LEFT JOIN pagos pa ON p.rut = pa.rut_propietario 
            AND pa.fecha_pago IS NULL 
            AND STR_TO_DATE(CONCAT(pa.anio, '-', pa.mes, '-10'), '%Y-%m-%d') < CURDATE()
        WHERE p.estado = 'activo'
        GROUP BY p.id, p.num_casa, p.nombre, p.apellido_paterno, p.apellido_materno, p.rut, p.telefono_1
        HAVING deuda > 0
        ORDER BY total_deuda DESC
    ";
    $result = $conn->query($query);
    $morosidad = [];
    while ($row = $result->fetch_assoc()) {
        $morosidad[] = $row;
    }
    sendResponse(true, $morosidad, 'Reporte de morosidad generado correctamente');
}

function obtenerComparativoMensual($conn, $anio) {
    $stmt = $conn->prepare("
        SELECT 
            m.mes,
            COALESCE(SUM(CASE WHEN p.fecha_pago IS NOT NULL THEN p.total_pagado ELSE 0 END), 0) as ingresos,
            COALESCE(SUM(e.monto), 0) as egresos
        FROM (
            SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
            UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
        ) m
        LEFT JOIN pagos p ON m.mes = p.mes AND p.anio = ? AND p.fecha_pago IS NOT NULL
        LEFT JOIN egresos e ON m.mes = MONTH(e.fecha_egreso) AND YEAR(e.fecha_egreso) = ?
        GROUP BY m.mes
        ORDER BY m.mes
    ");
    $stmt->bind_param("ii", $anio, $anio);
    $stmt->execute();
    $result = $stmt->get_result();
    $comparativo = [];
    while ($row = $result->fetch_assoc()) {
        $comparativo[] = [
            'mes' => intval($row['mes']),
            'ingresos' => floatval($row['ingresos']),
            'egresos' => floatval($row['egresos']),
            'saldo' => floatval($row['ingresos']) - floatval($row['egresos'])
        ];
    }
    $stmt->close();
    sendResponse(true, $comparativo, 'Comparativo mensual generado correctamente');
}

function sendResponse($success, $data = null, $message = '', $error = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message,
        'error' => $error
    ]);
    exit;
}
?>

