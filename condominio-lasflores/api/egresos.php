<?php
// Archivo: api/egresos.php
require_once '../CONEXION/db.php'; // Ajusta según tu estructura

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action == 'listar') {
                $categoria = $_GET['categoria'] ?? '';
                $mes = $_GET['mes'] ?? '';
                $anio = $_GET['anio'] ?? '';
                listarEgresos($conn, $categoria, $mes, $anio);
            } elseif ($action == 'obtener' && isset($_GET['id'])) {
                obtenerEgreso($conn, $_GET['id']);
            } else {
                sendResponse(false, null, '', 'Acción GET no válida');
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            if (!$data) sendResponse(false, null, '', 'No se recibieron datos');
            
            if ($action == 'crear') crearEgreso($conn, $data);
            elseif ($action == 'actualizar') actualizarEgreso($conn, $data);
            else sendResponse(false, null, '', 'Acción POST no válida');
            break;

        case 'DELETE':
            if (isset($_GET['id'])) eliminarEgreso($conn, $_GET['id']);
            else sendResponse(false, null, '', 'ID requerido para eliminar');
            break;

        default:
            sendResponse(false, null, '', 'Método no permitido');
    }
} catch (Exception $e) {
    sendResponse(false, null, '', 'Error del servidor: ' . $e->getMessage());
}

/* ================== FUNCIONES ================== */

function listarEgresos($conn, $categoria = '', $mes = '', $anio = '') {
    $query = "SELECT e.*, p.nombre as nombre_proveedor 
              FROM egresos e 
              LEFT JOIN proveedores p ON e.id_proveedor = p.id 
              WHERE 1=1";
    $params = []; $types = '';

    if ($categoria) {
        $query .= " AND e.categoria = ?";
        $params[] = strtoupper($categoria);
        $types .= 's';
    }
    if ($mes && $anio) {
        $query .= " AND MONTH(e.fecha_egreso) = ? AND YEAR(e.fecha_egreso) = ?";
        $params[] = intval($mes);
        $params[] = intval($anio);
        $types .= 'ii';
    }
    $query .= " ORDER BY e.fecha_egreso DESC, e.id DESC";

    if ($params) {
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($query);
    }

    $egresos = [];
    while ($row = $result->fetch_assoc()) $egresos[] = $row;

    sendResponse(true, $egresos, count($egresos) . ' egresos obtenidos correctamente');
}

function obtenerEgreso($conn, $id) {
    $stmt = $conn->prepare("SELECT e.*, p.nombre as nombre_proveedor 
                            FROM egresos e 
                            LEFT JOIN proveedores p ON e.id_proveedor = p.id 
                            WHERE e.id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows) sendResponse(true, $res->fetch_assoc(), 'Egreso obtenido correctamente');
    else sendResponse(false, null, '', 'Egreso no encontrado');
}

function crearEgreso($conn, $data) {
    $required = ['fecha_egreso', 'categoria', 'descripcion', 'monto', 'metodo_pago'];
    foreach ($required as $f) if (!isset($data[$f]) || trim($data[$f]) === '') sendResponse(false, null, '', "Falta campo: $f");

    $monto = floatval($data['monto']);
    if ($monto <= 0) sendResponse(false, null, '', 'Monto inválido');

    $metodo = strtolower(trim($data['metodo_pago']));
    $categoriasValidas = ['SERVICIOS','MANTENCION','SEGURIDAD','LIMPIEZA','SUELDOS','REPARACIONES','OTROS'];
    if (!in_array(strtoupper(trim($data['categoria'])), $categoriasValidas)) sendResponse(false,null,'','Categoría inválida');

    $stmt = $conn->prepare("INSERT INTO egresos (fecha_egreso,categoria,descripcion,id_proveedor,monto,metodo_pago,comprobante,fecha_creacion)
                            VALUES (?,?,?,?,?,?,?,NOW())");
    $idProv = !empty($data['id_proveedor']) ? intval($data['id_proveedor']) : null;
    $comp = !empty($data['comprobante']) ? $data['comprobante'] : null;
    $stmt->bind_param("sssisss",$data['fecha_egreso'],strtoupper($data['categoria']),$data['descripcion'],$idProv,$monto,$metodo,$comp);
    if ($stmt->execute()) sendResponse(true,['id'=>$conn->insert_id],'Egreso creado correctamente');
    else sendResponse(false,null,'','Error al crear egreso: '.$stmt->error);
}

function actualizarEgreso($conn, $data) {
    if (!isset($data['id'])) sendResponse(false,null,'','ID requerido');
    $id = intval($data['id']);

    $stmt = $conn->prepare("UPDATE egresos SET fecha_egreso=?,categoria=?,descripcion=?,id_proveedor=?,monto=?,metodo_pago=?,comprobante=?,fecha_actualizacion=NOW() WHERE id=?");
    $idProv = !empty($data['id_proveedor']) ? intval($data['id_proveedor']) : null;
    $comp = !empty($data['comprobante']) ? $data['comprobante'] : null;
    $stmt->bind_param("sssisssi",$data['fecha_egreso'],strtoupper($data['categoria']),$data['descripcion'],$idProv,floatval($data['monto']),strtolower($data['metodo_pago']),$comp,$id);
    if ($stmt->execute()) sendResponse(true,null,'Egreso actualizado correctamente');
    else sendResponse(false,null,'','Error al actualizar egreso: '.$stmt->error);
}

function eliminarEgreso($conn,$id) {
    $id=intval($id);
    $stmt = $conn->prepare("DELETE FROM egresos WHERE id=?");
    $stmt->bind_param("i",$id);
    if ($stmt->execute()) sendResponse(true,null,'Egreso eliminado correctamente');
    else sendResponse(false,null,'','Error al eliminar egreso: '.$stmt->error);
}

/* ================== HELPER ================== */

function sendResponse($success,$data=null,$message='',$error='') {
    $res = ['success'=>$success,'data'=>$data,'message'=>$message];
    if($error) $res['error']=$error;
    echo json_encode($res,JSON_UNESCAPED_UNICODE);
    exit;
}
?>
