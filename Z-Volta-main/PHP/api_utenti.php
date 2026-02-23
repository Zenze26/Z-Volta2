<?php
session_start();
require_once 'config.php';

// Sicurezza: Solo i gestori possono accedere
if (!isset($_SESSION['loggedin']) || $_SESSION['ruolo'] !== 'gestore') {
    http_response_code(403);
    echo json_encode(['error' => 'Accesso negato']);
    exit;
}

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

function isPasswordValid($pwd) {
    return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/', $pwd);
}

// 1. GET: Leggi tutti gli utenti
if ($method === 'GET') {
    $sql = "SELECT ID_Utente, Username, Nome, Cognome, Ruolo, ID_Team FROM utente ORDER BY Cognome ASC";
    $result = $conn->query($sql);
    $users = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $uid = $row['ID_Utente'];
            $avatar_url = null;
            // Cerca foto profilo associata
            $files = glob("../assets/profiles/avatar_" . $uid . ".*");
            if ($files && count($files) > 0) {
                $avatar_url = $files[0] . "?v=" . time(); // Previene il caching
            }
            $row['avatar'] = $avatar_url;
            $users[] = $row;
        }
    }
    echo json_encode($users);
    exit;
}

// 2. POST: Crea o Modifica utente
if ($method === 'POST') {
    $id = !empty($_POST['id_utente']) ? intval($_POST['id_utente']) : null;
    $nome = trim($_POST['nome']);
    $cognome = trim($_POST['cognome']);
    $username = trim($_POST['username']);
    $ruolo = trim($_POST['ruolo']);
    $team = !empty($_POST['id_team']) ? intval($_POST['id_team']) : null;
    $password = !empty($_POST['password']) ? $_POST['password'] : null;

    if ($password && !isPasswordValid($password)) {
        echo json_encode(['success' => false, 'message' => 'La password deve avere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale.']);
        exit;
    }

    if ($id) {
        if ($password) {
            $stmt = $conn->prepare("UPDATE utente SET Nome=?, Cognome=?, Username=?, Ruolo=?, ID_Team=?, Password=? WHERE ID_Utente=?");
            $stmt->bind_param("ssssisi", $nome, $cognome, $username, $ruolo, $team, $password, $id);
        } else {
            $stmt = $conn->prepare("UPDATE utente SET Nome=?, Cognome=?, Username=?, Ruolo=?, ID_Team=? WHERE ID_Utente=?");
            $stmt->bind_param("ssssii", $nome, $cognome, $username, $ruolo, $team, $id);
        }
    } else {
        if (!$password) {
            echo json_encode(['success' => false, 'message' => 'Password richiesta per nuovi utenti.']);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO utente (Nome, Cognome, Username, Ruolo, ID_Team, Password) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssis", $nome, $cognome, $username, $ruolo, $team, $password);
    }

    if ($stmt->execute()) {
        $target_id = $id ? $id : $stmt->insert_id;

        // Gestione Caricamento Foto Profilo dal Pannello Amministratore
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
            $dir = "../assets/profiles/";
            if (!is_dir($dir)) mkdir($dir, 0777, true);
            
            // Cancella vecchi file avatar dell'utente
            $old_files = glob($dir . "avatar_" . $target_id . ".*");
            foreach($old_files as $f) unlink($f);

            $ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
            $allowed_ext = ['jpg', 'jpeg', 'png', 'gif'];
            
            if (in_array($ext, $allowed_ext)) {
                $filename = "avatar_" . $target_id . "." . $ext;
                move_uploaded_file($_FILES['avatar']['tmp_name'], $dir . $filename);
            }
        }

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => $stmt->error]);
    }
    $stmt->close();
    exit;
}

// 3. DELETE: Elimina utente (riceve JSON)
if ($method === 'DELETE') {
    if(!isset($input['id'])) {
        echo json_encode(['success' => false, 'message' => 'ID mancante']);
        exit;
    }
    
    if($input['id'] == $_SESSION['id_utente']) {
        echo json_encode(['success' => false, 'message' => 'Non puoi eliminare il tuo account']);
        exit;
    }

    $id = intval($input['id']);
    $stmt = $conn->prepare("DELETE FROM utente WHERE ID_Utente = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        // Pulizia File System: se elimini l'utente, elimini anche la foto!
        $files = glob("../assets/profiles/avatar_" . $id . ".*");
        foreach($files as $f) unlink($f);

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => $stmt->error]);
    }
    $stmt->close();
    exit;
}
?>