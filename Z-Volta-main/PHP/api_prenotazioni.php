<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

// Controllo Autenticazione
if (!isset($_SESSION['loggedin'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non autorizzato. Effettua il login.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';
$input = json_decode(file_get_contents('php://input'), true);

$id_utente_loggato = $_SESSION['id_utente'];
$ruolo_loggato = strtolower($_SESSION['ruolo']);

// ==============================================================================
// 1. CREAZIONE PRENOTAZIONE (POST)
// ==============================================================================
if ($method === 'POST' && $action === 'create') {
    $id_asset = intval($input['id_asset']);
    $data_prenotazione = $input['data'];

    // 1. Controlla se l'asset è già prenotato da chiunque in quella data
    $stmt_disp = $conn->prepare("SELECT ID_Prenotazione FROM prenotazione WHERE ID_Asset = ? AND Data_Prenotazione = ? AND Stato = 'Attiva'");
    $stmt_disp->bind_param("is", $id_asset, $data_prenotazione);
    $stmt_disp->execute();
    if ($stmt_disp->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'L\'asset selezionato è già occupato in questa data.']);
        exit;
    }

    // 2. Recupera la tipologia dell'asset richiesto
    $stmt_tipo = $conn->prepare("SELECT Tipologia FROM asset WHERE ID_Asset = ?");
    $stmt_tipo->bind_param("i", $id_asset);
    $stmt_tipo->execute();
    $res_tipo = $stmt_tipo->get_result();
    if ($res_tipo->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Asset non valido.']);
        exit;
    }
    $tipo_asset = $res_tipo->fetch_assoc()['Tipologia'];

    // 3. Controlli specifici per Ruolo sulle prenotazioni nella stessa data
    if ($ruolo_loggato === 'dipendente') {
        if ($tipo_asset === 'C') {
            echo json_encode(['success' => false, 'message' => 'I dipendenti non possono prenotare il Posto Auto.']);
            exit;
        }

        $stmt_check = $conn->prepare("SELECT COUNT(*) as conteggio FROM prenotazione p JOIN asset a ON p.ID_Asset = a.ID_Asset WHERE p.ID_Utente = ? AND p.Data_Prenotazione = ? AND p.Stato = 'Attiva' AND a.Tipologia IN ('A', 'A2', 'B')");
        $stmt_check->bind_param("is", $id_utente_loggato, $data_prenotazione);
        $stmt_check->execute();
        $conteggio = $stmt_check->get_result()->fetch_assoc()['conteggio'];

        if ($conteggio >= 1) {
            echo json_encode(['success' => false, 'message' => 'Hai già raggiunto il limite di 1 prenotazione (A, A2, B) per questa data.']);
            exit;
        }
    } elseif ($ruolo_loggato === 'coordinatore') {
        $stmt_check = $conn->prepare("SELECT COUNT(*) as conteggio FROM prenotazione WHERE ID_Utente = ? AND Data_Prenotazione = ? AND Stato = 'Attiva'");
        $stmt_check->bind_param("is", $id_utente_loggato, $data_prenotazione);
        $stmt_check->execute();
        $conteggio = $stmt_check->get_result()->fetch_assoc()['conteggio'];

        if ($conteggio >= 3) {
            echo json_encode(['success' => false, 'message' => 'Hai già raggiunto il limite massimo di 3 prenotazioni per questa data.']);
            exit;
        }
    }

    // 4. Inserimento della prenotazione
    $stmt_insert = $conn->prepare("INSERT INTO prenotazione (ID_Utente, ID_Asset, Data_Prenotazione, Stato, Contatore_Modifiche) VALUES (?, ?, ?, 'Attiva', 0)");
    $stmt_insert->bind_param("iis", $id_utente_loggato, $id_asset, $data_prenotazione);

    if ($stmt_insert->execute()) {
        echo json_encode(['success' => true, 'message' => 'Prenotazione effettuata con successo!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore nel salvataggio.']);
    }
    exit;
}

// ==============================================================================
// 2. MODIFICA PRENOTAZIONE (POST)
// ==============================================================================
if ($method === 'POST' && $action === 'update') {
    $id_prenotazione = intval($input['id_prenotazione']);
    $nuova_data = $input['nuova_data'];
    $nuovo_asset = intval($input['nuovo_asset']); 

    // 1. Controlla che la prenotazione esista e i permessi
    $stmt_get = $conn->prepare("SELECT ID_Utente, Contatore_Modifiche FROM prenotazione WHERE ID_Prenotazione = ? AND Stato = 'Attiva'");
    $stmt_get->bind_param("i", $id_prenotazione);
    $stmt_get->execute();
    $res_get = $stmt_get->get_result();
    
    if ($res_get->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Prenotazione non trovata o non attiva.']);
        exit;
    }

    $prenotazione = $res_get->fetch_assoc();
    if ($prenotazione['ID_Utente'] != $id_utente_loggato && $ruolo_loggato !== 'gestore') {
        echo json_encode(['success' => false, 'message' => 'Non hai i permessi per modificare questa prenotazione.']);
        exit;
    }

    if ($prenotazione['Contatore_Modifiche'] >= 2) {
        echo json_encode(['success' => false, 'message' => 'Hai già raggiunto il limite massimo di 2 modifiche. Devi cancellarla e ricrearla.']);
        exit;
    }

    // 2. Verifica se il nuovo asset è disponibile (escludendo la prenotazione corrente)
    $stmt_disp = $conn->prepare("SELECT ID_Prenotazione FROM prenotazione WHERE ID_Asset = ? AND Data_Prenotazione = ? AND Stato = 'Attiva' AND ID_Prenotazione != ?");
    $stmt_disp->bind_param("isi", $nuovo_asset, $nuova_data, $id_prenotazione);
    $stmt_disp->execute();
    if ($stmt_disp->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'L\'asset selezionato è già occupato in questa nuova data.']);
        exit;
    }

    // 3. Esegui l'update incrementando il contatore
    $stmt_upd = $conn->prepare("UPDATE prenotazione SET Data_Prenotazione = ?, ID_Asset = ?, Contatore_Modifiche = Contatore_Modifiche + 1 WHERE ID_Prenotazione = ?");
    $stmt_upd->bind_param("sii", $nuova_data, $nuovo_asset, $id_prenotazione);

    if ($stmt_upd->execute()) {
        echo json_encode(['success' => true, 'message' => 'Prenotazione aggiornata con successo!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore durante la modifica.']);
    }
    exit;
}

// ==============================================================================
// 3. CANCELLAZIONE / REVOCA (POST)
// ==============================================================================
if ($method === 'POST' && $action === 'cancel') {
    $id_prenotazione = intval($input['id_prenotazione']);

    $stmt_check = $conn->prepare("SELECT p.ID_Utente, u.ID_Team FROM prenotazione p JOIN utente u ON p.ID_Utente = u.ID_Utente WHERE p.ID_Prenotazione = ?");
    $stmt_check->bind_param("i", $id_prenotazione);
    $stmt_check->execute();
    $res_check = $stmt_check->get_result();
    
    if ($res_check->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Prenotazione inesistente.']);
        exit;
    }
    
    $dati_pren = $res_check->fetch_assoc();
    $owner = $dati_pren['ID_Utente'];
    $team_owner = $dati_pren['ID_Team'];

    if ($owner == $id_utente_loggato) {
        $nuovo_stato = 'Cancellata';
    } elseif ($ruolo_loggato === 'gestore' || ($ruolo_loggato === 'coordinatore' && $team_owner == $_SESSION['id_team'])) {
        $nuovo_stato = 'Revocata';
    } else {
        echo json_encode(['success' => false, 'message' => 'Permessi insufficienti.']);
        exit;
    }

    $stmt_cancel = $conn->prepare("UPDATE prenotazione SET Stato = ? WHERE ID_Prenotazione = ?");
    $stmt_cancel->bind_param("si", $nuovo_stato, $id_prenotazione);

    if ($stmt_cancel->execute()) {
        echo json_encode(['success' => true, 'message' => "Prenotazione $nuovo_stato con successo."]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore durante l\'annullamento.']);
    }
    exit;
}

// ==============================================================================
// 4. LETTURA PRENOTAZIONI (GET)
// ==============================================================================
if ($method === 'GET' && $action === 'list') {
    // Aggiunto p.ID_Asset per permettere la modifica lato Frontend
    $sql = "SELECT p.ID_Prenotazione, p.Data_Prenotazione, p.Stato, p.Contatore_Modifiche, p.ID_Asset,
                   a.Codice_Univoco, a.Tipologia, a.Descrizione,
                   u.Nome, u.Cognome
            FROM prenotazione p
            JOIN asset a ON p.ID_Asset = a.ID_Asset
            JOIN utente u ON p.ID_Utente = u.ID_Utente ";

    if ($ruolo_loggato === 'dipendente') {
        $sql .= "WHERE p.ID_Utente = ? ORDER BY p.Data_Prenotazione DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_utente_loggato);
    } elseif ($ruolo_loggato === 'coordinatore') {
        $id_team = $_SESSION['id_team'] ?? 0;
        $sql .= "WHERE (p.ID_Utente = ? OR u.ID_Team = ?) ORDER BY p.Data_Prenotazione DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $id_utente_loggato, $id_team);
    } else {
        $sql .= "ORDER BY p.Data_Prenotazione DESC";
        $stmt = $conn->prepare($sql);
    }

    $stmt->execute();
    $res = $stmt->get_result();
    
    $prenotazioni = [];
    while ($row = $res->fetch_assoc()) {
        $prenotazioni[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $prenotazioni]);
    exit;
}
?>