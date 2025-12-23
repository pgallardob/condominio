<?php
// api/empleados.php
require_once 'db.php'; // Ajusta a 'CONEXION/db.php' si fuera necesario
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch($method) {
        case 'GET':
            if ($action == 'listar') {
                listarEmpleados($conn);
            } elseif ($action == 'liquidaciones') {
                obtenerLiquidaciones($conn);
            } else {
                sendResponse(false, null, '', 'Acción no válida');
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true) ?? [];
            if ($action == 'crear') {
                crearEmpleado($conn, $data);
            } elseif ($action == 'crear_liquidacion') {
                crearLiquidacion($conn, $data);
            } elseif ($action == 'eliminar') {
                eliminarEmpleado($conn, $data);
            } else {
                sendResponse(false, null, '', 'Acción no válida');
            }
            break;

        default:
            sendResponse(false, null, '', 'Método no permitido');
    }
} catch (Exception $e) {
    sendResponse(false, null, '', $e->getMessage());
}

function listarEmpleados($conn) {
    $query = "SELECT * FROM empleados WHERE estado != 'eliminado' ORDER BY nombre, apellido_paterno";
    $result = $conn->query($query);
    $empleados = [];
    while ($row = $result->fetch_assoc()) {
        $empleados[] = $row;
    }
    sendResponse(true, $empleados, 'Empleados obtenidos correctamente');
}

function obtenerLiquidaciones($conn) {
    $query = "
        SELECT l.*, e.nombre, e.apellido_paterno 
        FROM liquidaciones l
        INNER JOIN empleados e ON l.rut_empleado = e.rut_empleado
        ORDER BY l.anio DESC, l.mes DESC
        LIMIT 10
    ";
    $result = $conn->query($query);
    $liquidaciones = [];
    while ($row = $result->fetch_assoc()) {
        $liquidaciones[] = $row;
    }
    sendResponse(true, $liquidaciones, 'Liquidaciones obtenidas correctamente');
}

function crearEmpleado($conn, $data) {
    $required = ['rut_empleado', 'nombre', 'apellido_paterno', 'cargo', 'tipo_contrato', 'fecha_ingreso', 'sueldo_base'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendResponse(false, null, '', "Campo requerido: $field");
            return;
        }
    }
    // Verificar si el RUT ya existe
    $rut_empleado = $data['rut_empleado'];
    $checkQuery = "SELECT id FROM empleados WHERE rut_empleado = ?";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bind_param("s", $rut_empleado);
    $checkStmt->execute();
    $checkStmt->store_result();
    if ($checkStmt->num_rows > 0) {
        sendResponse(false, null, '', 'El RUT ya está registrado');
        $checkStmt->close();
        return;
    }
    $checkStmt->close();

    $stmt = $conn->prepare("INSERT INTO empleados 
        (rut_empleado, nombre, apellido_paterno, apellido_materno, cargo, tipo_contrato, fecha_ingreso, sueldo_base, afp, salud, estado, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', NOW())");
    $apellido_materno = $data['apellido_materno'] ?? null;
    $afp = $data['afp'] ?? null;
    $salud = $data['salud'] ?? null;
    $stmt->bind_param(
        "ssssssdsss",
        $data['rut_empleado'],
        $data['nombre'],
        $data['apellido_paterno'],
        $apellido_materno,
        $data['cargo'],
        $data['tipo_contrato'],
        $data['fecha_ingreso'],
        $data['sueldo_base'],
        $afp,
        $salud
    );
    if ($stmt->execute()) {
        sendResponse(true, ['id' => $conn->insert_id], 'Empleado creado correctamente');
    } else {
        sendResponse(false, null, '', 'Error al crear empleado');
    }
    $stmt->close();
}

function crearLiquidacion($conn, $data) {
    $required = ['rut_empleado', 'mes', 'anio', 'sueldo_base', 'total_haberes', 'total_descuentos', 'liquido_pagar'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendResponse(false, null, '', "Campo requerido: $field");
            return;
        }
    }
    // Verificar si ya existe liquidación para este periodo
    $rut_empleado = $data['rut_empleado'];
    $mes = $data['mes'];
    $anio = $data['anio'];
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

    $stmt = $conn->prepare("INSERT INTO liquidaciones 
        (rut_empleado, mes, anio, sueldo_base, horas_extra, bonos, total_haberes, desc_afp, desc_salud, otros_descuentos, total_descuentos, liquido_pagar, estado, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'generada', NOW())");
    $horas_extra = $data['horas_extra'] ?? 0;
    $bonos = $data['bonos'] ?? 0;
    $desc_afp = $data['desc_afp'] ?? 0;
    $desc_salud = $data['desc_salud'] ?? 0;
    $otros_descuentos = $data['otros_descuentos'] ?? 0;
    $stmt->bind_param(
        "siiididddddd",
        $data['rut_empleado'],
        $data['mes'],
        $data['anio'],
        $data['sueldo_base'],
        $horas_extra,
        $bonos,
        $data['total_haberes'],
        $desc_afp,
        $desc_salud,
        $otros_descuentos,
        $data['total_descuentos'],
        $data['liquido_pagar']
    );
    if ($stmt->execute()) {
        sendResponse(true, ['id' => $conn->insert_id], 'Liquidación creada correctamente');
    } else {
        sendResponse(false, null, '', 'Error al crear liquidación');
    }
    $stmt->close();
}

function eliminarEmpleado($conn, $data) {
    if (!isset($data['rut_empleado'])) {
        sendResponse(false, null, '', 'RUT de empleado requerido');
        return;
    }
    $stmt = $conn->prepare("UPDATE empleados SET estado = 'inactivo', fecha_actualizacion = NOW() WHERE rut_empleado = ?");
    $stmt->bind_param("s", $data['rut_empleado']);
    if ($stmt->execute()) {
        sendResponse(true, null, 'Empleado eliminado correctamente');
    } else {
        sendResponse(false, null, '', 'Error al eliminar empleado');
    }
    $stmt->close();
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

