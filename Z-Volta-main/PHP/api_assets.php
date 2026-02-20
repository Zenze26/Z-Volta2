<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['loggedin'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non autorizzato.']);
    exit;
}

// Estraiamo tutti gli asset attivi con le loro coordinate
$sql = "SELECT ID_Asset, Codice_Univoco, Tipologia, Descrizione, ID_Mappa, Coordinate_X, Coordinate_Y 
        FROM asset 
        WHERE Stato_Fisico = 'Attivo'";

$res = $conn->query($sql);
$assets = [];

if ($res) {
    while ($row = $res->fetch_assoc()) {
        $assets[] = $row;
    }
}

echo json_encode(['success' => true, 'data' => $assets]);
exit;
?>