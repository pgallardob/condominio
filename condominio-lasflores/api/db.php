<?php
// Archivo: CONEXION/db.php

$host = "localhost";           // Servidor (localhost en XAMPP)
$usuario = "root";             // Usuario por defecto en XAMPP
$password = "";                // Contraseña (vacía por defecto)
$base_datos = "nuevalasflores"; // Nombre de tu base de datos

// Crear conexión
$conn = new mysqli($host, $usuario, $password, $base_datos);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Establecer codificación de caracteres
$conn->set_charset("utf8");

?>
