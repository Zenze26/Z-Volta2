<?php
session_start(); // Avvia la sessione per salvare i dati dell'utente
require_once 'config.php'; // Include la connessione al DB

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Prevenzione base SQL injection
    $username = $conn->real_escape_string($_POST['username']);
    $password = $_POST['password'];

    // Query aggiornata: estrae anche l'ID_Team e cerca il nome del coordinatore di quel team
    $sql = "SELECT u.ID_Utente, u.Nome, u.Cognome, u.Password, u.Ruolo, u.ID_Team,
            (SELECT CONCAT(Nome, ' ', Cognome) FROM utente WHERE Ruolo = 'coordinatore' AND ID_Team = u.ID_Team LIMIT 1) AS Nome_Coordinatore
            FROM utente u 
            WHERE u.Username = '$username'";

    $result = $conn->query($sql);

    if ($result->num_rows == 1) {
        $row = $result->fetch_assoc();

        // Controllo password IN CHIARO (come da requisiti)
        if ($password === $row['Password']) {

            // Login corretto: Salva i dati in sessione
            $_SESSION['loggedin'] = true;
            $_SESSION['id_utente'] = $row['ID_Utente'];
            $_SESSION['nome'] = $row['Nome'];
            $_SESSION['cognome'] = $row['Cognome'];
            $_SESSION['ruolo'] = $row['Ruolo'];
            $_SESSION['id_team'] = $row['ID_Team'];
            $_SESSION['nome_coordinatore'] = $row['Nome_Coordinatore'] ? $row['Nome_Coordinatore'] : 'Nessun Coordinatore';

            // ... (resta uguale il tuo switch per i redirect) ...

            // GESTIONE DEI RUOLI E REINDIRIZZAMENTO
            // Basato sui requisiti delle dashboard
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
                    header("Location: index.html?error=ruolo_non_valido");
            }
            exit;
        } else {
            // Password errata
            header("Location: index.html?error=password_errata");
        }
    } else {
        // Username non trovato
        header("Location: index.html?error=utente_non_trovato");
    }
}
$conn->close();
