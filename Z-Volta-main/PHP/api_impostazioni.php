<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['loggedin'])) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

// Lettura input JSON per le API che lo usano
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

// 2. GET PROFILO UTENTE (Con ricerca Foto Profilo)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_profile') {
    $uid = $_SESSION['id_utente'];
    $stmt = $conn->prepare("SELECT Nome, Cognome, Username FROM utente WHERE ID_Utente = ?");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if ($row = $res->fetch_assoc()) {
        // Cerca se esiste un avatar associato a questo ID
        $avatar_url = null;
        $files = glob("../assets/profiles/avatar_" . $uid . ".*");
        if ($files && count($files) > 0) {
            $avatar_url = $files[0] . "?v=" . time(); // Aggiunto time() per forzare il refresh della cache browser
        }
        $row['avatar'] = $avatar_url;
        
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Utente non trovato']);
    }
    exit;
}

// 3. AGGIORNA PROFILO, PASSWORD E FOTO (Usa $_POST e $_FILES per via del form Multipart)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_profile') {
    $uid = $_SESSION['id_utente'];
    $nome = trim($_POST['nome']);
    $cognome = trim($_POST['cognome']);
    $username = trim($_POST['username']);
    $new_pass = isset($_POST['new_password']) ? $_POST['new_password'] : '';
    
    // Aggiorna Dati Base DB
    $stmt = $conn->prepare("UPDATE utente SET Nome = ?, Cognome = ?, Username = ? WHERE ID_Utente = ?");
    $stmt->bind_param("sssi", $nome, $cognome, $username, $uid);
    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'message' => 'Errore aggiornamento dati base.']);
        exit;
    }
    
    $_SESSION['nome'] = $nome;
    $_SESSION['cognome'] = $cognome;

    // Gestione Caricamento Foto Profilo
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $dir = "../assets/profiles/";
        if (!is_dir($dir)) mkdir($dir, 0777, true); // Crea cartella se non esiste
        
        // Cancella vecchi avatar di questo utente
        $old_files = glob($dir . "avatar_" . $uid . ".*");
        foreach($old_files as $f) unlink($f);

        // Salva nuovo file
        $ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
        $allowed_ext = ['jpg', 'jpeg', 'png', 'gif'];
        
        if (in_array($ext, $allowed_ext)) {
            $filename = "avatar_" . $uid . "." . $ext;
            move_uploaded_file($_FILES['avatar']['tmp_name'], $dir . $filename);
        }
    }

    // Gestione Password
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

// 4. AGGIORNA CONFIGURAZIONE (Solo Gestore - Anticipo Rimosso)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_config') {
    if ($_SESSION['ruolo'] !== 'gestore') {
        echo json_encode(['success' => false, 'message' => 'Accesso negato']);
        exit;
    }

    $manutenzione = (isset($input['manutenzione_mode']) && $input['manutenzione_mode']) ? '1' : '0';
    $apertura = isset($input['ora_apertura']) ? trim($input['ora_apertura']) : '08:00';
    $chiusura = isset($input['ora_chiusura']) ? trim($input['ora_chiusura']) : '19:00';

    $configs = [
        'manutenzione_mode' => $manutenzione,
        'ora_apertura' => $apertura,
        'ora_chiusura' => $chiusura
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