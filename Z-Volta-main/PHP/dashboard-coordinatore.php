<?php
session_start();
if (!isset($_SESSION['loggedin']) || $_SESSION['ruolo'] !== 'coordinatore') {
    header("Location: index.html");
    exit;
}
require_once 'config.php';
?>
<!DOCTYPE html>
<html lang="it">

<head>
    <meta charset="UTF-8">
    <title>Dashboard Coordinatore</title>
    <link rel="stylesheet" href="./CSS/dashboard.css">
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>

<body data-theme="dark">
    <div class="dashboard-grid">
        <aside class="glass-box sidebar">
            <div class="sidebar-top">
                <div class="profile-section">
                    <div class="avatar"><i class="fas fa-user-friends"></i></div>
                    <div class="user-info">
                        <div class="user-name"><?php echo $_SESSION['nome']; ?></div>
                        <div class="user-role">Coordinatore</div>
                    </div>
                </div>
                <div class="section-title">Menu</div>
                <ul class="nav-menu">
                    <li class="nav-item"><a href="#" class="nav-link active" data-target="view-dashboard"><i class="fas fa-home"></i> Dashboard</a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="view-mappa"><i class="fas fa-map"></i> Mappa</a></li>
                    <li class="nav-item"><a href="#" class="nav-link" data-target="view-team"><i class="fas fa-users-cog"></i> Il Mio Team</a></li>
                </ul>
            </div>
            <div class="nav-item logout-item"><a href="logout.php"><i class="fas fa-sign-out-alt"></i>Logout</a></div>
        </aside>

        <main class="main-content">
            <div id="view-dashboard" class="view-section active">
                <div id="view-mappa" class="view-section">
                    <div class="glass-box full-height map-wrapper">
                        <div class="admin-header">
                            <div class="section-title"><i class="fas fa-map-marked-alt"></i> Mappa Interattiva Sede</div>
                            <div class="legend">
                                <span class="dot free"></span> Disponibile
                                <span class="dot busy" style="margin-left:10px;"></span> Occupato
                            </div>
                        </div>
                        <div id="map-area" style="position: relative; width: 100%; height: 100%; min-height: 500px; background-color: var(--map-bg); border: 1px solid var(--glass-border); border-radius: 10px; overflow: hidden;">
                        </div>
                    </div>
                </div>
                <div class="top-row">
                    <div class="glass-box column-box">
                        <div class="section-title">Prenota Risorsa</div>
                        <div class="assets-grid">
                            <div class="asset-card"><i class="fas fa-chair"></i><span>Tipo A</span></div>
                            <div class="asset-card"><i class="fas fa-desktop"></i><span>Tipo A2</span></div>
                            <div class="asset-card"><i class="fas fa-users"></i><span>Tipo B</span></div>
                            <div class="asset-card"><i class="fas fa-car"></i><span>Tipo C</span></div>
                        </div>
                    </div>
                </div>

                <div class="glass-box admin-panel">
                    <div class="admin-header">
                        <div class="section-title">Prenotazioni del tuo Team</div>
                    </div>
                    <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Dipendente</th>
                                    <th>Risorsa</th>
                                    <th>Data</th>
                                    <th>Stato</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody id="table-prenotazioni-body">
                                <tr>
                                    <td>Mario Rossi (Tuo Team)</td>
                                    <td>Tipo A</td>
                                    <td>Domani</td>
                                    <td class="status-active">Attiva</td>
                                    <td class="text-right"><button class="btn-action btn-mod">Modifica</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>
    <script src="./JS/dashboard.js"></script>
</body>

</html>