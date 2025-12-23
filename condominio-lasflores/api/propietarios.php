<?php
require_once 'db.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    if ($method === 'GET') {
        if ($action === 'listar') listarPropietarios($conn);
        if ($action === 'obtener' && isset($_GET['id_propietario'])) obtenerPropietario($conn, $_GET['id_propietario']);
        sendResponse(false, null, "Acción GET no válida");
    } elseif ($method === 'POST') {
        if ($action === 'crear') crearPropietario($conn, $input);
        if ($action === 'actualizar') actualizarPropietario($conn, $input);
        if ($action === 'eliminar') eliminarPropietario($conn, $input);
        sendResponse(false, null, "Acción POST no válida");
    }
} catch (Exception $e) {
    sendResponse(false, null, "Error: " . $e->getMessage());
}

function listarPropietarios($conn) {
    $res = $conn->query("SELECT * FROM propietarios ORDER BY num_casa");
    $data = [];
    if ($res) while ($row = $res->fetch_assoc()) $data[] = $row;
    sendResponse(true, $data);
}

function obtenerPropietario($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM propietarios WHERE id_propietario = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) sendResponse(false, null, "Propietario no encontrado");
    sendResponse(true, $res->fetch_assoc());
}

function crearPropietario($conn, $d) {
    $required = ['rut','num_casa','nombre','apellido_paterno'];
    foreach ($required as $f) if (empty($d[$f])) sendResponse(false,null,"Falta campo requerido: $f");

    // Validar duplicidad de casa
    $chk = $conn->prepare("SELECT rut FROM propietarios WHERE num_casa = ?");
    $chk->bind_param("s",$d['num_casa']);
    $chk->execute();
    if ($chk->get_result()->num_rows > 0) sendResponse(false,null,"La casa N° {$d['num_casa']} ya está asignada");
    $chk->close();

    $stmt = $conn->prepare("INSERT INTO propietarios
        (rut, num_casa, nombre, apellido_paterno, apellido_materno, email, telefono_1, telefono_2, estado, fecha_creacion)
        VALUES (?,?,?,?,?,?,?,?,?,NOW())");
    $stmt->bind_param("sssssssss",
        $d['rut'],$d['num_casa'],$d['nombre'],$d['apellido_paterno'],
        $d['apellido_materno'] ?? null,$d['email'] ?? null,
        $d['telefono_1'] ?? null,$d['telefono_2'] ?? null,
        $d['estado'] ?? 'activo'
    );
    if ($stmt->execute()) sendResponse(true,null,"Propietario creado");
    else sendResponse(false,null,"Error al crear: ".$stmt->error);
}

function actualizarPropietario($conn, $d) {
    if (empty($d['id_propietario'])) sendResponse(false,null,"Falta id_propietario");

    // Validar duplicidad de casa
    $chk = $conn->prepare("SELECT id_propietario FROM propietarios WHERE num_casa = ? AND id_propietario != ?");
    $chk->bind_param("si",$d['num_casa'],$d['id_propietario']);
    $chk->execute();
    if ($chk->get_result()->num_rows > 0) sendResponse(false,null,"La casa N° {$d['num_casa']} ya está asignada");
    $chk->close();

    $stmt = $conn->prepare("UPDATE propietarios SET
        rut=?, num_casa=?, nombre=?, apellido_paterno=?, apellido_materno=?,
        email=?, telefono_1=?, telefono_2=?, estado=?, fecha_actualizacion=NOW()
        WHERE id_propietario=?");
    $stmt->bind_param("sssssssssi",
        $d['rut'],$d['num_casa'],$d['nombre'],$d['apellido_paterno'],
        $d['apellido_materno'] ?? null,$d['email'] ?? null,
        $d['telefono_1'] ?? null,$d['telefono_2'] ?? null,
        $d['estado'] ?? 'activo',$d['id_propietario']
    );
    if ($stmt->execute()) sendResponse(true,null,"Actualizado");
    else sendResponse(false,null,"Error al actualizar: ".$stmt->error);
}

function eliminarPropietario($conn, $d) {
    if (empty($d['id_propietario'])) sendResponse(false,null,"Falta id_propietario");

    // Obtener rut para triggers / historial
    $stmt = $conn->prepare("SELECT rut FROM propietarios WHERE id_propietario=?");
    $stmt->bind_param("i",$d['id_propietario']);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows===0) sendResponse(false,null,"Propietario no encontrado");
    $rut = $res->fetch_assoc()['rut'];
    $stmt->close();

    // Variables de sesión MySQL para triggers
    if (!empty($d['motivo'])) $conn->query("SET @motivo = '{$conn->real_escape_string($d['motivo'])}'");
    else $conn->query("SET @motivo = NULL");
    if (!empty($d['usuario_responsable'])) $conn->query("SET @usuario_responsable = '{$conn->real_escape_string($d['usuario_responsable'])}'");
    else $conn->query("SET @usuario_responsable = NULL");

    $stmt = $conn->prepare("DELETE FROM propietarios WHERE id_propietario=?");
    $stmt->bind_param("i",$d['id_propietario']);
    if ($stmt->execute()) sendResponse(true,null,"Eliminado (historial generado por triggers)");
    else sendResponse(false,null,"Error al eliminar: ".$stmt->error);
}

function sendResponse($success,$data=null,$message='') {
    echo json_encode(["success"=>$success,"data"=>$data,"message"=>$message]);
    exit;
}
?>
