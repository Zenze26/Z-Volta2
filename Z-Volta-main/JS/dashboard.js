document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GESTIONE NAVIGAZIONE (SPA) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view-section');

    function switchView(targetId) {
        // Nascondi tutte le viste
        views.forEach(view => view.classList.remove('active'));

        // Rimuovi classe active dai link
        navLinks.forEach(link => link.classList.remove('active'));

        // Attiva vista e link corretto
        const targetView = document.getElementById(targetId);
        const targetLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);

        if (targetView) targetView.classList.add('active');
        if (targetLink) targetLink.classList.add('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            switchView(targetId);
        });
    });

    // --- 2. GESTIONE MAPPA (Sync tra Mini e Grande) ---
    const mapSelects = document.querySelectorAll('.global-map-select');
    const mapLayersUfficio = document.querySelectorAll('.layer-ufficio');
    const mapLayersParcheggio = document.querySelectorAll('.layer-parcheggio');

    function updateMapLayers(selectedValue) {
        // Sincronizza tutti i menu a tendina
        mapSelects.forEach(s => s.value = selectedValue);

        // Logica visualizzazione layer
        if (selectedValue === 'ufficio') {
            mapLayersUfficio.forEach(l => l.classList.add('active-layer'));
            mapLayersParcheggio.forEach(l => l.classList.remove('active-layer'));
        } else {
            mapLayersUfficio.forEach(l => l.classList.remove('active-layer'));
            mapLayersParcheggio.forEach(l => l.classList.add('active-layer'));
        }
    }

    // Event Listener su tutti i selettori mappa
    mapSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            updateMapLayers(e.target.value);
        });
    });

    // Click sulla Mini-Mappa -> Apre la vista Mappa
    const miniMapTrigger = document.getElementById('mini-map-trigger');
    if (miniMapTrigger) {
        miniMapTrigger.addEventListener('click', () => {
            switchView('view-mappa');
        });
    }

    // --- 3. DARK / LIGHT MODE (Con Persistenza) ---
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Esegui solo se il bottone esiste nella pagina
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        const textSpan = toggleBtn.querySelector('span');

        // Funzione per aggiornare la UI
        function updateThemeUI(isLight) {
            if (isLight) {
                // Siamo in Light Mode -> Mostra icona Luna per tornare a Dark
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                textSpan.textContent = 'Dark Mode';
            } else {
                // Siamo in Dark Mode -> Mostra icona Sole per andare a Light
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                textSpan.textContent = 'Light Mode';
            }
        }

        // 1. Al caricamento: Controlla preferenza salvata
        const savedTheme = localStorage.getItem('dashboard-theme');
        if (savedTheme) {
            body.setAttribute('data-theme', savedTheme);
            updateThemeUI(savedTheme === 'light');
        }

        // 2. Al click
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const isCurrentlyLight = body.getAttribute('data-theme') === 'light';
            const newTheme = isCurrentlyLight ? 'dark' : 'light';

            // Applica al body
            body.setAttribute('data-theme', newTheme);

            // Salva in storage
            localStorage.setItem('dashboard-theme', newTheme);

            // Aggiorna UI pulsante (passiamo il nuovo stato)
            updateThemeUI(!isCurrentlyLight);
        });
    }

    // --- 4. GESTIONE UTENTI (CRUD) ---

    // Rileva click sulla tab "Utenti" per caricare i dati
    const btnViewUtenti = document.querySelector('.nav-link[data-target="view-utenti"]');
    if (btnViewUtenti) {
        btnViewUtenti.addEventListener('click', fetchUsers);
    }

    // Funzione per caricare gli utenti dal DB
    function fetchUsers() {
        fetch('../PHP/api_utenti.php')
            .then(response => response.json())
            .then(data => {
                const tbody = document.querySelector('#users-table tbody');
                if(!tbody) return;
                tbody.innerHTML = ''; // Pulisci tabella

                data.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${user.ID_Utente}</td>
                        <td><div style="font-weight:bold; color:var(--text-main)">${user.Cognome} ${user.Nome}</div></td>
                        <td>${user.Username}</td>
                        <td><span style="text-transform:uppercase; font-size:10px; padding:2px 6px; border:1px solid var(--accent); border-radius:4px;">${user.Ruolo}</span></td>
                        <td>${user.ID_Team ? user.ID_Team : '-'}</td>
                        <td class="text-right">
                            <button class="btn-action btn-mod" onclick="editUser(${user.ID_Utente}, '${user.Nome}', '${user.Cognome}', '${user.Username}', '${user.Ruolo}', '${user.ID_Team || ''}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-rev" onclick="deleteUser(${user.ID_Utente})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(error => console.error('Errore caricamento utenti:', error));
    }

    // Gestione FORM (Salvataggio)
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);

            fetch('../PHP/api_utenti.php', {
                method: 'POST',
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        closeUserModal();
                        fetchUsers(); // Ricarica tabella
                    } else {
                        alert('Errore: ' + data.message);
                    }
                });
        });
    }

    // Rendi globali le funzioni chiamate dall'HTML (onclick)
    window.openUserModal = function () {
        document.getElementById('user-form').reset();
        document.getElementById('user_id').value = ''; // Pulisce ID per modalità "Nuovo"
        document.getElementById('modal-title').textContent = 'Nuovo Utente';
        document.getElementById('user-modal').classList.add('active');
    };

    window.closeUserModal = function () {
        document.getElementById('user-modal').classList.remove('active');
    };

    window.editUser = function (id, nome, cognome, username, ruolo, team) {
        document.getElementById('modal-title').textContent = 'Modifica Utente';
        document.getElementById('user_id').value = id;
        document.getElementById('nome').value = nome;
        document.getElementById('cognome').value = cognome;
        document.getElementById('username').value = username;
        document.getElementById('ruolo').value = ruolo;
        document.getElementById('id_team').value = team;

        document.getElementById('user-modal').classList.add('active');
    };

    window.deleteUser = function (id) {
        if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;

        fetch('../PHP/api_utenti.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) fetchUsers();
                else alert('Errore: ' + data.message);
            });
    };

    // --- 5. GESTIONE IMPOSTAZIONI ---

    // Carica configurazioni quando si apre la tab
    const btnSettings = document.querySelector('.nav-link[data-target="view-impostazioni"]');
    if (btnSettings) {
        btnSettings.addEventListener('click', loadSettings);
    }

    function loadSettings() {
        const configForm = document.getElementById('global-config-form');
        if (!configForm) return;

        fetch('../PHP/api_impostazioni.php?action=get_config')
            .then(res => res.json())
            .then(data => {
                // Popola i campi
                if (data.manutenzione_mode) {
                    document.getElementById('conf_manutenzione').checked = (data.manutenzione_mode === '1');
                }
                if (data.ora_apertura) document.getElementById('conf_apertura').value = data.ora_apertura;
                if (data.ora_chiusura) document.getElementById('conf_chiusura').value = data.ora_chiusura;
                if (data.max_giorni_anticipo) document.getElementById('conf_anticipo').value = data.max_giorni_anticipo;
            })
            .catch(err => console.error("Errore impostazioni:", err));
    }

    // 1. Submit Cambio Password
    const passForm = document.getElementById('profile-settings-form');
    if (passForm) {
        passForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(passForm);
            const data = Object.fromEntries(formData.entries());

            if (data.new_password !== data.confirm_password) {
                alert("Le nuove password non coincidono!");
                return;
            }

            fetch('../PHP/api_impostazioni.php?action=change_password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(res => res.json())
                .then(resp => {
                    if (resp.success) {
                        alert("Password aggiornata con successo!");
                        passForm.reset();
                    } else {
                        alert("Errore: " + resp.message);
                    }
                });
        });
    }

    // 2. Submit Configurazione Globale
    const configForm = document.getElementById('global-config-form');
    if (configForm) {
        configForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Gestione checkbox manuale (perché se non checkata non viene inviata)
            const isManutenzione = document.getElementById('conf_manutenzione').checked;

            const payload = {
                manutenzione_mode: isManutenzione,
                ora_apertura: document.getElementById('conf_apertura').value,
                ora_chiusura: document.getElementById('conf_chiusura').value,
                max_giorni_anticipo: document.getElementById('conf_anticipo').value
            };

            fetch('../PHP/api_impostazioni.php?action=update_config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(resp => {
                    if (resp.success) alert("Configurazione salvata!");
                    else alert("Errore salvataggio: " + resp.message);
                });
        });
    }

    // --- 6. GESTIONE DINAMICA DELLE PRENOTAZIONI E MAPPA ---

    // Funzione principale che orchestra il caricamento
    function loadPrenotazioni() {
        fetch('../PHP/api_prenotazioni.php?action=list')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    renderTabellaPrenotazioni(result.data);
                    disegnaMappaConStato(result.data); // Richiama la mappa passando le prenotazioni
                } else {
                    console.error("Errore nel caricamento prenotazioni:", result.message);
                }
            })
            .catch(err => console.error("Errore di rete:", err));
    }

    // Funzione che disegna la mappa e colora gli asset in base alle prenotazioni
    function disegnaMappaConStato(prenotazioni) {
        fetch('../PHP/api_assets.php')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const mapContainer = document.querySelector('.map-wrapper'); 
                    if (!mapContainer) return;

                    // 1. Creiamo o svuotiamo l'area della mappa
                    let mapArea = document.getElementById('map-area');
                    if (!mapArea) {
                        mapArea = document.createElement('div');
                        mapArea.id = 'map-area';
                        mapArea.style.position = 'relative';
                        mapArea.style.width = '100%';
                        mapArea.style.height = '400px'; 
                        mapArea.style.backgroundColor = 'var(--map-bg)';
                        mapArea.style.border = '1px solid var(--glass-border)';
                        mapArea.style.borderRadius = '10px';
                        mapArea.style.overflow = 'hidden';
                        mapContainer.appendChild(mapArea);
                    } else {
                        mapArea.innerHTML = ''; // Svuota per ridisegnare pulito
                    }

                    // 2. Disegniamo tutti gli asset (di default liberi)
                    result.data.forEach(asset => {
                        const div = document.createElement('div');
                        div.id = `asset-${asset.Codice_Univoco}`;
                        div.className = 'desk d-free'; 

                        div.style.position = 'absolute';
                        div.style.left = asset.Coordinate_X + '%';
                        div.style.top = asset.Coordinate_Y + '%';

                        if (asset.Tipologia === 'B') {
                            div.style.width = '40px';
                            div.style.height = '40px';
                            div.style.borderRadius = '50%'; 
                        }

                        div.innerText = asset.Codice_Univoco.split('-')[1]; 
                        div.title = `${asset.Descrizione} (${asset.Codice_Univoco}) - Disponibile`;

                        mapArea.appendChild(div);
                    });

                    // 3. Applichiamo lo stato delle prenotazioni (Coloriamo di rosso gli occupati)
                    const dataOggi = new Date().toISOString().split('T')[0];
                    const prenotazioniAttiveOggi = prenotazioni.filter(p =>
                        p.Stato === 'Attiva' && p.Data_Prenotazione === dataOggi
                    );

                    prenotazioniAttiveOggi.forEach(p => {
                        const assetGrafico = document.getElementById(`asset-${p.Codice_Univoco}`);
                        if (assetGrafico) {
                            assetGrafico.classList.remove('d-free');
                            assetGrafico.classList.add('d-busy');
                            assetGrafico.title = `Occupato da ${p.Nome} ${p.Cognome}`;
                        }
                    });

                }
            })
            .catch(err => console.error("Errore nel caricamento della mappa:", err));
    }

    // Funzione per stampare le righe nella tabella
    function renderTabellaPrenotazioni(prenotazioni) {
        const tbody = document.querySelector('#table-prenotazioni-body');
        if (!tbody) return; 

        tbody.innerHTML = ''; 

        if (prenotazioni.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nessuna prenotazione trovata.</td></tr>';
            return;
        }

        prenotazioni.forEach(p => {
            let statusClass = p.Stato === 'Attiva' ? 'status-active' : (p.Stato === 'Cancellata' || p.Stato === 'Revocata' ? 'text-danger' : '');

            let actionButtons = '';
            if (p.Stato === 'Attiva') {
                if (parseInt(p.Contatore_Modifiche) < 2) {
                    actionButtons += `<button class="btn-action btn-mod" onclick="apriModaleModifica(${p.ID_Prenotazione})"><i class="fas fa-edit"></i> Modifica</button> `;
                }
                actionButtons += `<button class="btn-action btn-rev" onclick="annullaPrenotazione(${p.ID_Prenotazione})"><i class="fas fa-times"></i> Annulla</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td>${p.Cognome} ${p.Nome}</td>
            <td>${p.Tipologia} - ${p.Codice_Univoco}</td>
            <td>${p.Data_Prenotazione}</td>
            <td class="${statusClass}">${p.Stato}</td>
            <td class="text-right">${actionButtons}</td>
        `;
            tbody.appendChild(tr);
        });
    }

    // Chiama la funzione di aggiornamento quando si clicca su Dashboard o Mappa
    const btnViewDashboard = document.querySelector('.nav-link[data-target="view-dashboard"]');
    if (btnViewDashboard) {
        btnViewDashboard.addEventListener('click', loadPrenotazioni);
    }
    const btnViewMappa = document.querySelector('.nav-link[data-target="view-mappa"]');
    if (btnViewMappa) {
        btnViewMappa.addEventListener('click', loadPrenotazioni);
    }

    // Caricamento iniziale all'avvio dell'applicazione
    loadPrenotazioni();

    // Funzione per annullare/revocare una prenotazione
    window.annullaPrenotazione = function (id_prenotazione) {
        if (!confirm("Sei sicuro di voler annullare questa prenotazione?")) {
            return;
        }

        fetch('../PHP/api_prenotazioni.php?action=cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_prenotazione: id_prenotazione })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    // Ricarica tabella e mappa centralizzata
                    loadPrenotazioni();
                } else {
                    alert("Errore: " + data.message);
                }
            })
            .catch(error => {
                console.error("Errore di rete durante l'annullamento:", error);
                alert("Si è verificato un errore di rete.");
            });
    };

});