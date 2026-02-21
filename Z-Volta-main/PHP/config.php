<?php
$host = "localhost";
$user = "root";      // Il tuo username del database (spesso 'root' su XAMPP/MAMP)
$pass = "";          // La tua password del database (spesso vuota in locale)
$dbname = "z-volta";  // Il nome del tuo database

$conn = new mysqli($host, $user, $pass, $dbname);

// Verifica connessione
if ($conn->connect_error) {
    die("Connessione fallita: " . $conn->connect_error);
}
