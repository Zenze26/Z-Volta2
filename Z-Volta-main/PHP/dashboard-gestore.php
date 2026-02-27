<?php
session_start();
// Controllo accesso: deve essere loggato e avere ruolo Gestore
if (!isset($_SESSION['loggedin']) || $_SESSION['ruolo'] !== 'gestore') {
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
    <title>Dashboard Gestore - Z-Volta</title>
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
                    <div class="avatar"><i class="fas fa-user-tie"></i></div>
                    <div class="user-info">
                        <div class="user-name"><?php echo htmlspecialchars($_SESSION['nome'] . " " . $_SESSION['cognome']); ?></div>
                        <div class="user-role"><?php echo htmlspecialchars($_SESSION['ruolo']); ?></div>
                    </div>
                </div>

                <div class="section-title">Menu</div>
                <ul class="nav-menu">
                    <li class="nav-item"><a href="#" class="nav-link active" data-target="view-dashboard"><i class="fas fa-home"></i> Dashboard</a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="view-mappa"><i class="fas fa-map"></i> Mappa</a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="view-prenotazioni"><i class="fas fa-calendar-alt"></i> Prenotazioni</a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="view-utenti"><i class="fas fa-users"></i> Utenti</a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="view-impostazioni"><i class="fas fa-cog"></i> Impostazioni</a></li>
                    
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
            </div>

            <div id="view-mappa" class="view-section">
                <div class="glass-box full-height map-wrapper">
                    <div class="admin-header">
                        <div class="section-title"><i class="fas fa-map-marked-alt"></i> Mappa Interattiva Sede</div>
                        
                    </div>
                    <div id="map-area" style="position: relative; width: 100%; height: 100%; min-height: 500px; background-color: var(--map-bg); border: 1px solid var(--glass-border); border-radius: 10px; overflow: hidden;">
                    </div>
                </div>
            </div>

            <div id="view-prenotazioni" class="view-section">
                <div class="glass-box admin-panel full-height">
                    <div class="admin-header">
                        <div class="section-title"><i class="fas fa-calendar-check"></i> Gestione Globale Prenotazioni</div>
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

            <div id="view-utenti" class="view-section">
                <div class="glass-box full-height">
                    <div class="admin-header">
                        <div class="section-title"><i class="fas fa-users-cog"></i> Gestione Anagrafica Utenti</div>
                        <button class="btn-action btn-add" onclick="openUserModal()">
                            <i class="fas fa-plus"></i> Nuovo Utente
                        </button>
                    </div>

                    <div class="table-scroll">
                        <table id="users-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome Completo</th>
                                    <th>Username</th>
                                    <th>Ruolo</th>
                                    <th>Team ID</th>
                                    <th class="text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body">
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

                    <?php if ($_SESSION['ruolo'] === 'gestore'): ?>
                        <div class="glass-box">
                            <div class="section-title"><i class="fas fa-sliders-h"></i> Parametri Sistema</div>
                            <form id="global-config-form">

                                <div class="setting-item">
                                    <div>
                                        <div class="setting-label">Modalità Manutenzione</div>
                                        <div class="setting-desc">Blocca tutte le nuove prenotazioni.</div>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" name="manutenzione_mode" id="conf_manutenzione">
                                        <span class="slider round"></span>
                                    </label>
                                </div>

                                <hr style="border-color:var(--glass-border); margin:15px 0;">

                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Ora Apertura</label>
                                        <input type="time" name="ora_apertura" id="conf_apertura">
                                    </div>
                                    <div class="form-group">
                                        <label>Ora Chiusura</label>
                                        <input type="time" name="ora_chiusura" id="conf_chiusura">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>Anticipo Max Prenotazione (Giorni)</label>
                                    <input type="number" name="max_giorni_anticipo" id="conf_anticipo">
                                </div>

                                <div class="modal-footer" style="border:none; padding:0;">
                                    <button type="submit" class="btn-action btn-mod">Salva Configurazione</button>
                                </div>
                            </form>
                        </div>
                    <?php endif; ?>

                </div>
            </div>

            <div id="user-modal" class="modal-overlay">
                <div class="glass-box modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">Nuovo Utente</h3>
                        <button class="close-modal" onclick="closeUserModal()">&times;</button>
                    </div>
                    <form id="user-form">
                        <input type="hidden" id="user_id" name="id_utente">

                        <div class="form-group">
                            <label>Nome</label>
                            <input type="text" id="nome" name="nome" required>
                        </div>
                        <div class="form-group">
                            <label>Cognome</label>
                            <input type="text" id="cognome" name="cognome" required>
                        </div>
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" id="username" name="username" required>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="password" name="password" placeholder="Lascia vuoto per non cambiare">
                            <small style="color:var(--text-dim); font-size:10px;">(Richiesto solo per nuovi utenti)</small>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ruolo</label>
                                <select id="ruolo" name="ruolo">
                                    <option value="dipendente">Dipendente</option>
                                    <option value="coordinatore">Coordinatore</option>
                                    <option value="gestore">Gestore</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>ID Team</label>
                                <input type="number" id="id_team" name="id_team">
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn-action btn-rev" onclick="closeUserModal()">Annulla</button>
                            <button type="submit" class="btn-action btn-mod">Salva Utente</button>
                        </div>
                    </form>
                </div>
            </div>

        </main>
    </div>
    <script src="../JS/dashboard.js"></script>
</body>

</html>