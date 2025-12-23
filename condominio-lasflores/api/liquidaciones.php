<?php
// api/liquidaciones.php
require_once 'db.php'; // Ajusta la ruta si corresponde
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch($method) {
        case 'GET':
            if ($action == 'listar') {
                $id_empleado = $_GET['id_empleado'] ?? '';
                $mes = $_GET['mes'] ?? '';
                $anio = $_GET['anio'] ?? '';
                listarLiquidaciones($conn, $id_empleado, $mes, $anio);
            } elseif ($action == 'obtener' && isset($_GET['id'])) {
                obtenerLiquidacion($conn, $_GET['id']);
            } else {
                sendResponse(false, null, '', 'Acción no válida');
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true) ?? [];
            if ($action == 'crear') {
                crearLiquidacion($conn, $data);
            } elseif ($action == 'actualizar') {
                actualizarLiquidacion($conn, $data);
            } else {
                sendResponse(false, null, '', 'Acción no válida');
            }
            break;

        case 'DELETE':
            if (isset($_GET['id'])) {
                eliminarLiquidacion($conn, $_GET['id']);
            } else {
                sendResponse(false, null, '', 'ID requerido');
            }
            break;

        default:
            sendResponse(false, null, '', 'Método no permitido');
    }
} catch (Exception $e) {
    sendResponse(false, null, '', $e->getMessage());
}

function listarLiquidaciones($conn, $id_empleado = '', $mes = '', $anio = '') {
    $query = "
        SELECT l.*, e.nombre as nombre_empleado, e.rut_empleado as rut, e.cargo
        FROM liquidaciones l
        INNER JOIN empleados e ON l.rut_empleado = e.rut_empleado
        WHERE 1=1
    ";
    if (!empty($id_empleado)) {
        $query .= " AND e.id = " . intval($id_empleado);
    }
    if (!empty($mes)) {
        $query .= " AND l.mes = " . intval($mes);
    }
    if (!empty($anio)) {
        $query .= " AND l.anio = " . intval($anio);
    }
    $query .= " ORDER BY l.anio DESC, l.mes DESC, e.nombre";

    $result = $conn->query($query);
    $liquidaciones = [];
    while ($row = $result->fetch_assoc()) {
        $liquidaciones[] = $row;
    }
    sendResponse(true, $liquidaciones, 'Liquidaciones obtenidas correctamente');
}

function obtenerLiquidacion($conn, $id) {
    $id = intval($id);
    $query = "
        SELECT l.*, e.nombre as nombre_empleado, e.rut_empleado as rut, e.cargo
        FROM liquidaciones l
        INNER JOIN empleados e ON l.rut_empleado = e.rut_empleado
        WHERE l.id = $id
    ";
    $result = $conn->query($query);
    if ($result->num_rows > 0) {
        $liquidacion = $result->fetch_assoc();
        sendResponse(true, $liquidacion, 'Liquidación obtenida correctamente');
    } else {
        sendResponse(false, null, '', 'Liquidación no encontrada');
    }
}

function crearLiquidacion($conn, $data) {
    $required = ['id_empleado', 'mes', 'anio', 'sueldo_base', 'fecha_pago'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendResponse(false, null, '', "Campo requerido: $field");
            return;
        }
    }
    // Obtener RUT del empleado
    $id_empleado = intval($data['id_empleado']);
    $query = "SELECT rut_empleado FROM empleados WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id_empleado);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        sendResponse(false, null, '', 'Empleado no encontrado');
        $stmt->close();
        return;
    }
    $empleado = $result->fetch_assoc();
    $rut_empleado = $empleado['rut_empleado'];
    $stmt->close();

    // Verificar si ya existe liquidación para este periodo
    $mes = intval($data['mes']);
    $anio = intval($data['anio']);
    $checkQuery = "SELECT id FROM liquidaciones WHERE rut_empleado = ? AND mes = ? AND anio = ?";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bind_param("sii", $rut_empleado, $mes, $anio);
    $checkStmt->execute();
    $checkStmt->store_result();
    if ($checkStmt->num_rows > 0) {
        sendResponse(false, null, '', 'Ya existe una liquidación para este periodo');
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    // Datos calculados
    $sueldo_base = floatval($data['sueldo_base']);
    $bonos = floatval($data['bonos'] ?? 0);
    $horas_extra = intval($data['horas_extra'] ?? 0);
    $otros_descuentos = floatval($data['otros_descuentos'] ?? 0);
    $totalHaberes = $sueldo_base + $bonos + ($horas_extra * 10000);
    $afp = round($totalHaberes * 0.1275);
    $salud = round($totalHaberes * 0.07);
    $totalDescuentos = $afp + $salud + $otros_descuentos;
    $liquidoPagar = $totalHaberes - $totalDescuentos;
    $fecha_pago = $data['fecha_pago'];
    $observaciones = $data['observaciones'] ?? null;

    $stmt = $conn->prepare("INSERT INTO liquidaciones 
        (rut_empleado, mes, anio, sueldo_base, bonos, horas_extra, total_haberes, afp, salud, otros_descuentos, total_descuentos, liquido_pagar, fecha_pago, observaciones, estado, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pagada', NOW())");
    $stmt->bind_param(
        "siiididddddsss",
        $rut_empleado,
        $mes,
        $anio,
        $sueldo_base,
        $bonos,
        $horas_extra,
        $totalHaberes,
        $afp,
        $salud,
        $otros_descuentos,
        $totalDescuentos,
        $liquidoPagar,
        $fecha_pago,
        $observaciones
    );
    if ($stmt->execute()) {
        sendResponse(true, ['id' => $conn->insert_id], 'Liquidación creada correctamente');
    } else {
        sendResponse(false, null, '', 'Error al crear liquidación');
    }
    $stmt->close();
}

function actualizarLiquidacion($conn, $data) {
    if (!isset($data['id'])) {
        sendResponse(false, null, '', 'ID requerido');
        return;
    }
    // Datos calculados
    $sueldo_base = floatval($data['sueldo_base']);
    $bonos = floatval($data['bonos'] ?? 0);
    $horas_extra = intval($data['horas_extra'] ?? 0);
    $otros_descuentos = floatval($data['otros_descuentos'] ?? 0);
    $totalHaberes = $sueldo_base + $bonos + ($horas_extra * 10000);
    $afp = round($totalHaberes * 0.1275);
    $salud = round($totalHaberes * 0.07);
    $totalDescuentos = $afp + $salud + $otros_descuentos;
    $liquidoPagar = $totalHaberes - $totalDescuentos;
    $fecha_pago = $data['fecha_pago'];
    $observaciones = $data['observaciones'] ?? null;
    $id = intval($data['id']);

    $stmt = $conn->prepare("UPDATE liquidaciones SET 
        sueldo_base = ?, bonos = ?, horas_extra = ?, total_haberes = ?, afp = ?, salud = ?, otros_descuentos = ?, total_descuentos = ?, liquido_pagar = ?, fecha_pago = ?, observaciones = ?, fecha_actualizacion = NOW()
        WHERE id = ?");
    $stmt->bind_param(
        "didddddddssi",
        $sueldo_base,
        $bonos,
        $horas_extra,
        $totalHaberes,
        $afp,
        $salud,
        $otros_descuentos,
        $totalDescuentos,
        $liquidoPagar,
        $fecha_pago,
        $observaciones,
        $id
    );
    if ($stmt->execute()) {
        sendResponse(true, null, 'Liquidación actualizada correctamente');
    } else {
        sendResponse(false, null, '', 'Error al actualizar liquidación');
    }
    $stmt->close();
}

function eliminarLiquidacion($conn, $id) {
    $id = intval($id);
    $stmt = $conn->prepare("DELETE FROM liquidaciones WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        sendResponse(true, null, 'Liquidación eliminada correctamente');
    } else {
        sendResponse(false, null, '', 'Error al eliminar liquidación');
    }
    $stmt->close();
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
