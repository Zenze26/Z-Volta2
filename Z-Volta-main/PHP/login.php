<?php
session_start(); // Avvia la sessione per salvare i dati dell'utente
require_once 'config.php'; // Include la connessione al DB

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Validazione input base per assicurarsi che i campi non siano vuoti
    if (!isset($_POST['username']) || !isset($_POST['password'])) {
        header("Location: ../index.html?error=campi_mancanti");
        exit;
    }

    $username = trim($_POST['username']);
    $password = $_POST['password'];

    // Utilizzo dei Prepared Statements per prevenire totalmente le SQL Injection
    $sql = "SELECT u.ID_Utente, u.Nome, u.Cognome, u.Password, u.Ruolo, u.ID_Team,
            (SELECT CONCAT(Nome, ' ', Cognome) FROM utente WHERE Ruolo = 'coordinatore' AND ID_Team = u.ID_Team LIMIT 1) AS Nome_Coordinatore
            FROM utente u 
            WHERE u.Username = ?";

    if ($stmt = $conn->prepare($sql)) {
        // Collega il parametro in modo sicuro (s = string)
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows == 1) {
            $row = $result->fetch_assoc();

            // Controllo password IN CHIARO (come da requisiti attuali del DB Z-Volta)
            if ($password === $row['Password']) {

                // Login corretto: rigenera l'ID di sessione per prevenire Session Fixation
                session_regenerate_id(true);

                // Salva i dati in sessione
                $_SESSION['loggedin'] = true;
                $_SESSION['id_utente'] = $row['ID_Utente'];
                $_SESSION['nome'] = $row['Nome'];
                $_SESSION['cognome'] = $row['Cognome'];
                $_SESSION['ruolo'] = $row['Ruolo'];
                $_SESSION['id_team'] = $row['ID_Team'];
                $_SESSION['nome_coordinatore'] = $row['Nome_Coordinatore'] ? $row['Nome_Coordinatore'] : 'Nessun Coordinatore';

                // GESTIONE DEI RUOLI E REINDIRIZZAMENTO
                // Le dashboard si trovano nella stessa cartella PHP/
                switch (strtolower($row['Ruolo'])) {
                    case 'dipendente':
                        header("Location: dashboard-dipendente.php");
                        break;
                    case 'coordinatore':
                        header("Location: dashboard-coordinatore.php");
                        break;
                    case 'gestore':
                        header("Location: dashboard-gestore.php");
                        break;
                    default:
                        // Ruolo non riconosciuto
                        header("Location: ../index.html?error=ruolo_non_valido");
                        break;
                }
                exit;
            } else {
                // Password errata
                header("Location: ../index.html?error=password_errata");
                exit;
            }
        } else {
            // Username non trovato
            header("Location: ../index.html?error=utente_non_trovato");
            exit;
        }
        $stmt->close();
    } else {
        // Errore di preparazione della query lato server
        header("Location: ../index.html?error=errore_server");
        exit;
    }
}
$conn->close();
?>