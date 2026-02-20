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

// Leggi il metodo della richiesta
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Funzione helper per validare la password secondo i requisiti aziendali
function isPasswordValid($pwd) {
    // Min 8 char, 1 maiuscola, 1 minuscola, 1 numero, 1 carattere speciale
    return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/', $pwd);
}

// 1. GET: Leggi tutti gli utenti
if ($method === 'GET') {
    $sql = "SELECT ID_Utente, Username, Nome, Cognome, Ruolo, ID_Team FROM utente ORDER BY Cognome ASC";
    $result = $conn->query($sql);
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode($users);
    exit;
}

// 2. POST: Crea o Modifica utente
if ($method === 'POST') {
    $id = isset($_POST['id_utente']) && !empty($_POST['id_utente']) ? $_POST['id_utente'] : null;
    $nome = $conn->real_escape_string($_POST['nome']);
    $cognome = $conn->real_escape_string($_POST['cognome']);
    $username = $conn->real_escape_string($_POST['username']);
    $ruolo = $conn->real_escape_string($_POST['ruolo']);
    $team = !empty($_POST['id_team']) ? intval($_POST['id_team']) : 'NULL';
    $password = !empty($_POST['password']) ? $_POST['password'] : null;

    // Validazione della password se presente
    if ($password && !isPasswordValid($password)) {
        echo json_encode(['success' => false, 'message' => 'La password deve avere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale.']);
        exit;
    }

    if ($id) {
        // UPDATE
        $id = intval($id);
        if ($password) {
            // Salvataggio in chiaro senza crittografia come da requisiti Z-Volta
            $sql = "UPDATE utente SET Nome='$nome', Cognome='$cognome', Username='$username', Ruolo='$ruolo', ID_Team=$team, Password='$password' WHERE ID_Utente=$id";
        } else {
            // Se la password è vuota, non aggiornarla
            $sql = "UPDATE utente SET Nome='$nome', Cognome='$cognome', Username='$username', Ruolo='$ruolo', ID_Team=$team WHERE ID_Utente=$id";
        }
    } else {
        // INSERT (Nuovo utente)
        if (!$password) {
            echo json_encode(['success' => false, 'message' => 'Password richiesta per nuovi utenti.']);
            exit;
        }
        // Salvataggio in chiaro senza crittografia come da requisiti Z-Volta
        $sql = "INSERT INTO utente (Nome, Cognome, Username, Ruolo, ID_Team, Password) VALUES ('$nome', '$cognome', '$username', '$ruolo', $team, '$password')";
    }

    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => $conn->error]);
    }
    exit;
}

// 3. DELETE: Elimina utente (riceve JSON)
if ($method === 'DELETE') {
    if(!isset($input['id'])) {
        echo json_encode(['success' => false, 'message' => 'ID mancante']);
        exit;
    }
    
    // Evita che il gestore cancelli se stesso (corretto user_id in id_utente)
    if($input['id'] == $_SESSION['id_utente']) {
        echo json_encode(['success' => false, 'message' => 'Non puoi eliminare il tuo account']);
        exit;
    }

    $id = intval($input['id']);
    $sql = "DELETE FROM utente WHERE ID_Utente = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => $conn->error]);
    }
    exit;
}
?>