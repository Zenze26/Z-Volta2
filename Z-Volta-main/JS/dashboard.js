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
        fetch('api_utenti.php')
            .then(response => response.json())
            .then(data => {
                const tbody = document.querySelector('#users-table tbody');
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
            .catch(error => console.error('Errore:', error));
    }

    // Gestione FORM (Salvataggio)
    document.getElementById('user-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);

        fetch('api_utenti.php', {
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

        fetch('api_utenti.php', {
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
        // Solo se esiste il form config (quindi se sono gestore)
        const configForm = document.getElementById('global-config-form');
        if (!configForm) return;

        fetch('api_impostazioni.php?action=get_config')
            .then(res => res.json())
            .then(data => {
                // Popola i campi
                if (data.manutenzione_mode) {
                    document.getElementById('conf_manutenzione').checked = (data.manutenzione_mode === '1');
                }
                if (data.ora_apertura) document.getElementById('conf_apertura').value = data.ora_apertura;
                if (data.ora_chiusura) document.getElementById('conf_chiusura').value = data.ora_chiusura;
                if (data.max_giorni_anticipo) document.getElementById('conf_anticipo').value = data.max_giorni_anticipo;
            });
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

            fetch('api_impostazioni.php?action=change_password', {
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

            fetch('api_impostazioni.php?action=update_config', {
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

    // --- GESTIONE DINAMICA DELLE PRENOTAZIONI ---

    // Funzione per caricare le prenotazioni
    function loadPrenotazioni() {
        fetch('../PHP/api_prenotazioni.php?action=list')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    renderTabellaPrenotazioni(result.data);
                    aggiornaStatoMappa(result.data); // Aggiorna anche i colori sulla mappa
                } else {
                    console.error("Errore nel caricamento prenotazioni:", result.message);
                }
            })
            .catch(err => console.error("Errore di rete:", err));

        // Funzione per aggiornare la mappa visiva in base ai dati
        function aggiornaStatoMappa(prenotazioni) {
            // 1. Prima resettiamo tutti gli asset grafici della mappa mettendo lo stato "Libero" (verde)
            const tutteLeScrivanie = document.querySelectorAll('.desk');
            tutteLeScrivanie.forEach(desk => {
                desk.classList.remove('d-busy');
                desk.classList.add('d-free');
                desk.title = "Disponibile"; // Tooltip al passaggio del mouse
            });

            // 2. Filtriamo solo le prenotazioni attive per "Oggi" (o per la data selezionata)
            // Per ora assumiamo di visualizzare lo stato odierno
            const dataOggi = new Date().toISOString().split('T')[0];

            const prenotazioniAttiveOggi = prenotazioni.filter(p =>
                p.Stato === 'Attiva' && p.Data_Prenotazione === dataOggi
            );

            // 3. Coloriamo di rosso (occupato) gli asset prenotati
            prenotazioniAttiveOggi.forEach(p => {
                // Supponiamo che gli elementi HTML della mappa abbiano un ID uguale al codice dell'asset
                // Esempio: <div id="asset-A-01" class="desk"></div>
                const assetGrafico = document.getElementById(`asset-${p.Codice_Univoco}`);

                if (assetGrafico) {
                    assetGrafico.classList.remove('d-free');
                    assetGrafico.classList.add('d-busy');
                    assetGrafico.title = `Occupato da ${p.Nome} ${p.Cognome}`;
                }
            });

            // Funzione per caricare e disegnare gli asset sulla mappa
            function disegnaMappa() {
                fetch('../PHP/api_assets.php')
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            const mapContainer = document.querySelector('.map-wrapper'); // Assicurati che questo selettore corrisponda al tuo HTML
                            if (!mapContainer) return;

                            // Creiamo un div contenitore relativo per la mappa se non esiste
                            let mapArea = document.getElementById('map-area');
                            if (!mapArea) {
                                mapArea = document.createElement('div');
                                mapArea.id = 'map-area';
                                mapArea.style.position = 'relative';
                                mapArea.style.width = '100%';
                                mapArea.style.height = '400px'; // Altezza fissa o dinamica
                                mapArea.style.backgroundColor = 'var(--map-bg)';
                                mapArea.style.border = '1px solid var(--glass-border)';
                                mapArea.style.borderRadius = '10px';
                                mapArea.style.overflow = 'hidden';
                                mapContainer.appendChild(mapArea);
                            } else {
                                mapArea.innerHTML = ''; // Svuota la mappa prima di ridisegnarla
                            }

                            // Generiamo i quadratini per ogni asset
                            result.data.forEach(asset => {
                                const div = document.createElement('div');
                                div.id = `asset-${asset.Codice_Univoco}`;
                                div.className = 'desk d-free'; // Di default sono liberi

                                // Posizionamento assoluto basato sulle coordinate X e Y del database
                                div.style.position = 'absolute';
                                div.style.left = asset.Coordinate_X + '%';
                                div.style.top = asset.Coordinate_Y + '%';

                                // Stili extra per distinguere sale (B) o parcheggi (C)
                                if (asset.Tipologia === 'B') {
                                    div.style.width = '40px';
                                    div.style.height = '40px';
                                    div.style.borderRadius = '50%'; // Sale rotonde
                                }

                                // Scriviamo il codice dell'asset dentro il quadratino (es: A-01)
                                div.innerText = asset.Codice_Univoco.split('-')[1]; // Mostra solo il numero
                                div.title = `${asset.Descrizione} (${asset.Codice_Univoco}) - Disponibile`;

                                mapArea.appendChild(div);
                            });

                            // Dopo aver disegnato gli asset, chiamiamo le prenotazioni per colorarli!
                            disegnaMappa();
                        }
                    })
                    .catch(err => console.error("Errore nel caricamento della mappa:", err));
            }
        }
    }

    // Funzione per stampare le righe nella tabella
    function renderTabellaPrenotazioni(prenotazioni) {
        const tbody = document.querySelector('#table-prenotazioni-body');
        if (!tbody) return; // Se la tabella non esiste in questa vista, esci

        tbody.innerHTML = ''; // Pulisci i dati statici finti

        if (prenotazioni.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nessuna prenotazione trovata.</td></tr>';
            return;
        }

        prenotazioni.forEach(p => {
            // Determina il colore dello stato
            let statusClass = p.Stato === 'Attiva' ? 'status-active' : (p.Stato === 'Cancellata' || p.Stato === 'Revocata' ? 'text-danger' : '');

            // Determina quali bottoni mostrare (es. nascondi modifica se ha raggiunto il limite o è annullata)
            let actionButtons = '';
            if (p.Stato === 'Attiva') {
                if (parseInt(p.Contatore_Modifiche) < 2) {
                    actionButtons += `<button class="btn-action btn-mod" onclick="apriModaleModifica(${p.ID_Prenotazione})">Modifica</button>`;
                }
                actionButtons += `<button class="btn-action btn-rev" onclick="annullaPrenotazione(${p.ID_Prenotazione})">Annulla</button>`;
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

    // Chiama la funzione appena si entra nella tab della dashboard o delle prenotazioni
    const btnViewDashboard = document.querySelector('.nav-link[data-target="view-dashboard"]');
    if (btnViewDashboard) {
        btnViewDashboard.addEventListener('click', loadPrenotazioni);
    }

    // Caricamento iniziale
    disegnaMappa();

    // Funzione per annullare/revocare una prenotazione
    window.annullaPrenotazione = function (id_prenotazione) {
        // Chiediamo conferma all'utente prima di procedere
        if (!confirm("Sei sicuro di voler annullare questa prenotazione?")) {
            return;
        }

        // Effettuiamo la chiamata POST al nostro backend
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
                    // Ricarica la tabella e la mappa per mostrare lo stato aggiornato
                    disegnaMappa();
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
