<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

// Controllo generico sull'autenticazione
if (!isset($_SESSION['loggedin'])) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// ==============================================================================
// 1. GET: Leggi configurazioni (Solo Gestore)
// ==============================================================================
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

// ==============================================================================
// 2. POST: Aggiorna Configurazione Globale (Solo Gestore)
// ==============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_config') {
    if ($_SESSION['ruolo'] !== 'gestore') {
        echo json_encode(['success' => false, 'message' => 'Accesso negato']);
        exit;
    }

    // Validazione e default
    $manutenzione = (isset($input['manutenzione_mode']) && $input['manutenzione_mode']) ? '1' : '0';
    $apertura = isset($input['ora_apertura']) ? trim($input['ora_apertura']) : '08:00';
    $chiusura = isset($input['ora_chiusura']) ? trim($input['ora_chiusura']) : '19:00';
    $anticipo = isset($input['max_giorni_anticipo']) ? strval(intval($input['max_giorni_anticipo'])) : '30';

    // Mappatura dei valori per l'aggiornamento iterativo
    $configs = [
        'manutenzione_mode' => $manutenzione,
        'ora_apertura' => $apertura,
        'ora_chiusura' => $chiusura,
        'max_giorni_anticipo' => $anticipo
    ];

    // Prepared Statement generico per l'UPDATE
    $stmt = $conn->prepare("UPDATE configurazione SET valore = ? WHERE chiave = ?");
    
    // Utilizziamo una transazione per assicurare che o tutto si salva, o nulla
    $conn->begin_transaction();
    $success = true;

    foreach ($configs as $chiave => $valore) {
        $stmt->bind_param("ss", $valore, $chiave);
        if (!$stmt->execute()) {
            $success = false;
            break;
        }
    }

    if ($success) {
        $conn->commit();
        echo json_encode(['success' => true]);
    } else {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Errore aggiornamento configurazione: ' . $stmt->error]);
    }
    
    $stmt->close();
    exit;
}

// ==============================================================================
// 3. POST: Cambia Password (Per tutti i ruoli)
// ==============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'change_password') {
    $uid = $_SESSION['id_utente']; 
    
    // Controllo che i dati siano stati effettivamente inviati
    if (!isset($input['old_password']) || !isset($input['new_password'])) {
        echo json_encode(['success' => false, 'message' => 'Dati mancanti. Assicurati di compilare entrambi i campi.']);
        exit;
    }

    $old_pass = $input['old_password'];
    $new_pass = $input['new_password'];

    // Regex Validazione Nuova Password (min 8, 1 maiusc, 1 minusc, 1 num, 1 spec)
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/', $new_pass)) {
        echo json_encode(['success' => false, 'message' => 'La nuova password non rispetta i requisiti minimi di sicurezza.']);
        exit;
    }

    // Estrai vecchia password dal DB tramite ID sessione
    $stmt = $conn->prepare("SELECT Password FROM utente WHERE ID_Utente = ?");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if ($res->num_rows === 1) {
        $row = $res->fetch_assoc();
        
        // Confronto in chiaro senza hash (come da requisiti del progetto Z-Volta)
        if ($old_pass === $row['Password']) {
            
            // Aggiorna con la nuova password in chiaro
            $update = $conn->prepare("UPDATE utente SET Password = ? WHERE ID_Utente = ?");
            $update->bind_param("si", $new_pass, $uid);
            
            if ($update->execute()) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Errore aggiornamento DB.']);
            }
            $update->close();
            
        } else {
            echo json_encode(['success' => false, 'message' => 'La password attuale non è corretta.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Utente non trovato o sessione non valida.']);
    }
    
    $stmt->close();
    exit;
}
?>