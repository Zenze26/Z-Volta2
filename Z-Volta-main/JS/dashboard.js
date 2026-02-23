document.addEventListener('DOMContentLoaded', () => {

    const styleFix = document.createElement('style');
    styleFix.innerHTML = `
        .assets-grid { display: flex !important; flex-wrap: wrap !important; gap: 10px !important; padding: 5px !important; overflow: hidden !important; }
        .assets-grid .asset-card { flex: 1 1 calc(25% - 15px) !important; min-width: 90px !important; box-sizing: border-box !important; }
        .map-control-group { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
        .btn-action-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer; margin-left: 5px; color: #fff; transition: 0.2s; font-size: 0.9rem; }
        .btn-mod-icon { background: var(--accent); } .btn-mod-icon:hover { background: #0056b3; transform: scale(1.1); }
        .btn-rev-icon { background: var(--danger, #dc3545); } .btn-rev-icon:hover { background: #b02a37; transform: scale(1.1); }
    `;
    document.head.appendChild(styleFix);

    let favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (!favicon) { favicon = document.createElement('link'); favicon.rel = 'icon'; document.head.appendChild(favicon); }
    favicon.href = '../assets/favicon.ico';

    const appState = {
        assets: [], prenotazioni: [], currentDate: new Date().toISOString().split('T')[0], currentLayer: 1, activeFilter: '', mapInitialized: false
    };

    const bgUfficio = `background-color: #1e293b; background-image: linear-gradient(rgba(255,255,255,0.03) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.03) 2px, transparent 2px), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px; background-position: -2px -2px, -2px -2px, -1px -1px, -1px -1px;`;
    const bgParcheggio = `background-color: #1a1c23; background-image: linear-gradient(90deg, rgba(255,255,255,0.3) 50%, transparent 50%), linear-gradient(0deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.4) 50%, transparent 50%), linear-gradient(0deg, transparent 48%, rgba(255,255,255,0.5) 48%, rgba(255,255,255,0.5) 50%, transparent 50%), repeating-linear-gradient(90deg, transparent 0%, transparent calc(10% - 2px), rgba(255,255,255,0.4) calc(10% - 2px), rgba(255,255,255,0.4) 10%); background-size: 15% 4px, 100% 100%, 100% 100%, 100% 50%; background-position: 0 75%, 0 0, 0 0, 0 0; background-repeat: repeat-x, no-repeat, no-repeat, no-repeat;`;

    function loadSidebarProfile() {
        fetch('../PHP/api_impostazioni.php?action=get_profile').then(res => res.json()).then(res => {
            const avatarDiv = document.querySelector('.profile-section .avatar');
            if (avatarDiv && res.success) {
                if (res.data.avatar) avatarDiv.innerHTML = `<img src="${res.data.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                else avatarDiv.innerHTML = `<i class="fas fa-user"></i>`;
            }
        });
    }
    loadSidebarProfile(); 

    const viewDashboard = document.getElementById('view-dashboard');
    if (viewDashboard) {
        const vecchiPannelli = viewDashboard.querySelectorAll('.admin-panel:not(#dashboard-res-preview)');
        vecchiPannelli.forEach(p => p.remove());
    }

    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view-section');

    function switchView(targetId) {
        views.forEach(view => view.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        const targetView = document.getElementById(targetId);
        const targetLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        if (targetView) targetView.classList.add('active');
        if (targetLink) targetLink.classList.add('active');
        if(targetId === 'view-impostazioni') renderImpostazioniComplete();
    }

    navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); switchView(link.getAttribute('data-target')); }); });
    window.vaiAPrenotazioni = function() { switchView('view-prenotazioni'); };

    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i'); const textSpan = toggleBtn.querySelector('span');
        function updateThemeUI(isLight) {
            if (isLight) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); textSpan.textContent = 'Dark Mode'; } 
            else { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); textSpan.textContent = 'Light Mode'; }
        }
        const savedTheme = localStorage.getItem('dashboard-theme');
        if (savedTheme) { body.setAttribute('data-theme', savedTheme); updateThemeUI(savedTheme === 'light'); }
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault(); const isCurrentlyLight = body.getAttribute('data-theme') === 'light';
            const newTheme = isCurrentlyLight ? 'dark' : 'light';
            body.setAttribute('data-theme', newTheme); localStorage.setItem('dashboard-theme', newTheme); updateThemeUI(!isCurrentlyLight);
        });
    }

    function syncGlobalFiltersUI() {
        const mapTypeSelect = document.getElementById('map-type-filter'); if (mapTypeSelect) mapTypeSelect.value = appState.activeFilter;
        const mapLayerSelect = document.getElementById('map-layer-filter'); if (mapLayerSelect) mapLayerSelect.value = appState.currentLayer.toString();
        const assetCards = document.querySelectorAll('.asset-card');
        assetCards.forEach(card => {
            card.style.border = 'none'; card.style.transform = 'scale(1)';
            if (appState.activeFilter && card.innerText.includes('Tipo ' + appState.activeFilter)) {
                card.style.border = '2px solid var(--accent)'; card.style.transform = 'scale(1.05)';
            }
        });
    }

    function initQuickFilters() {
        const assetCards = document.querySelectorAll('.asset-card');
        assetCards.forEach(card => {
            card.removeAttribute('onclick'); card.style.cursor = 'pointer'; card.style.transition = 'all 0.2s ease';
            card.addEventListener('click', () => {
                const text = card.innerText; let type = '';
                if (text.includes('Tipo A2')) type = 'A2'; else if (text.includes('Tipo A')) type = 'A';
                else if (text.includes('Tipo B')) type = 'B'; else if (text.includes('Tipo C')) type = 'C';

                if (appState.activeFilter === type) { appState.activeFilter = ''; } 
                else {
                    appState.activeFilter = type;
                    if (type === 'C') appState.currentLayer = 2; else if (['A', 'A2', 'B'].includes(type)) appState.currentLayer = 1;
                }
                syncGlobalFiltersUI(); updateMapState();
            });
        });
    }

    const btnViewUtenti = document.querySelector('.nav-link[data-target="view-utenti"]');
    if (btnViewUtenti) {
        btnViewUtenti.addEventListener('click', fetchUsers);
        const userFormHtml = document.getElementById('user-form');
        if (userFormHtml && !document.getElementById('modal-avatar-container')) {
            userFormHtml.setAttribute('enctype', 'multipart/form-data');
            const avatarSection = document.createElement('div');
            avatarSection.id = 'modal-avatar-container';
            avatarSection.style.display = 'flex'; avatarSection.style.alignItems = 'center'; avatarSection.style.gap = '15px'; avatarSection.style.marginBottom = '15px';
            avatarSection.innerHTML = `
                <div id="modal-avatar-preview" style="width:50px; height:50px; border-radius:50%; background:var(--map-bg); overflow:hidden; border:2px solid var(--accent); display:flex; justify-content:center; align-items:center; color:var(--text-main); font-size: 1.2rem;">
                    <i class="fas fa-user"></i>
                </div>
                <div class="form-group" style="flex:1; margin:0;">
                    <label style="font-size:0.8rem;">Carica/Modifica Foto Profilo</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="file" name="avatar" id="modal-avatar-input" accept="image/png, image/jpeg, image/gif" style="background:none; border:none; padding:0; cursor:pointer;" onchange="document.getElementById('remove_user_avatar_flag').value = 'false';">
                        <button type="button" class="btn-action-icon btn-rev-icon" title="Rimuovi Foto" onclick="document.getElementById('modal-avatar-preview').innerHTML = '<i class=\\'fas fa-user\\'></i>'; document.getElementById('remove_user_avatar_flag').value = 'true'; document.getElementById('modal-avatar-input').value = '';"><i class="fas fa-trash"></i></button>
                    </div>
                    <input type="hidden" name="remove_avatar" id="remove_user_avatar_flag" value="false">
                </div>
            `;
            userFormHtml.insertBefore(avatarSection, userFormHtml.firstChild);
        }
    }

    function fetchUsers() {
        fetch('../PHP/api_utenti.php').then(res => res.json()).then(data => {
            const tbody = document.querySelector('#users-table tbody');
            if(!tbody) return; tbody.innerHTML = ''; 
            data.forEach(user => {
                const tr = document.createElement('tr');
                const avatarHtml = user.avatar ? `<img src="${user.avatar}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border: 1px solid var(--accent);">` : `<div style="width:30px; height:30px; border-radius:50%; background:var(--glass-border); display:flex; align-items:center; justify-content:center; font-size:0.8rem;"><i class="fas fa-user"></i></div>`;
                tr.innerHTML = `
                    <td>${user.ID_Utente}</td>
                    <td><div style="display:flex; align-items:center; gap:10px;">${avatarHtml}<div style="font-weight:bold;">${user.Cognome} ${user.Nome}</div></div></td>
                    <td>${user.Username}</td>
                    <td><span style="font-size:10px; padding:2px 6px; border:1px solid var(--accent); border-radius:4px; text-transform:uppercase;">${user.Ruolo}</span></td>
                    <td>${user.ID_Team || '-'}</td>
                    <td class="text-right">
                        <button class="btn-action-icon btn-mod-icon" title="Modifica" onclick="editUser(${user.ID_Utente}, '${user.Nome}', '${user.Cognome}', '${user.Username}', '${user.Ruolo}', '${user.ID_Team || ''}', '${user.avatar || ''}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-action-icon btn-rev-icon" title="Elimina" onclick="deleteUser(${user.ID_Utente})"><i class="fas fa-trash"></i></button>
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
            fetch('../PHP/api_utenti.php', { method: 'POST', body: new FormData(this) }).then(res => res.json()).then(data => {
                if (data.success) { closeUserModal(); fetchUsers(); } else alert('Errore: ' + data.message);
            });
        });
    }

    window.openUserModal = function () { 
        document.getElementById('user-form').reset(); document.getElementById('user_id').value = ''; document.getElementById('modal-title').textContent = 'Nuovo Utente'; 
        const prev = document.getElementById('modal-avatar-preview'); if(prev) prev.innerHTML = '<i class="fas fa-user"></i>';
        const flag = document.getElementById('remove_user_avatar_flag'); if(flag) flag.value = 'false';
        document.getElementById('user-modal').classList.add('active'); 
    };
    window.closeUserModal = function () { document.getElementById('user-modal').classList.remove('active'); };
    
    window.editUser = function (id, n, c, u, r, t, avatar) { 
        document.getElementById('user_id').value = id; document.getElementById('nome').value = n; 
        document.getElementById('cognome').value = c; document.getElementById('username').value = u; 
        document.getElementById('ruolo').value = r; document.getElementById('id_team').value = t; 
        document.getElementById('modal-title').textContent = 'Modifica Utente'; 
        const flag = document.getElementById('remove_user_avatar_flag'); if(flag) flag.value = 'false';
        const prev = document.getElementById('modal-avatar-preview');
        if(prev) {
            if(avatar && avatar !== 'undefined' && avatar !== '') { prev.innerHTML = `<img src="${avatar}" style="width:100%; height:100%; object-fit:cover;">`; } 
            else { prev.innerHTML = '<i class="fas fa-user"></i>'; }
        }
        document.getElementById('user-modal').classList.add('active'); 
    };
    
    window.deleteUser = function (id) { if (!confirm('Eliminare utente?')) return; fetch('../PHP/api_utenti.php', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id}) }).then(res => res.json()).then(data => { if(data.success) fetchUsers(); else alert(data.message); }); };

    // --- IMPOSTAZIONI DINAMICHE (Profilo + Sistema con Bottoni Intelligenti) ---
    function renderImpostazioniComplete() {
        const impContainer = document.getElementById('view-impostazioni');
        if (!impContainer) return;
        impContainer.innerHTML = `<div class="settings-grid" id="settings-grid-wrapper"></div>`;
        const wrapper = document.getElementById('settings-grid-wrapper');

        Promise.all([
            fetch('../PHP/api_impostazioni.php?action=get_profile').then(r => r.json()),
            fetch('../PHP/api_impostazioni.php?action=get_config').then(r => r.json())
        ]).then(([profRes, confRes]) => {
            
            if (profRes.success) {
                const p = profRes.data;
                const profileBox = document.createElement('div');
                profileBox.className = 'glass-box';
                profileBox.innerHTML = `
                    <div class="section-title"><i class="fas fa-id-badge"></i> Gestione Profilo</div>
                    <form id="full-profile-form" enctype="multipart/form-data">
                        <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                            <div id="my-avatar-preview" style="width:60px; height:60px; border-radius:50%; background:var(--map-bg); overflow:hidden; border:2px solid var(--accent); display:flex; justify-content:center; align-items:center; font-size: 1.5rem; color: var(--text-main);">
                                ${p.avatar ? `<img src="${p.avatar}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user"></i>`}
                            </div>
                            <div class="form-group" style="flex:1; margin:0;">
                                <label>Carica/Modifica Foto Profilo</label>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <input type="file" name="avatar" id="my-avatar-input" accept="image/png, image/jpeg, image/gif" style="background:none; border:none; padding:0; cursor:pointer;" onchange="document.getElementById('remove_my_avatar_flag').value = 'false';">
                                    <button type="button" class="btn-action-icon btn-rev-icon" title="Rimuovi Foto" onclick="document.getElementById('my-avatar-preview').innerHTML = '<i class=\\'fas fa-user\\'></i>'; document.getElementById('remove_my_avatar_flag').value = 'true'; document.getElementById('my-avatar-input').value = '';"><i class="fas fa-trash"></i></button>
                                </div>
                                <input type="hidden" name="remove_avatar" id="remove_my_avatar_flag" value="false">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Nome</label><input type="text" name="nome" value="${p.Nome}" required></div>
                            <div class="form-group"><label>Cognome</label><input type="text" name="cognome" value="${p.Cognome}" required></div>
                        </div>
                        <div class="form-group"><label>Username</label><input type="text" name="username" value="${p.Username}" required></div>
                        <hr style="border-color:var(--glass-border); margin:15px 0;">
                        <div class="section-title" style="font-size:0.9rem;"><i class="fas fa-lock"></i> Modifica Password (Opzionale)</div>
                        <div class="form-group"><label>Nuova Password</label><input type="password" name="new_password" placeholder="Lascia vuoto per non cambiare"></div>
                        <div class="modal-footer" style="border:none; padding:0; margin-top:15px;"><button type="submit" class="btn-action btn-mod">Salva Dati Profilo</button></div>
                    </form>
                `;
                wrapper.appendChild(profileBox);

                document.getElementById('full-profile-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    fetch('../PHP/api_impostazioni.php?action=update_profile', {
                        method: 'POST', body: new FormData(e.target)
                    }).then(res => res.json()).then(resp => {
                        alert(resp.message);
                        if(resp.success) {
                            const data = Object.fromEntries(new FormData(e.target).entries());
                            const userNameEl = document.querySelector('.user-name');
                            if(userNameEl) userNameEl.innerText = `${data.nome} ${data.cognome}`;
                            loadSidebarProfile();
                        }
                    });
                });
            }

            if (confRes && !confRes.error && confRes.manutenzione_mode !== undefined) {
                const configBox = document.createElement('div');
                configBox.className = 'glass-box';
                configBox.innerHTML = `
                    <div class="section-title"><i class="fas fa-sliders-h"></i> Impostazioni Sistema</div>
                    <form id="global-config-form">
                        <div class="setting-item" id="maint-box" style="padding:10px; border-radius:8px; border:1px solid var(--glass-border); transition: 0.3s;">
                            <div>
                                <div class="setting-label" id="maint-label" style="font-weight:bold;">Modalità Manutenzione</div>
                                <div class="setting-desc" style="font-size:0.75rem;">Blocca tutte le prenotazioni del sistema.</div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="conf_manutenzione" ${confRes.manutenzione_mode === '1' ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <hr style="border-color:var(--glass-border); margin:15px 0;">
                        <div class="form-row">
                            <div class="form-group"><label>Ora Apertura</label><input type="time" id="conf_apertura" value="${confRes.ora_apertura}"></div>
                            <div class="form-group"><label>Ora Chiusura</label><input type="time" id="conf_chiusura" value="${confRes.ora_chiusura}"></div>
                        </div>
                        <div class="modal-footer" style="border:none; padding:0; margin-top:15px;">
                            <button type="submit" id="btn-salva-sistema" class="btn-action btn-mod" style="transition:0.3s;">Salva Configurazione</button>
                        </div>
                    </form>
                `;
                wrapper.appendChild(configBox);

                // --- BOTTONE DINAMICO MANUTENZIONE ---
                const chkMaint = document.getElementById('conf_manutenzione');
                const btnMaint = document.getElementById('btn-salva-sistema');
                const boxMaint = document.getElementById('maint-box');
                const lblMaint = document.getElementById('maint-label');

                const updateBtnColor = () => {
                    if(chkMaint.checked) {
                        btnMaint.style.backgroundColor = 'var(--danger)';
                        btnMaint.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Applica Manutenzione';
                        boxMaint.style.borderColor = 'var(--danger)';
                        boxMaint.style.background = 'rgba(220,53,69,0.1)';
                        lblMaint.style.color = 'var(--danger)';
                    } else {
                        btnMaint.style.backgroundColor = 'var(--accent)';
                        btnMaint.innerHTML = 'Salva Configurazione';
                        boxMaint.style.borderColor = 'var(--glass-border)';
                        boxMaint.style.background = 'transparent';
                        lblMaint.style.color = 'var(--text-main)';
                    }
                };
                chkMaint.addEventListener('change', updateBtnColor);
                updateBtnColor(); // Esegue al caricamento per settare il colore giusto

                document.getElementById('global-config-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const payload = {
                        manutenzione_mode: document.getElementById('conf_manutenzione').checked,
                        ora_apertura: document.getElementById('conf_apertura').value,
                        ora_chiusura: document.getElementById('conf_chiusura').value
                    };
                    fetch('../PHP/api_impostazioni.php?action=update_config', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    }).then(res => res.json()).then(resp => {
                        if (resp.success) alert("Impostazioni salvate con successo."); else alert(resp.message);
                    });
                });
            }
        });
    }

    // ==========================================
    // 5. MOTORE MAPPA E PRENOTAZIONI
    // ==========================================

    function initData() {
        initQuickFilters();
        Promise.all([
            fetch('../PHP/api_assets.php').then(res => res.json()),
            fetch('../PHP/api_prenotazioni.php?action=list').then(res => res.json())
        ]).then(([assetsRes, prenRes]) => {
            if (assetsRes.success) {
                appState.assets = assetsRes.data.map(asset => {
                    const num = parseInt(asset.Codice_Univoco.split('-')[1]);
                    if (asset.Tipologia === 'C') { asset.Coordinate_X = (num * 10) - 5; asset.Coordinate_Y = 25; } 
                    else if (asset.Tipologia === 'B') { asset.Coordinate_X = 15 + ((num - 1) % 5) * 17.5; asset.Coordinate_Y = 15; } 
                    else if (asset.Tipologia === 'A') { let fila = num <= 10 ? 0 : 1; let posInFila = num <= 10 ? num : num - 10; asset.Coordinate_X = 10 + (posInFila - 1) * 8.8; asset.Coordinate_Y = 45 + (fila * 15); } 
                    else if (asset.Tipologia === 'A2') { asset.Coordinate_X = 20 + ((num - 1) % 5) * 15; asset.Coordinate_Y = 85; }
                    return asset;
                });
            }
            if (prenRes.success) appState.prenotazioni = prenRes.data;
            
            buildMapDOM();
            renderTabellaPrenotazioni();
            renderDashboardReservationsPreview();
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
                renderDashboardReservationsPreview();
                updateMapState();
            }
        } catch (error) { console.error(error); }
    }

    function renderStatusSummary() {
        const colLeft = document.querySelector('.column-box');
        if (!colLeft) return;
        let statusBox = document.getElementById('occupancy-status-box');
        if (!statusBox) {
            statusBox = document.createElement('div');
            statusBox.id = 'occupancy-status-box';
            statusBox.style.marginTop = '20px';
            statusBox.style.padding = '15px';
            statusBox.style.background = 'rgba(255,255,255,0.05)';
            statusBox.style.borderRadius = '10px';
            statusBox.style.border = '1px solid var(--glass-border)';
            colLeft.appendChild(statusBox);
        }

        const oggi = new Date().toISOString().split('T')[0];
        const prenOggi = appState.prenotazioni.filter(p => p.Stato === 'Attiva' && p.Data_Prenotazione === oggi);
        let filteredAssets = appState.assets;
        if (appState.activeFilter) filteredAssets = appState.assets.filter(a => a.Tipologia === appState.activeFilter);
        const prenFiltrate = appState.activeFilter ? prenOggi.filter(p => p.Tipologia === appState.activeFilter) : prenOggi;
        const totalAssets = filteredAssets.length;
        const perc = totalAssets > 0 ? Math.round((prenFiltrate.length / totalAssets) * 100) : 0;

        statusBox.innerHTML = `
            <div class="section-title" style="font-size: 0.9rem; margin-bottom: 10px;">
                <i class="fas fa-chart-pie"></i> Occupazione Oggi ${appState.activeFilter ? '(Tipo '+appState.activeFilter+')' : ''}
            </div>
            <div style="margin-bottom: 5px; display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span>${prenFiltrate.length} su ${totalAssets} occupati</span><span>${perc}%</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 15px;">
                <div style="width: ${perc}%; height: 100%; background: var(--accent); transition: width 0.5s ease;"></div>
            </div>
        `;
    }

    function renderDashboardReservationsPreview() {
        const viewDashboard = document.getElementById('view-dashboard');
        if (!viewDashboard) return;
        let previewContainer = document.getElementById('dashboard-res-preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'dashboard-res-preview'; previewContainer.className = 'glass-box admin-panel';
            previewContainer.style.marginTop = '20px';
            const topRow = viewDashboard.querySelector('.top-row');
            if (topRow) topRow.after(previewContainer); else viewDashboard.appendChild(previewContainer);
        }
        const prenotazioniAttive = appState.prenotazioni.filter(p => p.Stato === 'Attiva');
        const previewList = prenotazioniAttive.slice(0, 5);

        let html = `
            <div class="admin-header"><div class="section-title"><i class="fas fa-calendar-check"></i> Le tue Prossime Prenotazioni</div></div>
            <div class="table-scroll"><table><thead><tr><th>Utente</th><th>Risorsa</th><th>Data</th><th>Stato</th></tr></thead><tbody>
        `;
        if (previewList.length === 0) {
            html += `<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-dim);">Nessuna prenotazione attiva. Vai sulla mappa!</td></tr>`;
        } else {
            previewList.forEach(p => {
                const avatarHtml = p.avatar ? `<img src="${p.avatar}" style="width:24px; height:24px; border-radius:50%; object-fit:cover; margin-right:8px; border:1px solid var(--accent);">` : `<i class="fas fa-user" style="color:var(--accent); margin-right:8px;"></i>`;
                html += `
                    <tr style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'" onclick="vaiAPrenotazioni()">
                        <td><div style="display:flex; align-items:center;">${avatarHtml} ${p.Cognome} ${p.Nome}</div></td>
                        <td><strong>${p.Tipologia}</strong> - ${p.Codice_Univoco}</td><td>${p.Data_Prenotazione}</td><td class="status-active">${p.Stato}</td>
                    </tr>`;
            });
        }
        html += `</tbody></table></div>`;
        previewContainer.innerHTML = html;
    }

    function renderMiniMap() {
        const container = document.getElementById('mini-map-trigger');
        if (!container) return;

        let layerToShow = appState.currentLayer;
        container.innerHTML = ''; 
        container.style.position = 'relative'; container.style.width = '100%'; container.style.height = '250px';
        container.style.borderRadius = '8px'; container.style.border = '1px solid var(--glass-border)';
        container.style.overflow = 'hidden'; container.style.cursor = 'pointer';
        container.style.cssText += layerToShow === 1 ? bgUfficio : bgParcheggio;

        if (layerToShow === 1) {
            const openSpaceArea = document.createElement('div');
            openSpaceArea.style.position = 'absolute'; openSpaceArea.style.top = '35%'; openSpaceArea.style.left = '0';
            openSpaceArea.style.width = '100%'; openSpaceArea.style.height = '40%'; openSpaceArea.style.background = 'rgba(255,255,255,0.02)';
            openSpaceArea.style.borderTop = '1px dashed rgba(255,255,255,0.1)'; openSpaceArea.style.borderBottom = '1px dashed rgba(255,255,255,0.1)';
            container.appendChild(openSpaceArea);
        }

        const mapArea = document.createElement('div');
        mapArea.style.position = 'relative'; mapArea.style.width = '100%'; mapArea.style.height = '100%';

        appState.assets.forEach(asset => {
            if (asset.ID_Mappa != layerToShow) return;
            if (appState.activeFilter && asset.Tipologia !== appState.activeFilter) return;

            const isOccupied = appState.prenotazioni.some(p => p.Stato === 'Attiva' && p.Data_Prenotazione === appState.currentDate && Number(p.ID_Asset) === Number(asset.ID_Asset));

            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.left = asset.Coordinate_X + '%';
            dot.style.top = asset.Coordinate_Y + '%';
            dot.style.transform = 'translate(-50%, -50%)'; dot.style.display = 'flex'; dot.style.alignItems = 'center'; dot.style.justifyContent = 'center';
            dot.style.color = '#fff'; dot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';

            let iconClass = 'fa-chair'; 
            if (asset.Tipologia === 'A' || asset.Tipologia === 'A2') {
                iconClass = asset.Tipologia === 'A' ? 'fa-chair' : 'fa-desktop';
                dot.style.width = '28px'; dot.style.height = '28px'; dot.style.borderRadius = '6px';
            } else if (asset.Tipologia === 'B') {
                iconClass = 'fa-users'; dot.style.width = '36px'; dot.style.height = '36px'; dot.style.borderRadius = '50%';
            } else if (asset.Tipologia === 'C') {
                iconClass = 'fa-car'; dot.style.width = '42px'; dot.style.height = '26px'; 
                dot.style.borderRadius = '3px'; dot.style.border = '1px dashed rgba(255,255,255,0.8)';
            }

            dot.style.backgroundColor = isOccupied ? 'var(--danger, #dc3545)' : 'var(--success, #28a745)';
            dot.innerHTML = `<i class="fas ${iconClass}" style="font-size: 0.9rem;"></i>`;

            mapArea.appendChild(dot);
        });

        container.appendChild(mapArea);
        container.onclick = () => { switchView('view-mappa'); };
    }

    function buildMapDOM() {
        if (appState.mapInitialized) return; 
        const headerMappa = document.querySelector('#view-mappa .admin-header');
        const mapContainer = document.querySelector('#view-mappa .map-wrapper');
        if (!mapContainer || !headerMappa) return;

        const controlliMappa = document.createElement('div');
        controlliMappa.className = 'map-controls-container';
        // FILTRI SPOSTATI A DESTRA
        controlliMappa.style.display = 'flex'; 
        controlliMappa.style.gap = '20px'; 
        controlliMappa.style.marginTop = '15px'; 
        controlliMappa.style.alignItems = 'flex-end'; 
        controlliMappa.style.flexWrap = 'wrap'; 
        controlliMappa.style.width = '100%';
        controlliMappa.style.justifyContent = 'flex-end';

        const oggi = new Date().toISOString().split('T')[0];

        // ALLINEAMENTO PERFETTO: Label dritta sopra, input senza onkeydown
        controlliMappa.innerHTML = `
            <div class="map-control-group">
                <label style="font-weight:bold; font-size:0.8rem; color:var(--text-dim);">Data Selezione</label>
                <input type="date" id="map-date-filter" value="${appState.currentDate}" min="${oggi}" 
                       style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--glass-border); background-color: var(--bg-main); color: var(--text-main); cursor: pointer; outline: none;">
            </div>
            <div class="map-control-group">
                <label style="font-weight:bold; font-size:0.8rem; color:var(--text-dim);">Piano Sede</label>
                <select id="map-layer-filter" style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--glass-border); background-color: var(--bg-main); color: var(--text-main); cursor: pointer; outline: none;">
                    <option value="1">Uffici (Piano Terra)</option>
                    <option value="2">Garage (Sotterraneo)</option>
                </select>
            </div>
            <div class="map-control-group">
                <label style="font-weight:bold; font-size:0.8rem; color:var(--text-dim);">Filtra per Tipo</label>
                <select id="map-type-filter" style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--glass-border); background-color: var(--bg-main); color: var(--text-main); cursor: pointer; outline: none;">
                    <option value="">Mostra tutte le risorse</option>
                    <option value="A">Scrivania Std (Tipo A)</option>
                    <option value="A2">Scrivania + Monitor (Tipo A2)</option>
                    <option value="B">Sala Riunioni (Tipo B)</option>
                    <option value="C">Posto Auto (Tipo C)</option>
                </select>
            </div>
        `;
        headerMappa.appendChild(controlliMappa);

        document.getElementById('map-date-filter').addEventListener('change', (e) => { appState.currentDate = e.target.value; updateMapState(); });
        
        document.getElementById('map-layer-filter').addEventListener('change', (e) => { 
            appState.currentLayer = parseInt(e.target.value); 
            if (appState.currentLayer === 2) { appState.activeFilter = 'C'; } 
            else if (appState.currentLayer === 1 && appState.activeFilter === 'C') { appState.activeFilter = ''; }
            syncGlobalFiltersUI(); updateMapState(); 
        });

        document.getElementById('map-type-filter').addEventListener('change', (e) => { 
            appState.activeFilter = e.target.value; 
            if (appState.activeFilter === 'C') appState.currentLayer = 2;
            else if (['A', 'A2', 'B'].includes(appState.activeFilter)) appState.currentLayer = 1;
            syncGlobalFiltersUI(); updateMapState(); 
        });

        let mapArea = document.getElementById('map-area');
        if(!mapArea) {
            mapArea = document.createElement('div');
            mapArea.id = 'map-area';
            mapArea.style.position = 'relative'; mapArea.style.width = '100%'; mapArea.style.height = '600px'; 
            mapArea.style.border = '2px solid var(--glass-border)'; mapArea.style.borderRadius = '10px'; mapArea.style.overflow = 'hidden';
            mapContainer.appendChild(mapArea);
        }

        const layerUfficio = document.createElement('div'); layerUfficio.id = 'layer-1'; layerUfficio.style.width = '100%'; layerUfficio.style.height = '100%'; layerUfficio.style.position = 'absolute';
        layerUfficio.style.cssText += bgUfficio;
        const meetingArea = document.createElement('div'); meetingArea.style.position = 'absolute'; meetingArea.style.top = '0'; meetingArea.style.left = '0'; meetingArea.style.width = '100%'; meetingArea.style.height = '30%'; meetingArea.style.background = 'rgba(255, 255, 255, 0.03)'; meetingArea.style.borderBottom = '2px dashed rgba(255,255,255,0.1)'; meetingArea.innerHTML = '<div style="position:absolute; top:10px; left:10px; color:rgba(255,255,255,0.3); font-size:12px; font-weight:bold; letter-spacing:1px;">AREA MEETING</div>'; layerUfficio.appendChild(meetingArea);
        const openSpaceArea = document.createElement('div'); openSpaceArea.style.position = 'absolute'; openSpaceArea.style.top = '30%'; openSpaceArea.style.left = '0'; openSpaceArea.style.width = '100%'; openSpaceArea.style.height = '45%'; openSpaceArea.innerHTML = '<div style="position:absolute; top:10px; left:10px; color:rgba(255,255,255,0.3); font-size:12px; font-weight:bold; letter-spacing:1px;">OPEN SPACE (TIPO A)</div>'; layerUfficio.appendChild(openSpaceArea);
        const execArea = document.createElement('div'); execArea.style.position = 'absolute'; execArea.style.bottom = '0'; execArea.style.left = '0'; execArea.style.width = '100%'; execArea.style.height = '25%'; execArea.style.background = 'rgba(255, 255, 255, 0.02)'; execArea.style.borderTop = '2px dashed rgba(255,255,255,0.1)'; execArea.innerHTML = '<div style="position:absolute; top:10px; left:10px; color:rgba(255,255,255,0.3); font-size:12px; font-weight:bold; letter-spacing:1px;">AREA EXECUTIVE (TIPO A2)</div>'; layerUfficio.appendChild(execArea);

        const layerParcheggio = document.createElement('div'); layerParcheggio.id = 'layer-2'; layerParcheggio.style.width = '100%'; layerParcheggio.style.height = '100%'; layerParcheggio.style.position = 'absolute'; layerParcheggio.style.display = 'none';
        layerParcheggio.style.cssText += bgParcheggio;

        appState.assets.forEach(asset => {
            const div = document.createElement('div');
            div.id = `asset-${asset.Codice_Univoco}`;
            div.className = 'desk d-free'; 
            div.style.position = 'absolute'; div.style.left = asset.Coordinate_X + '%'; div.style.top = asset.Coordinate_Y + '%';
            div.style.display = 'flex'; div.style.flexDirection = 'column'; div.style.alignItems = 'center'; div.style.justifyContent = 'center';
            div.style.cursor = 'pointer'; div.style.color = '#fff'; div.style.boxShadow = '0 6px 10px rgba(0,0,0,0.4)'; div.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            div.style.transform = 'translate(-50%, -50%)';

            div.addEventListener('mouseenter', () => div.style.transform = 'translate(-50%, -50%) scale(1.15)');
            div.addEventListener('mouseleave', () => div.style.transform = 'translate(-50%, -50%) scale(1)');

            let iconClass = 'fa-chair'; 
            if (asset.Tipologia === 'A' || asset.Tipologia === 'A2') { iconClass = asset.Tipologia === 'A' ? 'fa-chair' : 'fa-desktop'; div.style.width = '55px'; div.style.height = '55px'; div.style.borderRadius = '8px'; } 
            else if (asset.Tipologia === 'B') { iconClass = 'fa-users'; div.style.width = '70px'; div.style.height = '70px'; div.style.borderRadius = '50%'; } 
            else if (asset.Tipologia === 'C') { iconClass = 'fa-car'; div.style.width = '50px'; div.style.height = '80px'; div.style.borderRadius = '4px'; div.style.border = '2px dashed rgba(255,255,255,0.8)'; }

            const numAsset = asset.Codice_Univoco.split('-')[1];
            div.innerHTML = `<i class="fas ${iconClass}" style="font-size: 1.4rem; margin-bottom: 4px;"></i><span style="font-size: 0.7rem; font-weight: bold; background: rgba(0,0,0,0.5); padding: 2px 5px; border-radius: 4px;">${numAsset}</span>`;
            
            div.addEventListener('click', () => {
                if (div.classList.contains('d-busy')) alert("Questo asset è già occupato per la data selezionata.");
                else openReservationModal(asset.ID_Asset, `${asset.Tipologia} - ${asset.Codice_Univoco}`, appState.currentDate);
            });

            if(asset.ID_Mappa == 1) layerUfficio.appendChild(div); else layerParcheggio.appendChild(div);
        });

        mapArea.appendChild(layerUfficio);
        mapArea.appendChild(layerParcheggio);
        appState.mapInitialized = true;
    }

    function updateMapState() {
        if (!appState.mapInitialized) return;
        document.getElementById('layer-1').style.display = (appState.currentLayer === 1) ? 'block' : 'none';
        document.getElementById('layer-2').style.display = (appState.currentLayer === 2) ? 'block' : 'none';

        appState.assets.forEach(asset => {
            const el = document.getElementById(`asset-${asset.Codice_Univoco}`);
            if (el) {
                if (appState.activeFilter && asset.Tipologia !== appState.activeFilter) { el.style.opacity = '0.1'; el.style.pointerEvents = 'none'; } 
                else { el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }

                el.classList.remove('d-busy'); el.classList.add('d-free');
                if(asset.Tipologia === 'C') { el.style.setProperty('background-color', '#4b5563', 'important'); el.style.border = '2px dashed rgba(255,255,255,0.7)'; } 
                else { el.style.setProperty('background-color', '#059669', 'important'); el.style.border = '1px solid rgba(255,255,255,0.2)'; }
            }
        });

        const prenGiorno = appState.prenotazioni.filter(p => p.Stato === 'Attiva' && p.Data_Prenotazione === appState.currentDate);
        prenGiorno.forEach(p => {
            const el = document.getElementById(`asset-${p.Codice_Univoco}`);
            if (el && el.style.opacity === '1') {
                el.classList.remove('d-free'); el.classList.add('d-busy');
                el.style.setProperty('background-color', '#dc2626', 'important'); 
                if(p.Tipologia === 'C') el.style.border = '2px solid rgba(255,255,255,0.9)';
            }
        });
        renderMiniMap(); renderStatusSummary(); 
    }

    function renderTabellaPrenotazioni() {
        const tbody = document.querySelector('#table-prenotazioni-body');
        if (!tbody) return; tbody.innerHTML = ''; 
        const prenAttive = appState.prenotazioni.filter(p => p.Stato === 'Attiva');
        if (prenAttive.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nessuna prenotazione attiva.</td></tr>'; return; }
        
        prenAttive.forEach(p => {
            let actionButtons = '';
            if (parseInt(p.Contatore_Modifiche) < 2) { 
                actionButtons += `<button class="btn-action-icon btn-mod-icon" title="Modifica Data" onclick="apriModaleModifica(${p.ID_Prenotazione}, ${p.ID_Asset}, '${p.Tipologia} - ${p.Codice_Univoco}', '${p.Data_Prenotazione}')"><i class="fas fa-edit"></i></button> `; 
            }
            actionButtons += `<button class="btn-action-icon btn-rev-icon" title="Annulla Prenotazione" onclick="annullaPrenotazione(${p.ID_Prenotazione})"><i class="fas fa-times"></i></button>`;
            
            const avatarHtml = p.avatar ? `<img src="${p.avatar}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border: 1px solid var(--accent);">` : `<div style="width:30px; height:30px; border-radius:50%; background:var(--glass-border); display:flex; align-items:center; justify-content:center; font-size:0.8rem;"><i class="fas fa-user"></i></div>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div style="display:flex; align-items:center; gap:10px;">${avatarHtml} <span>${p.Cognome} ${p.Nome}</span></div></td>
                <td><strong style="color:var(--accent);">${p.Tipologia}</strong> - ${p.Codice_Univoco}</td>
                <td>${p.Data_Prenotazione}</td>
                <td class="status-active">${p.Stato}</td>
                <td class="text-right">${actionButtons}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function createReservationModal() {
        let modal = document.getElementById('reservation-modal');
        if (!modal) {
            modal = document.createElement('div'); modal.id = 'reservation-modal'; modal.className = 'modal-overlay';
            const oggi = new Date().toISOString().split('T')[0];
            modal.innerHTML = `
                <div class="glass-box modal-content">
                    <div class="modal-header"><h3 id="res-modal-title">Prenota Risorsa</h3><button type="button" class="close-modal" onclick="closeReservationModal()">&times;</button></div>
                    <form id="reservation-form">
                        <input type="hidden" id="res_id_asset" name="id_asset"><input type="hidden" id="res_id_prenotazione" name="id_prenotazione">
                        <div class="form-group"><label>Risorsa</label><input type="text" id="res_asset_name" readonly style="background-color: var(--bg-main); cursor: not-allowed; border: 1px solid var(--glass-border); padding: 10px; border-radius: 5px; width: 100%; color: var(--text-main); font-weight:bold;"></div>
                        <div class="form-row" style="display:flex; gap:10px; margin-top:15px;">
                            <div style="flex:1;"><label id="label_data_inizio">Data Inizio</label><input type="date" id="res_data_inizio" required min="${oggi}" style="padding: 10px; border-radius: 5px; border: 1px solid var(--glass-border); background-color: var(--bg-main); color: var(--text-main); width: 100%; cursor:pointer;"></div>
                            <div style="flex:1;" id="box_data_fine"><label>Data Fine (Max 30 gg)</label><input type="date" id="res_data_fine" min="${oggi}" style="padding: 10px; border-radius: 5px; border: 1px solid var(--glass-border); background-color: var(--bg-main); color: var(--text-main); width: 100%; cursor:pointer;"></div>
                        </div>
                        <div class="modal-footer" style="margin-top: 20px;"><button type="button" class="btn-action btn-rev" style="background:var(--danger);" onclick="closeReservationModal()">Annulla</button><button type="submit" class="btn-action btn-mod">Conferma Salva</button></div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('reservation-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const id_asset = document.getElementById('res_id_asset').value;
                const dataInizio = document.getElementById('res_data_inizio').value;
                const dataFine = document.getElementById('res_data_fine').value;
                const id_pren = document.getElementById('res_id_prenotazione').value;
                const payload = id_pren ? { id_prenotazione: id_pren, nuova_data: dataInizio, nuovo_asset: id_asset } : { id_asset: id_asset, data_inizio: dataInizio, data_fine: dataFine };
                const action = id_pren ? 'update' : 'create';
                fetch('../PHP/api_prenotazioni.php?action=' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                .then(res => res.json()).then(async resp => {
                    if (resp.success) { alert(resp.message); closeReservationModal(); appState.currentDate = dataInizio; const dateFilter = document.getElementById('map-date-filter'); if (dateFilter) dateFilter.value = dataInizio; await reloadPrenotazioni(); } 
                    else { alert("Attenzione: " + resp.message); }
                }).catch(err => console.error(err));
            });
        }
    }

    window.openReservationModal = function(id_asset, asset_name, data_selezionata) {
        createReservationModal(); document.getElementById('res-modal-title').innerText = "Nuova Prenotazione"; document.getElementById('res_id_asset').value = id_asset; document.getElementById('res_asset_name').value = asset_name; document.getElementById('res_id_prenotazione').value = ''; document.getElementById('res_data_inizio').value = data_selezionata; document.getElementById('res_data_fine').value = data_selezionata; document.getElementById('label_data_inizio').innerText = "Data Inizio"; document.getElementById('box_data_fine').style.display = 'block'; document.getElementById('res_data_fine').required = true; document.getElementById('reservation-modal').classList.add('active');
    };
    window.apriModaleModifica = function(id_prenotazione, id_asset, asset_name, data_attuale) {
        createReservationModal(); document.getElementById('res-modal-title').innerText = "Sposta Data (Singolo Giorno)"; document.getElementById('res_id_asset').value = id_asset; document.getElementById('res_asset_name').value = asset_name; document.getElementById('res_id_prenotazione').value = id_prenotazione; document.getElementById('res_data_inizio').value = data_attuale; document.getElementById('label_data_inizio').innerText = "Nuova Data"; document.getElementById('box_data_fine').style.display = 'none'; document.getElementById('res_data_fine').required = false; document.getElementById('reservation-modal').classList.add('active');
    };
    window.closeReservationModal = function() { const modal = document.getElementById('reservation-modal'); if (modal) modal.classList.remove('active'); };
    window.annullaPrenotazione = function (id_prenotazione) {
        if (!confirm("Sei sicuro di voler annullare questa prenotazione?")) return;
        fetch('../PHP/api_prenotazioni.php?action=cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_prenotazione: id_prenotazione }) }).then(res => res.json()).then(async data => { if (data.success) await reloadPrenotazioni(); else alert("Errore: " + data.message); }).catch(err => console.error(err));
    };

    initData();
});