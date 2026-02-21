<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['loggedin'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non autorizzato.']);
    exit;
}

// Estraiamo tutti gli asset attivi con le loro coordinate usando query strutturate
$sql = "SELECT ID_Asset, Codice_Univoco, Tipologia, Descrizione, ID_Mappa, Coordinate_X, Coordinate_Y 
        FROM asset 
        WHERE Stato_Fisico = 'Attivo'";

$res = $conn->query($sql);

if ($res) {
    $assets = [];
    while ($row = $res->fetch_assoc()) {
        $assets[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $assets]);
} else {
    // Gestione rigorosa in caso di fallimento query
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore nel recupero degli asset dal database.']);
}

$conn->close();
exit;
?>