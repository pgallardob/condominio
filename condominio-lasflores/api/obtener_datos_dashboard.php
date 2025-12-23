<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php'; // Asegura que usas el archivo que define $conn

if (!$conn) {
    echo json_encode(array(
        'success' => false,
        'data' => null,
        'message' => '',
        'error' => 'Conexión a la base de datos no establecida'
    ));
    exit;
}

try {
    $mes = isset($_GET['mes']) ? intval($_GET['mes']) : date('n');
    $anio = isset($_GET['anio']) ? intval($_GET['anio']) : date('Y');
    $data = array();

    // 1. Ingresos totales
    $stmt = $conn->prepare("SELECT COALESCE(SUM(total_pagado), 0) as total FROM pagos WHERE MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ?");
    $stmt->bind_param("ii", $mes, $anio);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $data['ingresos'] = floatval($result['total']);
    $stmt->close();

    // 2. Egresos totales
    $stmt = $conn->prepare("SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE MONTH(fecha_egreso) = ? AND YEAR(fecha_egreso) = ?");
    $stmt->bind_param("ii", $mes, $anio);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $data['egresos'] = floatval($result['total']);
    $stmt->close();

    // 3. Saldo
    $data['saldo'] = $data['ingresos'] - $data['egresos'];

    // 4. Porcentaje de morosos -- CORREGIDO
    $result = $conn->query("SELECT COUNT(*) as total FROM propietarios");
    $row = $result->fetch_assoc();
    $total_propietarios = intval($row['total']);

    $stmt = $conn->prepare("SELECT COUNT(DISTINCT pr.rut) as morosos 
        FROM propietarios pr 
        LEFT JOIN pagos p ON pr.rut = p.rut_propietario 
            AND MONTH(p.fecha_pago) = ? AND YEAR(p.fecha_pago) = ? 
        WHERE p.id IS NULL");
    $stmt->bind_param("ii", $mes, $anio);
    $stmt->execute();
    $morosos = $stmt->get_result()->fetch_assoc()['morosos'];
    $stmt->close();
    $data['porcentaje_morosos'] = $total_propietarios > 0 ? round(($morosos / $total_propietarios) * 100, 2) : 0;

    // 5. Pagos recientes -- CORREGIDO
    $sql = "SELECT p.id, pr.nombre, pr.apellido_paterno, p.total_pagado as monto, p.fecha_pago as fecha
        FROM pagos p 
        JOIN propietarios pr ON p.rut_propietario = pr.rut
        ORDER BY p.fecha_pago DESC, p.hora_pago DESC
        LIMIT 5";
    $result = $conn->query($sql);
    $data['pagos_recientes'] = [];
    while ($row = $result->fetch_assoc()) {
        $data['pagos_recientes'][] = $row;
    }

    // 6. Egresos recientes
    $sql = "SELECT id, descripcion, categoria, monto, fecha_egreso as fecha 
        FROM egresos 
        ORDER BY fecha_egreso DESC 
        LIMIT 5";
    $result = $conn->query($sql);
    $data['egresos_recientes'] = [];
    while ($row = $result->fetch_assoc()) {
        $data['egresos_recientes'][] = $row;
    }

    // 7. Propietarios morosos -- CORREGIDO
    $sql = "SELECT pr.nombre, pr.apellido_paterno, pr.rut, pr.num_casa, 
        COUNT(p.id) as meses_pendientes 
        FROM propietarios pr 
        LEFT JOIN pagos p ON pr.rut = p.rut_propietario
            AND p.fecha_pago IS NULL 
        GROUP BY pr.rut, pr.nombre, pr.apellido_paterno, pr.num_casa 
        HAVING meses_pendientes > 0
        ORDER BY meses_pendientes DESC 
        LIMIT 5";
    $result = $conn->query($sql);
    $data['propietarios_morosos'] = [];
    while ($row = $result->fetch_assoc()) {
        $data['propietarios_morosos'][] = $row;
    }

    // 8. Estado de pagos
    $stmt = $conn->prepare("SELECT 
        (SELECT COUNT(*) FROM pagos WHERE MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ?) as pagados,
        (SELECT COUNT(*) FROM propietarios) as total_propietarios");
    $stmt->bind_param("ii", $mes, $anio);
    $stmt->execute();
    $pagos_result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $pagados = intval($pagos_result['pagados']);
    $total_propietarios_estado = intval($pagos_result['total_propietarios']);
    $pendientes = $total_propietarios_estado - $pagados;

    $data['estado_pagos'] = array(
        array('name' => 'Pagados', 'value' => $pagados),
        array('name' => 'Pendientes', 'value' => max(0, $pendientes)),
        array('name' => 'Morosos', 'value' => $morosos)
    );

    // 9. Egresos por categoría
    $stmt = $conn->prepare("SELECT categoria, SUM(monto) as total 
        FROM egresos 
        WHERE MONTH(fecha_egreso) = ? AND YEAR(fecha_egreso) = ? 
        GROUP BY categoria");
    $stmt->bind_param("ii", $mes, $anio);
    $stmt->execute();
    $result = $stmt->get_result();
    $egresos_categoria = [];
    while ($row = $result->fetch_assoc()) {
        $egresos_categoria[] = $row;
    }
    $stmt->close();

    $data['egresos_categoria'] = [];
    foreach($egresos_categoria as $egreso) {
        $data['egresos_categoria'][] = array(
            'name' => $egreso['categoria'],
            'value' => floatval($egreso['total'])
        );
    }

    // Éxito
    echo json_encode(array(
        'success' => true,
        'data' => $data,
        'message' => 'Datos obtenidos correctamente'
    ));
    exit;
} catch(Exception $e) {
    echo json_encode(array(
        'success' => false,
        'data' => null,
        'message' => '',
        'error' => 'Error al obtener datos: ' . $e->getMessage()
    ));
    exit;
}
?>
