-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 21-12-2025 a las 22:57:26
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `nuevalasflores`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `eliminar_propietario_sp` (IN `p_rut` VARCHAR(12), IN `p_usuario` VARCHAR(100), IN `p_motivo` VARCHAR(200))   BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- pasar datos a variables de sesión que usan los triggers
  SET @usuario_responsable = p_usuario;
  SET @motivo = p_motivo;

  -- eliminar el propietario (disparará triggers y cascada)
  DELETE FROM propietarios WHERE rut = p_rut;

  -- limpiar variables de sesión (opcional)
  SET @usuario_responsable = NULL;
  SET @motivo = NULL;

  COMMIT;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `egresos`
--

CREATE TABLE `egresos` (
  `id` int(11) NOT NULL,
  `fecha_egreso` date NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `descripcion` text NOT NULL,
  `id_proveedor` int(11) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','transferencia','cheque','tarjeta') NOT NULL,
  `comprobante` varchar(100) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `egresos`
--

INSERT INTO `egresos` (`id`, `fecha_egreso`, `categoria`, `descripcion`, `id_proveedor`, `monto`, `metodo_pago`, `comprobante`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, '2025-10-05', 'Servicios Básicos', 'Servicios Básicos', 1, 25000.00, 'transferencia', 'C001', '2025-11-13 22:40:14', '2025-11-13 22:49:36'),
(2, '2025-10-15', 'Servicios', 'Mantención', 2, 15000.00, 'efectivo', 'C002', '2025-11-13 22:40:14', '2025-11-13 22:49:50'),
(3, '2025-10-20', 'Distribución', 'Gastos de transporte para entrega de productos', 3, 20000.00, 'cheque', 'C003', '2025-11-13 22:40:14', '2025-11-13 22:40:14'),
(4, '2025-10-25', 'Servicios', 'Pago por asesoría legal', 4, 10000.00, 'transferencia', 'C004', '2025-11-13 22:40:14', '2025-11-13 22:40:14'),
(5, '2025-11-01', 'Suministros', 'Compra de productos de limpieza', 1, 5000.00, 'tarjeta', 'C005', '2025-11-13 22:40:14', '2025-11-13 22:40:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleados`
--

CREATE TABLE `empleados` (
  `rut_empleado` varchar(12) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `apellido_paterno` varchar(255) NOT NULL,
  `apellido_materno` varchar(255) DEFAULT NULL,
  `cargo` varchar(255) NOT NULL,
  `tipo_contrato` varchar(255) NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `sueldo_base` decimal(10,2) NOT NULL,
  `afp` varchar(255) DEFAULT NULL,
  `salud` varchar(255) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empleados`
--

INSERT INTO `empleados` (`rut_empleado`, `nombre`, `apellido_paterno`, `apellido_materno`, `cargo`, `tipo_contrato`, `fecha_ingreso`, `sueldo_base`, `afp`, `salud`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
('11223344-5', 'Ana', 'González', 'Sánchez', 'Jardinero Senior', 'indefinido', '2022-08-15', 540000.00, 'AFP Provida', 'FONASA', 'activo', '2025-11-13 22:43:33', '2025-11-13 22:43:33'),
('12345678-9', 'Juan', 'Pérez', 'Gómez', 'Jardinero', 'indefinido', '2023-03-01', 540000.00, 'AFP Modelo', 'FONASA', 'activo', '2025-11-13 22:43:33', '2025-11-13 22:43:33'),
('98765432-1', 'Carlos', 'López', 'Martínez', 'Jardinero Junior', 'temporal', '2024-02-01', 540000.00, 'AFP Habitat', 'Isapre Vida Tres', 'activo', '2025-11-13 22:43:33', '2025-11-13 22:43:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `liquidaciones`
--

CREATE TABLE `liquidaciones` (
  `id` int(11) NOT NULL,
  `rut_empleado` varchar(20) NOT NULL,
  `mes` int(11) NOT NULL,
  `anio` int(11) NOT NULL,
  `sueldo_base` decimal(10,2) NOT NULL,
  `bonos` decimal(10,2) DEFAULT 0.00,
  `horas_extra` int(11) DEFAULT 0,
  `total_haberes` decimal(10,2) NOT NULL,
  `afp` decimal(10,2) NOT NULL,
  `salud` decimal(10,2) NOT NULL,
  `otros_descuentos` decimal(10,2) DEFAULT 0.00,
  `total_descuentos` decimal(10,2) NOT NULL,
  `liquido_pagar` decimal(10,2) NOT NULL,
  `fecha_pago` date NOT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` enum('generada','pagada','eliminada') DEFAULT 'generada',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int(11) NOT NULL,
  `rut_propietario` varchar(12) DEFAULT NULL,
  `mes` int(11) NOT NULL,
  `anio` int(11) NOT NULL,
  `fecha_pago` date DEFAULT NULL,
  `hora_pago` time DEFAULT NULL,
  `forma_pago` varchar(50) DEFAULT NULL,
  `monto_base` decimal(10,2) NOT NULL DEFAULT 35000.00,
  `interes_mora` decimal(10,2) DEFAULT 0.00,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `recargo` decimal(10,2) DEFAULT 0.00,
  `total_pagado` decimal(10,2) NOT NULL,
  `num_comprobante` varchar(50) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `rut_propietario`, `mes`, `anio`, `fecha_pago`, `hora_pago`, `forma_pago`, `monto_base`, `interes_mora`, `descuento`, `recargo`, `total_pagado`, `num_comprobante`, `observaciones`, `fecha_creacion`) VALUES
(1, '12345678-9', 1, 2025, '2025-01-15', '10:30:00', 'transferencia', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP001', 'Pago correspondiente al mes de enero', '2025-11-13 22:33:56'),
(2, '23456789-0', 2, 2025, '2025-02-10', '09:00:00', 'efectivo', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP002', 'Pago correspondiente al mes de febrero', '2025-11-13 22:33:56'),
(3, '34567890-1', 3, 2025, '2025-03-05', '14:15:00', 'cheque', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP003', 'Pago correspondiente al mes de marzo', '2025-11-13 22:33:56'),
(4, '45678901-2', 4, 2025, '2025-04-02', '16:00:00', 'transferencia', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP004', 'Pago correspondiente al mes de abril', '2025-11-13 22:33:56'),
(5, '56789012-3', 5, 2025, '2025-05-10', '12:45:00', 'tarjeta', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP005', 'Pago correspondiente al mes de mayo', '2025-11-13 22:33:56'),
(6, '67890123-4', 6, 2025, '2025-06-15', '11:00:00', 'efectivo', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP006', 'Pago correspondiente al mes de junio', '2025-11-13 22:33:56'),
(7, '78901234-5', 7, 2025, '2025-07-01', '10:00:00', 'transferencia', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP007', 'Pago correspondiente al mes de julio', '2025-11-13 22:33:56'),
(8, '89012345-6', 8, 2025, '2025-08-10', '13:30:00', 'cheque', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP008', 'Pago correspondiente al mes de agosto', '2025-11-13 22:33:56'),
(9, '90123456-7', 9, 2025, '2025-09-05', '15:30:00', 'efectivo', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP009', 'Pago correspondiente al mes de septiembre', '2025-11-13 22:33:56'),
(10, '01234567-8', 10, 2025, '2025-10-15', '17:00:00', 'tarjeta', 35000.00, 0.00, 0.00, 0.00, 35000.00, 'COMP010', 'Pago correspondiente al mes de octubre', '2025-11-13 22:33:56');

--
-- Disparadores `pagos`
--
DELIMITER $$
CREATE TRIGGER `trg_pagos_before_delete` BEFORE DELETE ON `pagos` FOR EACH ROW BEGIN
  INSERT INTO pagos_historial
    (id, rut_propietario, mes, anio, fecha_pago, hora_pago, forma_pago,
     monto_base, interes_mora, descuento, recargo, total_pagado, num_comprobante,
     observaciones, fecha_creacion, fecha_backup, motivo, usuario_responsable)
  VALUES
    (OLD.id, OLD.rut_propietario, OLD.mes, OLD.anio, OLD.fecha_pago, OLD.hora_pago, OLD.forma_pago,
     OLD.monto_base, OLD.interes_mora, OLD.descuento, OLD.recargo, OLD.total_pagado, OLD.num_comprobante,
     OLD.observaciones, OLD.fecha_creacion, NOW(), IFNULL(@motivo,''), IFNULL(@usuario_responsable,''));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos_historial`
--

CREATE TABLE `pagos_historial` (
  `id` int(11) NOT NULL,
  `rut_propietario` varchar(12) DEFAULT NULL,
  `mes` int(11) DEFAULT NULL,
  `anio` int(11) DEFAULT NULL,
  `fecha_pago` date DEFAULT NULL,
  `hora_pago` time DEFAULT NULL,
  `forma_pago` varchar(50) DEFAULT NULL,
  `monto_base` decimal(10,2) DEFAULT NULL,
  `interes_mora` decimal(10,2) DEFAULT NULL,
  `descuento` decimal(10,2) DEFAULT NULL,
  `recargo` decimal(10,2) DEFAULT NULL,
  `total_pagado` decimal(10,2) DEFAULT NULL,
  `num_comprobante` varchar(50) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT NULL,
  `fecha_backup` datetime NOT NULL,
  `motivo` varchar(200) DEFAULT NULL,
  `usuario_responsable` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `propietarios`
--

CREATE TABLE `propietarios` (
  `rut` varchar(12) NOT NULL,
  `num_casa` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `apellido_paterno` varchar(255) NOT NULL,
  `apellido_materno` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefono_1` varchar(15) DEFAULT NULL,
  `telefono_2` varchar(15) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `id_propietario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `propietarios`
--

INSERT INTO `propietarios` (`rut`, `num_casa`, `nombre`, `apellido_paterno`, `apellido_materno`, `email`, `telefono_1`, `telefono_2`, `estado`, `fecha_creacion`, `fecha_actualizacion`, `id_propietario`) VALUES
('01234567-8', '10', 'Isabel', 'Cameron', 'Mendoza', 'isabel.cameron@mail.com', '012345678', '098765432', 'inactivo', '2025-11-13 22:29:19', '2025-11-19 22:08:21', 1),
('123456-7', '15', 'pepepe', 'Vásquez', 'juli', 'pepe@pee.cl', '+56945454545', '+56945454545', 'inactivo', '2025-11-24 19:04:16', '2025-11-24 19:05:14', 2),
('12345678-9', '1', 'Juan', 'Pérez', 'González', 'juan.perez@mail.com', '123456789', '987654321', 'inactivo', '2025-11-13 22:29:19', '2025-11-19 21:09:38', 3),
('23456789-0', '44', 'alejandro', 'gall', 'barr', 'gall@gall.cl', '4444', '44', 'activo', '2025-11-13 22:29:19', '2025-12-08 23:27:10', 4),
('34567890-1', '3', 'Carlos', 'Gómez', 'Martínez', 'carlos.gomez@mail.com', '345678901', '765432109', 'inactivo', '2025-11-13 22:29:19', '2025-11-13 22:29:19', 5),
('45678901-2', '4', 'Ana', 'Rodríguez', 'Fernández', 'ana.rodriguez@mail.com', '456789012', '654321098', 'activo', '2025-11-13 22:29:19', '2025-11-13 22:29:19', 6),
('56789012-3', '5', 'Luis', 'Morales', 'Díaz', 'luis.morales@mail.com', '567890123', '543210987', 'inactivo', '2025-11-13 22:29:19', '2025-11-19 22:08:48', 7),
('67890123-4', '6', 'Elena', 'Pérez', 'López', 'elena.perez@mail.com', '678901234', '432109876', 'inactivo', '2025-11-13 22:29:19', '2025-11-13 22:29:19', 8),
('78901234-5', '7', 'José', 'Gutiérrez', 'Hernández', 'jose.gutierrez@mail.com', '789012345', '321098765', 'activo', '2025-11-13 22:29:19', '2025-11-13 22:29:19', 9),
('89012345-6', '9', 'Lucía', 'Vásquez', 'Ramírez', 'lucia.vasquez@mail.com', '890123456', '210987654', 'inactivo', '2025-11-13 22:29:19', '2025-11-24 19:02:20', 10),
('90123456-7', '9', 'Pedro', 'Ruiz', 'Jiménez', 'pedro.ruiz@mail.com', '901234567', '109876543', 'inactivo', '2025-11-13 22:29:19', '2025-11-13 22:29:19', 11);

--
-- Disparadores `propietarios`
--
DELIMITER $$
CREATE TRIGGER `trg_propietarios_before_delete` BEFORE DELETE ON `propietarios` FOR EACH ROW BEGIN
  INSERT INTO propietarios_historial
    (rut, num_casa, nombre, apellido_paterno, apellido_materno, email,
     telefono_1, telefono_2, estado, fecha_creacion, fecha_actualizacion,
     fecha_backup, motivo, usuario_responsable)
  VALUES
    (OLD.rut, OLD.num_casa, OLD.nombre, OLD.apellido_paterno, OLD.apellido_materno, OLD.email,
     OLD.telefono_1, OLD.telefono_2, OLD.estado, OLD.fecha_creacion, OLD.fecha_actualizacion,
     NOW(), IFNULL(@motivo,''), IFNULL(@usuario_responsable,''));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `propietarios_historial`
--

CREATE TABLE `propietarios_historial` (
  `id` int(10) UNSIGNED NOT NULL,
  `rut` varchar(12) NOT NULL,
  `num_casa` varchar(50) DEFAULT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `apellido_paterno` varchar(255) DEFAULT NULL,
  `apellido_materno` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefono_1` varchar(15) DEFAULT NULL,
  `telefono_2` varchar(15) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT NULL,
  `fecha_eliminacion` datetime NOT NULL,
  `fecha_backup` datetime NOT NULL,
  `motivo` varchar(200) DEFAULT NULL,
  `usuario_responsable` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `propietarios_historial`
--

INSERT INTO `propietarios_historial` (`id`, `rut`, `num_casa`, `nombre`, `apellido_paterno`, `apellido_materno`, `email`, `telefono_1`, `telefono_2`, `estado`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`, `fecha_backup`, `motivo`, `usuario_responsable`) VALUES
(1, '23456789-0', '2', 'María', 'López', 'Sánchez', 'maria.lopez@mail.com', '234567890', '876543210', 'activo', NULL, NULL, '2025-12-03 17:21:19', '0000-00-00 00:00:00', NULL, NULL),
(2, '45678901-2', '4', 'Ana', 'Rodríguez', 'Fernández', 'ana.rodriguez@mail.com', '456789012', '654321098', 'activo', NULL, NULL, '2025-12-03 17:34:31', '0000-00-00 00:00:00', NULL, NULL),
(3, '45678901-2', '4', 'Ana', 'Rodríguez', 'Fernández', 'ana.rodriguez@mail.com', '456789012', '654321098', 'activo', NULL, NULL, '2025-12-03 18:18:08', '0000-00-00 00:00:00', NULL, NULL),
(4, '78901234-5', '7', 'José', 'Gutiérrez', 'Hernández', 'jose.gutierrez@mail.com', '789012345', '321098765', 'activo', NULL, NULL, '2025-12-03 18:20:38', '0000-00-00 00:00:00', NULL, NULL),
(5, '45678901-2', '4', 'Ana', 'Rodríguez', 'Fernández', 'ana.rodriguez@mail.com', '456789012', '654321098', 'activo', NULL, NULL, '2025-12-03 18:35:31', '0000-00-00 00:00:00', NULL, NULL),
(6, '45678901-2', '4', 'Ana', 'Rodríguez', 'Fernández', 'ana.rodriguez@mail.com', '456789012', '654321098', 'activo', NULL, NULL, '2025-12-03 18:40:28', '0000-00-00 00:00:00', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `contacto` varchar(255) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id`, `nombre`, `contacto`, `telefono`, `email`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Proveeduria González', 'Carlos González', '987654321', 'carlos.gonzalez@proveeduria.com', 'activo', '2025-11-13 22:38:45', '2025-11-13 22:38:45'),
(2, 'Suministros López', 'Ana López', '976543210', 'ana.lopez@suministros.com', 'activo', '2025-11-13 22:38:45', '2025-11-13 22:38:45'),
(3, 'Servicios Pérez', 'Luis Pérez', '965432109', 'luis.perez@serviciosperez.com', 'activo', '2025-11-13 22:38:45', '2025-11-13 22:38:45'),
(4, 'Distribuciones Bravo', 'Jorge Bravo', '954321098', 'jorge.bravo@distribuciones.com', 'inactivo', '2025-11-13 22:38:45', '2025-11-13 22:38:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes`
--

CREATE TABLE `reportes` (
  `id` int(11) NOT NULL,
  `tipo_reporte` enum('resumen','estado_pagos','egresos_categoria','ingresos','egresos','morosidad','comparativo') NOT NULL,
  `anio` int(11) NOT NULL,
  `mes` int(11) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `total_ingresos` decimal(10,2) DEFAULT 0.00,
  `total_egresos` decimal(10,2) DEFAULT 0.00,
  `saldo` decimal(10,2) DEFAULT 0.00,
  `total_pagos` int(11) DEFAULT 0,
  `total_gastos` int(11) DEFAULT 0,
  `morosidad_total` decimal(10,2) DEFAULT 0.00,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `egresos`
--
ALTER TABLE `egresos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_proveedor` (`id_proveedor`);

--
-- Indices de la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`rut_empleado`);

--
-- Indices de la tabla `liquidaciones`
--
ALTER TABLE `liquidaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rut_empleado` (`rut_empleado`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pagos_ibfk_1` (`rut_propietario`);

--
-- Indices de la tabla `pagos_historial`
--
ALTER TABLE `pagos_historial`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `propietarios`
--
ALTER TABLE `propietarios`
  ADD PRIMARY KEY (`rut`),
  ADD UNIQUE KEY `id_propietario` (`id_propietario`);

--
-- Indices de la tabla `propietarios_historial`
--
ALTER TABLE `propietarios_historial`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mes_anio` (`mes`,`anio`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `egresos`
--
ALTER TABLE `egresos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `liquidaciones`
--
ALTER TABLE `liquidaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `pagos_historial`
--
ALTER TABLE `pagos_historial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `propietarios`
--
ALTER TABLE `propietarios`
  MODIFY `id_propietario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `propietarios_historial`
--
ALTER TABLE `propietarios_historial`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `reportes`
--
ALTER TABLE `reportes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `egresos`
--
ALTER TABLE `egresos`
  ADD CONSTRAINT `egresos_ibfk_1` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id`);

--
-- Filtros para la tabla `liquidaciones`
--
ALTER TABLE `liquidaciones`
  ADD CONSTRAINT `liquidaciones_ibfk_1` FOREIGN KEY (`rut_empleado`) REFERENCES `empleados` (`rut_empleado`);

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`rut_propietario`) REFERENCES `propietarios` (`rut`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
