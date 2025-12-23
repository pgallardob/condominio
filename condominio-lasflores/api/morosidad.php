<?php
// api/morosidad.php
require_once 'db.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch($method) {
        case 'GET':
            if ($action == 'lista' || $action == 'listar') {
                obtenerMorosos($conn);
            } elseif ($action == 'detalle' && isset($_GET['id'])) {
                obtenerDetalleMoroso($conn, $_GET['id']);
            } else {
                sendResponse(false, null, '', 'Acción no válida');
            }
            break;
        default:
            sendResponse(false, null, '', 'Método no permitido');
    }
} catch (Exception $e) {
    sendResponse(false, null, '', 'Error en la consulta: ' . $e->getMessage());
}

function obtenerMorosos($conn) {
    $query = "
        SELECT 
            p.id,
            p.num_casa as numero_casa,
            CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')) as nombre_propietario,
            p.rut,
            p.telefono_1 as telefono,
            COUNT(pa.id) as meses_adeudados,
            SUM(pa.monto_base) as deuda_total,
            SUM(pa.interes_mora) as interes_mora,
            SUM(pa.monto_base + COALESCE(pa.interes_mora, 0)) as total_con_mora,
            MAX(DATEDIFF(CURDATE(), STR_TO_DATE(CONCAT(pa.anio, '-', pa.mes, '-10'), '%Y-%m-%d'))) as dias_mora_max
        FROM propietarios p
        LEFT JOIN pagos pa ON p.rut = pa.rut_propietario 
            AND pa.fecha_pago IS NULL 
            AND STR_TO_DATE(CONCAT(pa.anio, '-', pa.mes, '-10'), '%Y-%m-%d') < CURDATE()
        WHERE p.estado = 'activo'
        GROUP BY p.id, p.num_casa, p.nombre, p.apellido_paterno, p.apellido_materno, p.rut, p.telefono_1
        HAVING deuda_total > 0
        ORDER BY deuda_total DESC
    ";
    $result = $conn->query($query);
    $morosos = [];
    while ($row = $result->fetch_assoc()) {
        $morosos[] = $row;
    }
    if (empty($morosos)) {
        sendResponse(false, null, '', 'No se encontraron morosos');
        return;
    }
    sendResponse(true, $morosos, 'Morosos obtenidos correctamente');
}

function obtenerDetalleMoroso($conn, $idPropietario) {
    if (empty($idPropietario) || !is_numeric($idPropietario)) {
        sendResponse(false, null, '', 'ID de propietario inválido');
        return;
    }
    // Obtener datos del propietario
    $propQuery = "SELECT * FROM propietarios WHERE id = ? AND estado = 'activo'";
    $propStmt = $conn->prepare($propQuery);
    $propStmt->bind_param("i", $idPropietario);
    $propStmt->execute();
    $resultProp = $propStmt->get_result();
    if ($resultProp->num_rows === 0) {
        sendResponse(false, null, '', 'Propietario no encontrado o no está activo');
        $propStmt->close();
        return;
    }
    $propietario = $resultProp->fetch_assoc();
    $propStmt->close();

    // Obtener pagos pendientes
    $pagosQuery = "
        SELECT 
            CONCAT(mes, '/', anio) as periodo,
            monto_base as monto_gastoscomun,
            0 as monto_extras,
            monto_base as monto_total,
            DATEDIFF(CURDATE(), STR_TO_DATE(CONCAT(anio, '-', mes, '-10'), '%Y-%m-%d')) as dias_mora,
            COALESCE(interes_mora, 0) as interes_calculado,
            (monto_base + COALESCE(interes_mora, 0)) as total_con_interes
        FROM pagos 
        WHERE rut_propietario = ? 
            AND fecha_pago IS NULL 
            AND STR_TO_DATE(CONCAT(anio, '-', mes, '-10'), '%Y-%m-%d') < CURDATE()
        ORDER BY anio DESC, mes DESC
    ";
    $pagosStmt = $conn->prepare($pagosQuery);
    $pagosStmt->bind_param("s", $propietario['rut']);
    $pagosStmt->execute();
    $resultPagos = $pagosStmt->get_result();
    $pagosPendientes = [];
    while ($row = $resultPagos->fetch_assoc()) {
        $pagosPendientes[] = $row;
    }
    $pagosStmt->close();

    if (empty($pagosPendientes)) {
        sendResponse(false, null, '', 'No hay pagos pendientes para este propietario');
        return;
    }
    $totalDeuda = array_sum(array_column($pagosPendientes, 'monto_total'));
    $totalInteres = array_sum(array_column($pagosPendientes, 'interes_calculado'));
    $totalAPagar = $totalDeuda + $totalInteres;

    $resultado = [
        'propietario' => $propietario,
        'pagos_pendientes' => $pagosPendientes,
        'resumen' => [
            'total_deuda' => $totalDeuda,
            'total_interes' => $totalInteres,
            'total_a_pagar' => $totalAPagar
        ]
    ];
    sendResponse(true, $resultado, 'Detalle de morosidad obtenido correctamente');
}

function sendResponse($success, $data, $message, $error = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message,
        'error' => $error
    ]);
    exit;
}
?>
