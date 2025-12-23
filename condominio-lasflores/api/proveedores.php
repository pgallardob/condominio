<?php
// api/proveedores.php
require_once 'db.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch($method) {
        case 'GET':
            if ($action == 'listar') {
                listarProveedores($conn);
            } elseif ($action == 'obtener' && isset($_GET['id'])) {
                obtenerProveedor($conn, $_GET['id']);
            } else {
                sendResponse(false, null, '', 'Acción no válida');
            }
            break;
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true) ?? [];
            if ($action == 'crear') {
                crearProveedor($conn, $data);
            } elseif ($action == 'actualizar') {
                actualizarProveedor($conn, $data);
            } else {
                sendResponse(false, null, '', 'Acción no válida');
            }
            break;
        case 'DELETE':
            if (isset($_GET['id'])) {
                eliminarProveedor($conn, $_GET['id']);
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

function listarProveedores($conn) {
    $query = "SELECT * FROM proveedores WHERE estado != 'eliminado' ORDER BY nombre";
    $result = $conn->query($query);
    $proveedores = [];
    while ($row = $result->fetch_assoc()) {
        $proveedores[] = $row;
    }
    sendResponse(true, $proveedores, 'Proveedores obtenidos correctamente');
}

function obtenerProveedor($conn, $id) {
    $query = "SELECT * FROM proveedores WHERE id = ? AND estado != 'eliminado'";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $proveedor = $result->fetch_assoc();
        sendResponse(true, $proveedor, 'Proveedor obtenido correctamente');
    } else {
        sendResponse(false, null, '', 'Proveedor no encontrado');
    }
    $stmt->close();
}

function crearProveedor($conn, $data) {
    $required = ['rut', 'nombre', 'categoria', 'telefono'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendResponse(false, null, '', "Campo requerido: $field");
            return;
        }
    }
    // Verificar si el RUT ya existe
    $checkQuery = "SELECT id FROM proveedores WHERE rut = ?";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bind_param("s", $data['rut']);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        sendResponse(false, null, '', 'El RUT ya está registrado');
        $stmt->close();
        return;
    }
    $stmt->close();

    $query = "INSERT INTO proveedores 
        (rut, nombre, categoria, giro, telefono, email, direccion, nombre_contacto, telefono_contacto, banco, numero_cuenta, observaciones, estado, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', NOW())";
    $stmt = $conn->prepare($query);
    $stmt->bind_param(
        "ssssssssssss",
        $data['rut'],
        $data['nombre'],
        $data['categoria'],
        $data['giro'] ?? null,
        $data['telefono'],
        $data['email'] ?? null,
        $data['direccion'] ?? null,
        $data['nombre_contacto'] ?? null,
        $data['telefono_contacto'] ?? null,
        $data['banco'] ?? null,
        $data['numero_cuenta'] ?? null,
        $data['observaciones'] ?? null
    );
    if ($stmt->execute()) {
        sendResponse(true, ['id' => $conn->insert_id], 'Proveedor creado correctamente');
    } else {
        sendResponse(false, null, '', 'Error al crear proveedor');
    }
    $stmt->close();
}

function actualizarProveedor($conn, $data) {
    if (!isset($data['id'])) {
        sendResponse(false, null, '', 'ID requerido');
        return;
    }
    $query = "UPDATE proveedores SET 
        rut = ?, nombre = ?, categoria = ?, giro = ?, telefono = ?, email = ?, direccion = ?, nombre_contacto = ?, telefono_contacto = ?, banco = ?, numero_cuenta = ?, observaciones = ?, estado = ?, fecha_actualizacion = NOW()
        WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param(
        "sssssssssssssi",
        $data['rut'],
        $data['nombre'],
        $data['categoria'],
        $data['giro'] ?? null,
        $data['telefono'],
        $data['email'] ?? null,
        $data['direccion'] ?? null,
        $data['nombre_contacto'] ?? null,
        $data['telefono_contacto'] ?? null,
        $data['banco'] ?? null,
        $data['numero_cuenta'] ?? null,
        $data['observaciones'] ?? null,
        $data['estado'],
        $data['id']
    );
    if ($stmt->execute()) {
        sendResponse(true, null, 'Proveedor actualizado correctamente');
    } else {
        sendResponse(false, null, '', 'Error al actualizar proveedor');
    }
    $stmt->close();
}

function eliminarProveedor($conn, $id) {
    $query = "UPDATE proveedores SET estado = 'INACTIVO', fecha_actualizacion = NOW() WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        sendResponse(true, null, 'Proveedor eliminado correctamente');
    } else {
        sendResponse(false, null, '', 'Error al eliminar proveedor');
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
