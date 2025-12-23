<?php
// api/pagos.php
require_once 'db.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch($method) {
        case 'GET':
            if($action === 'estado_cuenta') {
                obtenerEstadoCuenta($conn);
            } elseif($action === 'ultimos' && isset($_GET['limite'])) {
                obtenerUltimosPagos($conn, $_GET['limite']);
            } elseif($action === 'calcular_mora' && isset($_GET['mes']) && isset($_GET['anio'])) {
                calcularMora($conn, $_GET['mes'], $_GET['anio']);
            } else {
                sendResponse(false, null, '', 'Acción no válida');
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true) ?? [];
            if($action === 'crear') {
                crearPago($conn, $data);
            } elseif($action === 'anular') {
                anularPago($conn, $data);
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





/* ============================================================
   ✔ FUNCIÓN ANULAR CORREGIDA
   Usa exactamente los campos de tu tabla pagos_historial
=============================================================== */
function anularPago($conn, $data){

    if(!isset($data['id_pago'])){
        sendResponse(false, null, '', 'ID de pago requerido');
        return;
    }
    if(!isset($data['motivo']) || !isset($data['usuario_responsable'])){
        sendResponse(false, null, '', 'Motivo y usuario_responsable son obligatorios');
        return;
    }

    $id       = $data['id_pago'];
    $motivo   = $data['motivo'];
    $usuario  = $data['usuario_responsable'];

    // 1) Obtener pago
    $stmt = $conn->prepare("SELECT * FROM pagos WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();

    if($res->num_rows === 0){
        sendResponse(false, null, '', 'Pago no encontrado');
        return;
    }

    $p = $res->fetch_assoc();
    $stmt->close();

    // 2) Respaldar en pagos_historial (SIN id_original)
    $stmt = $conn->prepare("
        INSERT INTO pagos_historial 
        (id, rut_propietario, mes, anio, fecha_pago, hora_pago, forma_pago,
         monto_base, interes_mora, descuento, recargo, total_pagado, num_comprobante,
         observaciones, fecha_creacion, fecha_backup, motivo, usuario_responsable)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?)
    ");

    $stmt->bind_param(
        "isiiissddddddssss",
        $p['id'],
        $p['rut_propietario'],
        $p['mes'],
        $p['anio'],
        $p['fecha_pago'],
        $p['hora_pago'],
        $p['forma_pago'],
        $p['monto_base'],
        $p['interes_mora'],
        $p['descuento'],
        $p['recargo'],
        $p['total_pagado'],
        $p['num_comprobante'],
        $p['observaciones'],
        $p['fecha_creacion'],
        $motivo,
        $usuario
    );

    if(!$stmt->execute()){
        sendResponse(false, null, '', 'Error al guardar respaldo en historial');
    }
    $stmt->close();

    // 3) Anular pago
    $stmt = $conn->prepare("UPDATE pagos SET fecha_pago=NULL, total_pagado=0 WHERE id=?");
    $stmt->bind_param("i", $id);

    if($stmt->execute()){
        sendResponse(true, null, 'Pago anulado y respaldado correctamente');
    } else {
        sendResponse(false, null, '', 'Error al anular pago');
    }
    $stmt->close();
}





/* ============================================================
   RESTO DEL CÓDIGO (SIN CAMBIOS)
=============================================================== */

function obtenerEstadoCuenta($conn) {
    $query = "
        SELECT 
            p.id AS id_pago,
            p.rut_propietario AS rut,
            prop.num_casa,
            prop.nombre,
            prop.apellido_paterno,
            p.mes,
            p.anio,
            p.monto_base,
            p.interes_mora,
            p.total_pagado,
            p.fecha_pago,
            CASE 
                WHEN p.fecha_pago IS NOT NULL THEN 'PAGADO'
                WHEN p.interes_mora > 0 THEN 'MOROSO'
                ELSE 'PENDIENTE'
            END AS estado_pago
        FROM pagos p
        INNER JOIN propietarios prop ON p.rut_propietario = prop.rut
        WHERE prop.estado = 'activo'
        ORDER BY prop.num_casa, p.anio DESC, p.mes DESC
    ";
    $result = $conn->query($query);
    $pagos = [];
    while($row = $result->fetch_assoc()) $pagos[] = $row;

    sendResponse(true, $pagos, 'Estado de cuenta obtenido correctamente');
}


function obtenerUltimosPagos($conn, $limite) {
    $limite = intval($limite);
    $query = "
        SELECT p.*, prop.num_casa, prop.nombre, prop.apellido_paterno
        FROM pagos p
        INNER JOIN propietarios prop ON p.rut_propietario = prop.rut
        WHERE p.fecha_pago IS NOT NULL
        ORDER BY p.fecha_pago DESC
        LIMIT $limite
    ";
    $result = $conn->query($query);
    $pagos = [];
    while($row = $result->fetch_assoc()) $pagos[] = $row;

    sendResponse(true, $pagos, 'Últimos pagos obtenidos correctamente');
}



function calcularMora($conn, $mes, $anio) {
    $montoBase = 35000;
    $fechaVencimiento = date('Y-m-d', strtotime("$anio-$mes-10"));

    $stmt = $conn->prepare("SELECT SUM(interes_mora) AS total_mora FROM pagos WHERE mes=? AND anio=? AND fecha_pago IS NULL");
    $stmt->bind_param("ii", $mes, $anio);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $total_mora = $result['total_mora'] ?? 0;
    $stmt->close();

    sendResponse(true, [
        'monto_base'       => $montoBase,
        'fecha_vencimiento'=> $fechaVencimiento,
        'total_mora'       => $total_mora
    ]);
}



function crearPago($conn, $data) {
    $required = ['rut_propietario','mes','anio','fecha_pago','forma_pago','total_pagado'];
    foreach($required as $field){
        if(!isset($data[$field]) || $data[$field] === ''){
            sendResponse(false, null, '', "Campo requerido: $field");
        }
    }

    $stmt = $conn->prepare("SELECT id FROM pagos WHERE rut_propietario=? AND mes=? AND anio=?");
    $stmt->bind_param("sii", $data['rut_propietario'], $data['mes'], $data['anio']);
    $stmt->execute();
    $stmt->store_result();
    if($stmt->num_rows > 0){
        sendResponse(false, null, '', 'Ya existe un pago registrado para este periodo');
    }
    $stmt->close();

    $stmt = $conn->prepare("
        INSERT INTO pagos
        (rut_propietario, mes, anio, fecha_pago, hora_pago, forma_pago, monto_base, interes_mora, descuento, recargo, total_pagado, num_comprobante, observaciones, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $hora_pago      = $data['hora_pago'] ?? date('H:i:s');
    $monto_base     = $data['monto_base'] ?? 35000;
    $interes_mora   = $data['interes_mora'] ?? 0;
    $descuento      = $data['descuento'] ?? 0;
    $recargo        = $data['recargo'] ?? 0;
    $num_comprobante= $data['num_comprobante'] ?? null;
    $observaciones  = $data['observaciones'] ?? null;

    $stmt->bind_param(
        "siissddddddss",
        $data['rut_propietario'],
        $data['mes'],
        $data['anio'],
        $data['fecha_pago'],
        $hora_pago,
        $data['forma_pago'],
        $monto_base,
        $interes_mora,
        $descuento,
        $recargo,
        $data['total_pagado'],
        $num_comprobante,
        $observaciones
    );

    if($stmt->execute()){
        sendResponse(true, ['id_pago'=>$conn->insert_id], 'Pago registrado correctamente');
    } else {
        sendResponse(false, null, '', 'Error al registrar pago');
    }
}



function sendResponse($success, $data=null, $message='', $error=''){
    echo json_encode([
        'success'=>$success,
        'data'=>$data,
        'message'=>$message,
        'error'=>$error
    ]);
    exit;
}
?>
