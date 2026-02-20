<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['loggedin'])) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. GET: Leggi configurazioni (Solo Gestore)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_config') {
    if ($_SESSION['ruolo'] !== 'gestore') exit;
    
    $sql = "SELECT * FROM configurazione";
    $result = $conn->query($sql);
    $config = [];
    while($row = $result->fetch_assoc()) {
        $config[$row['chiave']] = $row['valore'];
    }
    echo json_encode($config);
    exit;
}

// 2. POST: Aggiorna Configurazione Globale (Solo Gestore)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_config') {
    if ($_SESSION['ruolo'] !== 'gestore') {
        echo json_encode(['success' => false, 'message' => 'Accesso negato']);
        exit;
    }

    $manutenzione = isset($input['manutenzione_mode']) && $input['manutenzione_mode'] ? '1' : '0';
    $apertura = $conn->real_escape_string($input['ora_apertura']);
    $chiusura = $conn->real_escape_string($input['ora_chiusura']);
    $anticipo = intval($input['max_giorni_anticipo']);

    // Uso INSERT ... ON DUPLICATE KEY UPDATE per semplicità
    $sql = "INSERT INTO configurazione (chiave, valore) VALUES 
            ('manutenzione_mode', '$manutenzione'),
            ('ora_apertura', '$apertura'),
            ('ora_chiusura', '$chiusura'),
            ('max_giorni_anticipo', '$anticipo')
            ON DUPLICATE KEY UPDATE valore=VALUES(valore)";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => $conn->error]);
    }
    exit;
}

// 3. POST: Cambia Password (Per tutti)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'change_password') {
    $uid = $_SESSION['id_utente']; // Corretto: legge l'ID esatto dalla sessione
    $old_pass = $input['old_password'];
    $new_pass = $input['new_password'];

    // Regex Validazione Nuova Password (min 8, 1 maiusc, 1 minusc, 1 num, 1 spec)
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/', $new_pass)) {
        echo json_encode(['success' => false, 'message' => 'La nuova password non rispetta i requisiti minimi di sicurezza.']);
        exit;
    }

    // Estrai vecchia password dal DB
    $stmt = $conn->prepare("SELECT Password FROM utente WHERE ID_Utente = ?");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    // Confronto in chiaro senza hash
    if ($old_pass === $row['Password']) {
        // Aggiorna con la nuova password in chiaro
        $update = $conn->prepare("UPDATE utente SET Password = ? WHERE ID_Utente = ?");
        $update->bind_param("si", $new_pass, $uid);
        
        if ($update->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Errore aggiornamento DB']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'La password attuale non è corretta']);
    }
    exit;
}
?>