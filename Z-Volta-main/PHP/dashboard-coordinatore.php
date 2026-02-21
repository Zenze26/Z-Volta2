<?php
session_start();
// Controllo accesso: deve essere loggato e avere ruolo Coordinatore
if (!isset($_SESSION['loggedin']) || strtolower($_SESSION['ruolo']) !== 'coordinatore') {
    header("Location: ../index.html");
    exit;
}
require_once 'config.php';
?>
<!DOCTYPE html>
<html lang="it">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Coordinatore - Z-Volta</title>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="/assets/favicon.ico">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../CSS/dashboard.css">
</head>

<body data-theme="dark">

    <div class="dashboard-grid">

        <aside class="glass-box sidebar">
            <div class="sidebar-top">
                <div class="profile-section">
                    <div class="avatar"><i class="fas fa-user-friends"></i></div>
                    <div class="user-info">
                        <div class="user-name"><?php echo htmlspecialchars($_SESSION['nome'] . " " . $_SESSION['cognome']); ?></div>
                        <div class="user-role">Coordinatore</div>
                    </div>
                </div>

                <div class="section-title">Menu</div>
                <ul class="nav-menu">
                    <li class="nav-item"><a href="#" class="nav-link active" data-target="view-dashboard"><i class="fas fa-home"></i> Dashboard</a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="view-mappa"><i class="fas fa-map"></i> Mappa Sede</a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="view-prenotazioni"><i class="fas fa-users-cog"></i> Prenotazioni Team</a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="view-impostazioni"><i class="fas fa-cog"></i> Impostazioni</a></li>
                    <li class="nav-item theme-toggle-item"><a href="#" id="theme-toggle"><i class="fas fa-sun"></i><span>Light Mode</span></a></li>
                </ul>
            </div>

            <div class="nav-item logout-item">
                <a href="logout.php"><i class="fas fa-sign-out-alt"></i>Logout</a>
            </div>
        </aside>

        <main class="main-content">

            <div id="view-dashboard" class="view-section active">
                <div class="top-row">
                    <div class="glass-box column-box">
                        <div class="section-title">Prenota Risorsa Rapida</div>
                        <div class="assets-grid">
                            <div class="asset-card" onclick="alert('Funzione rapida in arrivo')">
                                <i class="fas fa-chair"></i><span>Tipo A<br><small>Scrivania Std</small></span>
                            </div>
                            <div class="asset-card" onclick="alert('Funzione rapida in arrivo')">
                                <i class="fas fa-desktop"></i><span>Tipo A2<br><small>A + Monitor</small></span>
                            </div>
                            <div class="asset-card" onclick="alert('Funzione rapida in arrivo')">
                                <i class="fas fa-users"></i><span>Tipo B<br><small>Sala Riunioni</small></span>
                            </div>
                            <div class="asset-card" onclick="alert('Funzione rapida in arrivo')">
                                <i class="fas fa-car"></i><span>Tipo C<br><small>Posto Auto</small></span>
                            </div>
                        </div>
                    </div>

                    <div class="glass-box map-wrapper">
                        <div class="section-title">Stato Ufficio (Live)</div>
                        <div style="height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; cursor:pointer;" id="mini-map-trigger">
                            <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: var(--accent); margin-bottom: 10px;"></i>
                            <span>Clicca per aprire la mappa grande</span>
                        </div>
                    </div>
                </div>

                <div class="glass-box admin-panel" style="margin-top: 20px;">
                    <div class="admin-header">
                        <div class="section-title"><i class="fas fa-clipboard-list"></i> Riepilogo Attività Team</div>
                        <button class="btn-action btn-mod" onclick="document.querySelector('.nav-link[data-target=\'view-prenotazioni\']').click()">Gestisci Prenotazioni</button>
                    </div>
                    <div style="padding: 20px; text-align: center; color: var(--text-dim);">
                        Vai alla scheda "Prenotazioni Team" per visualizzare e revocare le postazioni del tuo team.
                    </div>
                </div>
            </div>

            <div id="view-mappa" class="view-section">
                <div class="glass-box full-height map-wrapper">
                    <div class="admin-header">
                        <div class="section-title"><i class="fas fa-map-marked-alt"></i> Mappa Interattiva Sede</div>
                        <div class="legend">
                            <span class="dot free" style="background-color: var(--success); width:10px; height:10px; display:inline-block; border-radius:50%;"></span> Disponibile
                            <span class="dot busy" style="background-color: var(--danger); width:10px; height:10px; display:inline-block; border-radius:50%; margin-left:10px;"></span> Occupato
                        </div>
                    </div>
                    <div id="map-area" style="position: relative; width: 100%; height: 100%; min-height: 500px; background-color: var(--map-bg); border: 1px solid var(--glass-border); border-radius: 10px; overflow: hidden;">
                    </div>
                </div>
            </div>

            <div id="view-prenotazioni" class="view-section">
                <div class="glass-box admin-panel full-height">
                    <div class="admin-header">
                        <div class="section-title"><i class="fas fa-users"></i> Prenotazioni del tuo Team</div>
                    </div>
                    <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Utente</th>
                                    <th>Risorsa</th>
                                    <th>Data</th>
                                    <th>Stato</th>
                                    <th class="text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody id="table-prenotazioni-body">
                                </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="view-impostazioni" class="view-section">
                <div class="settings-grid">
                    <div class="glass-box">
                        <div class="section-title"><i class="fas fa-user-shield"></i> Sicurezza Profilo</div>
                        <form id="profile-settings-form">
                            <div class="form-group">
                                <label>Cambia Password</label>
                                <input type="password" name="old_password" placeholder="Password Attuale" required>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <input type="password" name="new_password" id="new_pass" placeholder="Nuova Password" required>
                                </div>
                                <div class="form-group">
                                    <input type="password" name="confirm_password" id="conf_pass" placeholder="Conferma Nuova" required>
                                </div>
                            </div>
                            <div class="modal-footer" style="border:none; padding:0;">
                                <button type="submit" class="btn-action btn-mod">Aggiorna Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </main>
    </div>
    <script src="../JS/dashboard.js"></script>
</body>

</html>