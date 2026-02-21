document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // STATO GLOBALE DELL'APPLICAZIONE
    // ==========================================
    const appState = {
        assets: [],
        prenotazioni: [],
        currentDate: new Date().toISOString().split('T')[0],
        currentLayer: 1, // 1 = Ufficio (Mappa 1), 2 = Parcheggio (Mappa 2)
        activeFilter: null, // Es. 'A', 'A2', 'B', 'C'
        mapInitialized: false
    };

    // Stili Background Realistici
    const bgUfficio = `background-color: #1e293b; background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 30px 30px;`;
    const bgParcheggio = `background-color: #2a2e35; background-image: repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.15) 40px, rgba(255,255,255,0.15) 45px);`;

    // --- 1. GESTIONE NAVIGAZIONE E UI BASE ---
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view-section');

    function switchView(targetId) {
        views.forEach(view => view.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        const targetView = document.getElementById(targetId);
        const targetLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);

        if (targetView) targetView.classList.add('active');
        if (targetLink) targetLink.classList.add('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(link.getAttribute('data-target'));
        });
    });

    // Dark/Light Mode
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        const textSpan = toggleBtn.querySelector('span');

        function updateThemeUI(isLight) {
            if (isLight) {
                icon.classList.remove('fa-sun'); icon.classList.add('fa-moon');
                textSpan.textContent = 'Dark Mode';
            } else {
                icon.classList.remove('fa-moon'); icon.classList.add('fa-sun');
                textSpan.textContent = 'Light Mode';
            }
        }

        const savedTheme = localStorage.getItem('dashboard-theme');
        if (savedTheme) {
            body.setAttribute('data-theme', savedTheme);
            updateThemeUI(savedTheme === 'light');
        }

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isCurrentlyLight = body.getAttribute('data-theme') === 'light';
            const newTheme = isCurrentlyLight ? 'dark' : 'light';
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('dashboard-theme', newTheme);
            updateThemeUI(!isCurrentlyLight);
        });
    }

    // --- 2. GESTIONE FILTRI RAPIDI (CARDS DASHBOARD) ---
    function initQuickFilters() {
        const assetCards = document.querySelectorAll('.asset-card');
        assetCards.forEach(card => {
            card.removeAttribute('onclick');
            card.style.cursor = 'pointer';
            card.style.transition = 'all 0.2s ease';

            card.addEventListener('click', () => {
                const text = card.innerText;
                let type = null;
                if (text.includes('Tipo A2')) type = 'A2';
                else if (text.includes('Tipo A')) type = 'A';
                else if (text.includes('Tipo B')) type = 'B';
                else if (text.includes('Tipo C')) type = 'C';

                if (appState.activeFilter === type) {
                    appState.activeFilter = null; 
                    card.style.border = 'none';
                    card.style.transform = 'scale(1)';
                } else {
                    appState.activeFilter = type;
                    assetCards.forEach(c => { c.style.border = 'none'; c.style.transform = 'scale(1)'; });
                    card.style.border = '2px solid var(--accent)';
                    card.style.transform = 'scale(1.05)';
                }
                updateMapState();
            });
        });
    }

    // --- 3. GESTIONE UTENTI (Solo Admin) ---
    const btnViewUtenti = document.querySelector('.nav-link[data-target="view-utenti"]');
    if (btnViewUtenti) btnViewUtenti.addEventListener('click', fetchUsers);

    function fetchUsers() {
        fetch('../PHP/api_utenti.php').then(res => res.json()).then(data => {
            const tbody = document.querySelector('#users-table tbody');
            if(!tbody) return;
            tbody.innerHTML = ''; 
            data.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.ID_Utente}</td>
                    <td><div style="font-weight:bold;">${user.Cognome} ${user.Nome}</div></td>
                    <td>${user.Username}</td>
                    <td><span style="font-size:10px; padding:2px 6px; border:1px solid var(--accent); border-radius:4px;">${user.Ruolo}</span></td>
                    <td>${user.ID_Team || '-'}</td>
                    <td class="text-right">
                        <button class="btn-action btn-mod" onclick="editUser(${user.ID_Utente}, '${user.Nome}', '${user.Cognome}', '${user.Username}', '${user.Ruolo}', '${user.ID_Team || ''}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-action btn-rev" onclick="deleteUser(${user.ID_Utente})"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }).catch(err => console.error(err));
    }

    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', function (e) {
            e.preventDefault();
            fetch('../PHP/api_utenti.php', { method: 'POST', body: new FormData(this) })
                .then(res => res.json()).then(data => {
                    if (data.success) { closeUserModal(); fetchUsers(); }
                    else alert('Errore: ' + data.message);
                });
        });
    }

    window.openUserModal = function () {
        document.getElementById('user-form').reset(); document.getElementById('user_id').value = ''; 
        document.getElementById('modal-title').textContent = 'Nuovo Utente';
        document.getElementById('user-modal').classList.add('active');
    };
    window.closeUserModal = function () { document.getElementById('user-modal').classList.remove('active'); };
    window.editUser = function (id, nome, cognome, username, ruolo, team) {
        document.getElementById('user_id').value = id; document.getElementById('nome').value = nome;
        document.getElementById('cognome').value = cognome; document.getElementById('username').value = username;
        document.getElementById('ruolo').value = ruolo; document.getElementById('id_team').value = team;
        document.getElementById('modal-title').textContent = 'Modifica Utente';
        document.getElementById('user-modal').classList.add('active');
    };
    window.deleteUser = function (id) {
        if (!confirm('Eliminare utente?')) return;
        fetch('../PHP/api_utenti.php', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id}) })
            .then(res => res.json()).then(data => { if(data.success) fetchUsers(); else alert(data.message); });
    };

    // --- 4. GESTIONE IMPOSTAZIONI ---
    const btnSettings = document.querySelector('.nav-link[data-target="view-impostazioni"]');
    if (btnSettings) btnSettings.addEventListener('click', () => {
        fetch('../PHP/api_impostazioni.php?action=get_config').then(res => res.json()).then(data => {
            if(document.getElementById('conf_manutenzione')) document.getElementById('conf_manutenzione').checked = (data.manutenzione_mode === '1');
            if(document.getElementById('conf_apertura')) document.getElementById('conf_apertura').value = data.ora_apertura;
            if(document.getElementById('conf_chiusura')) document.getElementById('conf_chiusura').value = data.ora_chiusura;
            if(document.getElementById('conf_anticipo')) document.getElementById('conf_anticipo').value = data.max_giorni_anticipo;
        });
    });

    const passForm = document.getElementById('profile-settings-form');
    if (passForm) {
        passForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(passForm).entries());
            if (data.new_password !== data.confirm_password) return alert("Le nuove password non coincidono!");
            fetch('../PHP/api_impostazioni.php?action=change_password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            }).then(res => res.json()).then(resp => {
                if(resp.success) { alert("Password aggiornata!"); passForm.reset(); }
                else alert(resp.message);
            });
        });
    }

    // ==========================================
    // 5. MOTORE MAPPA, PRENOTAZIONI E FILTRI
    // ==========================================

    function initData() {
        initQuickFilters();
        Promise.all([
            fetch('../PHP/api_assets.php').then(res => res.json()),
            fetch('../PHP/api_prenotazioni.php?action=list').then(res => res.json())
        ]).then(([assetsRes, prenRes]) => {
            if (assetsRes.success) appState.assets = assetsRes.data;
            if (prenRes.success) appState.prenotazioni = prenRes.data;
            
            buildMapDOM();
            renderTabellaPrenotazioni();
            updateMapState(); 
        }).catch(err => console.error("Errore caricamento dati:", err));
    }

    async function reloadPrenotazioni() {
        try {
            const res = await fetch('../PHP/api_prenotazioni.php?action=list');
            const prenRes = await res.json();
            if (prenRes.success) {
                appState.prenotazioni = prenRes.data;
                renderTabellaPrenotazioni();
                updateMapState();
            }
        } catch (error) {
            console.error("Errore ricaricamento prenotazioni:", error);
        }
    }

    // --- ANTEPRIMA MINI-MAPPA (DASHBOARD) ---
    function renderMiniMap() {
        const container = document.getElementById('mini-map-trigger');
        if (!container) return;

        let layerToShow = 1;
        if (appState.activeFilter === 'C') layerToShow = 2;

        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '250px';
        container.style.borderRadius = '8px';
        container.style.border = '1px solid var(--glass-border)';
        container.style.overflow = 'hidden';
        container.style.cursor = 'pointer';

        // Applica sfondo realistico alla mini mappa
        container.style.cssText += layerToShow === 1 ? bgUfficio : bgParcheggio;

        const title = document.createElement('div');
        title.style.position = 'absolute'; title.style.top = '10px'; title.style.left = '10px';
        title.style.background = 'rgba(0,0,0,0.7)'; title.style.padding = '5px 10px'; title.style.borderRadius = '5px';
        title.style.fontSize = '0.8rem'; title.style.color = '#fff'; title.style.zIndex = '10';
        title.innerHTML = appState.activeFilter ? `<i class="fas fa-filter"></i> Filtro: Tipo ${appState.activeFilter}` : `<i class="fas fa-eye"></i> Sede Principale (Live)`;
        container.appendChild(title);

        const mapArea = document.createElement('div');
        mapArea.style.position = 'relative'; mapArea.style.width = '100%'; mapArea.style.height = '100%';

        appState.assets.forEach(asset => {
            if (asset.ID_Mappa != layerToShow) return;
            if (appState.activeFilter && asset.Tipologia !== appState.activeFilter) return;

            const isOccupied = appState.prenotazioni.some(p => p.Stato === 'Attiva' && p.Data_Prenotazione === appState.currentDate && p.ID_Asset === asset.ID_Asset);

            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.left = asset.Coordinate_X + '%';
            dot.style.top = asset.Coordinate_Y + '%';
            dot.style.transform = 'translate(-50%, -50%)';
            dot.style.display = 'flex';
            dot.style.alignItems = 'center';
            dot.style.justifyContent = 'center';
            dot.style.color = '#fff';
            dot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

            // Mappatura Icone per la Mini Mappa
            let iconClass = 'fa-chair'; 
            if (asset.Tipologia === 'A' || asset.Tipologia === 'A2') {
                iconClass = asset.Tipologia === 'A' ? 'fa-chair' : 'fa-desktop';
                dot.style.width = '20px'; dot.style.height = '20px'; dot.style.borderRadius = '4px';
            } else if (asset.Tipologia === 'B') {
                iconClass = 'fa-users'; dot.style.width = '25px'; dot.style.height = '25px'; dot.style.borderRadius = '50%';
            } else if (asset.Tipologia === 'C') {
                iconClass = 'fa-car'; dot.style.width = '20px'; dot.style.height = '30px'; 
                dot.style.borderRadius = '2px'; dot.style.border = '1px dashed rgba(255,255,255,0.5)';
            }

            dot.style.backgroundColor = isOccupied ? 'var(--danger, #dc3545)' : 'var(--success, #28a745)';
            dot.innerHTML = `<i class="fas ${iconClass}" style="font-size: 0.6rem;"></i>`;

            mapArea.appendChild(dot);
        });

        container.appendChild(mapArea);

        container.onclick = () => {
            appState.currentLayer = layerToShow;
            const layerFilter = document.getElementById('map-layer-filter');
            if (layerFilter) layerFilter.value = layerToShow.toString();
            updateMapState();
            switchView('view-mappa');
        };
    }

    // --- COSTRUZIONE MAPPA PRINCIPALE ---
    function buildMapDOM() {
        if (appState.mapInitialized) return; 

        const headerMappa = document.querySelector('#view-mappa .admin-header');
        const mapContainer = document.querySelector('#view-mappa .map-wrapper');
        if (!mapContainer || !headerMappa) return;

        const controlliMappa = document.createElement('div');
        controlliMappa.style.display = 'flex'; controlliMappa.style.gap = '15px'; controlliMappa.style.marginTop = '15px'; controlliMappa.style.alignItems = 'center';
        const oggi = new Date().toISOString().split('T')[0];

        controlliMappa.innerHTML = `
            <div>
                <label style="font-weight:bold; margin-right:5px;">Data Mappa:</label>
                <input type="date" id="map-date-filter" value="${appState.currentDate}" min="${oggi}" onkeydown="return false" 
                       style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--accent, #007bff); background-color: #1e293b; color: #ffffff; font-weight: bold; cursor: pointer; outline: none;">
            </div>
            <div>
                <label style="font-weight:bold; margin-right:5px;">Zona:</label>
                <select id="map-layer-filter" style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--accent, #007bff); background-color: #1e293b; color: #ffffff; font-weight: bold; cursor: pointer; outline: none;">
                    <option value="1">🏢 Uffici (Sede Principale)</option>
                    <option value="2">🚗 Garage Sotterraneo</option>
                </select>
            </div>
        `;
        headerMappa.appendChild(controlliMappa);

        document.getElementById('map-date-filter').addEventListener('change', (e) => { appState.currentDate = e.target.value; updateMapState(); });
        document.getElementById('map-layer-filter').addEventListener('change', (e) => { appState.currentLayer = parseInt(e.target.value); updateMapState(); });

        let mapArea = document.getElementById('map-area');
        if(!mapArea) {
            mapArea = document.createElement('div');
            mapArea.id = 'map-area';
            mapArea.style.position = 'relative'; mapArea.style.width = '100%'; mapArea.style.height = '500px'; 
            mapArea.style.border = '1px solid var(--glass-border)'; mapArea.style.borderRadius = '10px'; mapArea.style.overflow = 'hidden';
            mapContainer.appendChild(mapArea);
        }

        const layerUfficio = document.createElement('div'); layerUfficio.id = 'layer-1'; layerUfficio.style.width = '100%'; layerUfficio.style.height = '100%'; layerUfficio.style.position = 'absolute';
        layerUfficio.style.cssText += bgUfficio; // Applica stile pavimento architettonico

        const layerParcheggio = document.createElement('div'); layerParcheggio.id = 'layer-2'; layerParcheggio.style.width = '100%'; layerParcheggio.style.height = '100%'; layerParcheggio.style.position = 'absolute'; layerParcheggio.style.display = 'none';
        layerParcheggio.style.cssText += bgParcheggio; // Applica stile asfalto

        appState.assets.forEach(asset => {
            const div = document.createElement('div');
            div.id = `asset-${asset.Codice_Univoco}`;
            div.className = 'desk d-free'; 
            
            div.style.position = 'absolute'; div.style.left = asset.Coordinate_X + '%'; div.style.top = asset.Coordinate_Y + '%';
            div.style.display = 'flex'; div.style.flexDirection = 'column'; div.style.alignItems = 'center'; div.style.justifyContent = 'center';
            div.style.cursor = 'pointer'; div.style.color = '#fff'; div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)'; div.style.transition = 'all 0.3s ease';
            div.style.transform = 'translate(-50%, -50%)'; // Centra perfettamente l'asse

            div.addEventListener('mouseenter', () => div.style.transform = 'translate(-50%, -50%) scale(1.1)');
            div.addEventListener('mouseleave', () => div.style.transform = 'translate(-50%, -50%) scale(1)');

            let iconClass = 'fa-chair'; 
            if (asset.Tipologia === 'A' || asset.Tipologia === 'A2') {
                iconClass = asset.Tipologia === 'A' ? 'fa-chair' : 'fa-desktop';
                div.style.width = '45px'; div.style.height = '45px'; div.style.borderRadius = '8px';
            } else if (asset.Tipologia === 'B') {
                iconClass = 'fa-users'; div.style.width = '60px'; div.style.height = '60px'; div.style.borderRadius = '50%';
            } else if (asset.Tipologia === 'C') {
                iconClass = 'fa-car'; div.style.width = '45px'; div.style.height = '65px'; 
                div.style.borderRadius = '2px'; div.style.border = '2px dashed rgba(255,255,255,0.7)';
            }

            const numAsset = asset.Codice_Univoco.split('-')[1];
            div.innerHTML = `<i class="fas ${iconClass}" style="font-size: 1.2rem; margin-bottom: 2px;"></i><span style="font-size: 0.6rem; font-weight: bold;">${numAsset}</span>`;
            
            div.addEventListener('click', () => {
                if (div.classList.contains('d-busy')) alert("Questo asset è già occupato per la data selezionata.");
                else openReservationModal(asset.ID_Asset, `${asset.Tipologia} - ${asset.Codice_Univoco}`, appState.currentDate);
            });

            if(asset.ID_Mappa == 1) layerUfficio.appendChild(div);
            else layerParcheggio.appendChild(div);
        });

        mapArea.appendChild(layerUfficio);
        mapArea.appendChild(layerParcheggio);
        appState.mapInitialized = true;
    }

    function updateMapState() {
        if (!appState.mapInitialized) return;

        document.getElementById('layer-1').style.display = (appState.currentLayer === 1) ? 'block' : 'none';
        document.getElementById('layer-2').style.display = (appState.currentLayer === 2) ? 'block' : 'none';

        // 1. Reset visivo e Applica il FILTRO
        appState.assets.forEach(asset => {
            const el = document.getElementById(`asset-${asset.Codice_Univoco}`);
            if (el) {
                if (appState.activeFilter && asset.Tipologia !== appState.activeFilter) {
                    el.style.display = 'none';
                } else {
                    el.style.display = 'flex'; 
                }

                el.classList.remove('d-busy'); el.classList.add('d-free'); el.title = `Libero - Clicca per prenotare`;
                
                if(asset.Tipologia === 'C') {
                    el.style.setProperty('background-color', '#6c757d', 'important'); 
                    el.style.border = '2px dashed rgba(255,255,255,0.7)';
                } else {
                    el.style.setProperty('background-color', '#28a745', 'important'); 
                    el.style.border = '1px solid #fff';
                }
            }
        });

        // 2. Colora di Rosso gli asset Occupati
        const prenotazioniGiorno = appState.prenotazioni.filter(p => p.Stato === 'Attiva' && p.Data_Prenotazione === appState.currentDate);
        prenotazioniGiorno.forEach(p => {
            const el = document.getElementById(`asset-${p.Codice_Univoco}`);
            if (el && el.style.display !== 'none') {
                el.classList.remove('d-free'); el.classList.add('d-busy'); el.title = `Occupato da ${p.Nome} ${p.Cognome}`;
                el.style.setProperty('background-color', '#dc3545', 'important'); 
                if(p.Tipologia === 'C') el.style.border = '2px solid rgba(255,255,255,0.8)';
            }
        });

        renderMiniMap(); // Aggiorna la miniatura
    }

    function renderTabellaPrenotazioni() {
        const tbody = document.querySelector('#table-prenotazioni-body');
        if (!tbody) return; 
        tbody.innerHTML = ''; 

        const prenotazioniAttive = appState.prenotazioni.filter(p => p.Stato === 'Attiva');
        if (prenotazioniAttive.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nessuna prenotazione attiva.</td></tr>';
            return;
        }

        prenotazioniAttive.forEach(p => {
            let actionButtons = '';
            if (parseInt(p.Contatore_Modifiche) < 2) {
                actionButtons += `<button class="btn-action btn-mod" onclick="apriModaleModifica(${p.ID_Prenotazione}, ${p.ID_Asset}, '${p.Tipologia} - ${p.Codice_Univoco}', '${p.Data_Prenotazione}')"><i class="fas fa-edit"></i> Modifica</button> `;
            }
            actionButtons += `<button class="btn-action btn-rev" onclick="annullaPrenotazione(${p.ID_Prenotazione})"><i class="fas fa-times"></i> Annulla</button>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.Cognome} ${p.Nome}</td>
                <td><strong style="color:var(--accent);">${p.Tipologia}</strong> - ${p.Codice_Univoco}</td>
                <td>${p.Data_Prenotazione}</td>
                <td class="status-active">${p.Stato}</td>
                <td class="text-right">${actionButtons}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- 6. MODALE PRENOTAZIONI ---
    function createReservationModal() {
        let modal = document.getElementById('reservation-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'reservation-modal';
            modal.className = 'modal-overlay';
            const oggi = new Date().toISOString().split('T')[0];

            modal.innerHTML = `
                <div class="glass-box modal-content">
                    <div class="modal-header">
                        <h3 id="res-modal-title">Prenota Risorsa</h3>
                        <button type="button" class="close-modal" onclick="closeReservationModal()">&times;</button>
                    </div>
                    <form id="reservation-form">
                        <input type="hidden" id="res_id_asset" name="id_asset">
                        <input type="hidden" id="res_id_prenotazione" name="id_prenotazione">
                        
                        <div class="form-group">
                            <label>Risorsa Selezionata</label>
                            <input type="text" id="res_asset_name" readonly style="background-color: var(--bg-main); cursor: not-allowed; border: 1px solid var(--glass-border); padding: 10px; border-radius: 5px; width: 100%; color: var(--text-main);">
                        </div>
                        <div class="form-group" style="margin-top: 15px;">
                            <label>Scegli la Data</label>
                            <input type="date" id="res_data" name="data" required min="${oggi}" onkeydown="return false" 
                                   style="padding: 10px; border-radius: 5px; border: 1px solid var(--accent, #007bff); background-color: #1e293b; color: #ffffff; width: 100%; cursor:pointer;">
                        </div>
                        <div class="modal-footer" style="margin-top: 20px;">
                            <button type="button" class="btn-action btn-rev" onclick="closeReservationModal()">Annulla</button>
                            <button type="submit" class="btn-action btn-mod">Conferma Salva</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('reservation-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const id_asset = document.getElementById('res_id_asset').value;
                const dataInserita = document.getElementById('res_data').value;
                const id_pren = document.getElementById('res_id_prenotazione').value;

                const payload = id_pren ? { id_prenotazione: id_pren, nuova_data: dataInserita, nuovo_asset: id_asset } : { id_asset: id_asset, data: dataInserita };
                const action = id_pren ? 'update' : 'create';

                fetch('../PHP/api_prenotazioni.php?action=' + action, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                }).then(res => res.json()).then(async resp => {
                    if (resp.success) {
                        alert(resp.message);
                        closeReservationModal();
                        appState.currentDate = dataInserita;
                        const dateFilter = document.getElementById('map-date-filter');
                        if (dateFilter) dateFilter.value = dataInserita;
                        await reloadPrenotazioni();
                    } else { alert("Errore: " + resp.message); }
                }).catch(err => console.error(err));
            });
        }
    }

    window.openReservationModal = function(id_asset, asset_name, data_selezionata) {
        createReservationModal();
        document.getElementById('res-modal-title').innerText = "Nuova Prenotazione";
        document.getElementById('res_id_asset').value = id_asset; document.getElementById('res_asset_name').value = asset_name; document.getElementById('res_id_prenotazione').value = '';
        document.getElementById('res_data').value = data_selezionata;
        document.getElementById('reservation-modal').classList.add('active');
    };

    window.apriModaleModifica = function(id_prenotazione, id_asset, asset_name, data_attuale) {
        createReservationModal();
        document.getElementById('res-modal-title').innerText = "Modifica Data";
        document.getElementById('res_id_asset').value = id_asset; document.getElementById('res_asset_name').value = asset_name; document.getElementById('res_id_prenotazione').value = id_prenotazione;
        document.getElementById('res_data').value = data_attuale;
        document.getElementById('reservation-modal').classList.add('active');
    };

    window.closeReservationModal = function() {
        const modal = document.getElementById('reservation-modal');
        if (modal) modal.classList.remove('active');
    };

    window.annullaPrenotazione = function (id_prenotazione) {
        if (!confirm("Sei sicuro di voler annullare/revocare questa prenotazione?")) return;
        fetch('../PHP/api_prenotazioni.php?action=cancel', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_prenotazione: id_prenotazione })
        }).then(res => res.json()).then(async data => {
            if (data.success) await reloadPrenotazioni(); else alert("Errore: " + data.message);
        }).catch(err => console.error(err));
    };

    const btnViewDashboard = document.querySelector('.nav-link[data-target="view-dashboard"]');
    if (btnViewDashboard) btnViewDashboard.addEventListener('click', reloadPrenotazioni);
    const btnViewMappa = document.querySelector('.nav-link[data-target="view-mappa"]');
    if (btnViewMappa) btnViewMappa.addEventListener('click', reloadPrenotazioni);

    initData();
});