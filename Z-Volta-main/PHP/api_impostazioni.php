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

// 1. GET CONFIG DI SISTEMA (Solo Gestore)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_config') {
    if ($_SESSION['ruolo'] !== 'gestore') {
        echo json_encode(['success' => false, 'message' => 'Accesso negato']);
        exit;
    }
    $sql = "SELECT chiave, valore FROM configurazione";
    $result = $conn->query($sql);
    $config = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $config[$row['chiave']] = $row['valore'];
        }
    }
    echo json_encode($config);
    exit;
}

// 2. GET PROFILO UTENTE
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_profile') {
    $uid = $_SESSION['id_utente'];
    $stmt = $conn->prepare("SELECT Nome, Cognome, Username FROM utente WHERE ID_Utente = ?");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Utente non trovato']);
    }
    exit;
}

// 3. AGGIORNA PROFILO E PASSWORD
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_profile') {
    $uid = $_SESSION['id_utente'];
    $nome = trim($input['nome']);
    $cognome = trim($input['cognome']);
    $username = trim($input['username']);
    
    $new_pass = isset($input['new_password']) ? $input['new_password'] : '';
    
    // Aggiorna Dati Base
    $stmt = $conn->prepare("UPDATE utente SET Nome = ?, Cognome = ?, Username = ? WHERE ID_Utente = ?");
    $stmt->bind_param("sssi", $nome, $cognome, $username, $uid);
    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'message' => 'Errore aggiornamento dati base.']);
        exit;
    }
    
    // Aggiorna sessione corrente per riflettere le modifiche nell'interfaccia
    $_SESSION['nome'] = $nome;
    $_SESSION['cognome'] = $cognome;

    // Se l'utente ha inserito una nuova password, validala e aggiornala
    if (!empty($new_pass)) {
        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/', $new_pass)) {
            echo json_encode(['success' => false, 'message' => 'Dati aggiornati, ma la nuova password non rispetta i requisiti (Min 8 car, 1 maiusc, 1 minusc, 1 num, 1 spec).']);
            exit;
        }
        $update_pw = $conn->prepare("UPDATE utente SET Password = ? WHERE ID_Utente = ?");
        $update_pw->bind_param("si", $new_pass, $uid);
        $update_pw->execute();
    }

    echo json_encode(['success' => true, 'message' => 'Profilo aggiornato con successo!']);
    exit;
}

// 4. AGGIORNA CONFIGURAZIONE (Solo Gestore)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_config') {
    if ($_SESSION['ruolo'] !== 'gestore') {
        echo json_encode(['success' => false, 'message' => 'Accesso negato']);
        exit;
    }

    $manutenzione = (isset($input['manutenzione_mode']) && $input['manutenzione_mode']) ? '1' : '0';
    $apertura = isset($input['ora_apertura']) ? trim($input['ora_apertura']) : '08:00';
    $chiusura = isset($input['ora_chiusura']) ? trim($input['ora_chiusura']) : '19:00';
    $anticipo = isset($input['max_giorni_anticipo']) ? strval(intval($input['max_giorni_anticipo'])) : '30';

    $configs = [
        'manutenzione_mode' => $manutenzione,
        'ora_apertura' => $apertura,
        'ora_chiusura' => $chiusura,
        'max_giorni_anticipo' => $anticipo
    ];

    $stmt = $conn->prepare("UPDATE configurazione SET valore = ? WHERE chiave = ?");
    $conn->begin_transaction();
    $success = true;

    foreach ($configs as $chiave => $valore) {
        $stmt->bind_param("ss", $valore, $chiave);
        if (!$stmt->execute()) {
            $success = false; break;
        }
    }

    if ($success) {
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Impostazioni di sistema salvate.']);
    } else {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Errore aggiornamento configurazione.']);
    }
    exit;
}
?>