document.addEventListener('DOMContentLoaded', () => {
    
    // --- SELETTORI ---
    const captchaTextElement = document.getElementById("captcha-text");
    const captchaInput = document.querySelector(".captcha-input");
    const refreshBtn = document.querySelector(".btn-refresh");
    const loginForm = document.getElementById("loginForm");
    
    const togglePassIcon = document.getElementById("togglePassword");
    const passwordInput = document.getElementById('password');
    // usernameInput non serve strettamente per la logica JS ora, ma lo lasciamo per completezza
    const usernameInput = document.getElementById('username');

    // --- 0. GESTIONE ERRORI DA PHP (Nuovo) ---
    // Se login.php rimanda indietro con ?error=..., mostriamo un alert
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        const errorType = urlParams.get('error');
        if (errorType === 'password_errata') {
            alert("❌ Password non corretta. Riprova.");
        } else if (errorType === 'utente_non_trovato') {
            alert("❌ Username inesistente.");
        } else if (errorType === 'ruolo_non_valido') {
            alert("⚠️ Errore nel ruolo utente. Contatta l'assistenza.");
        }
        // Pulisce l'URL per non mostrare l'errore al refresh
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- 1. FUNZIONE PER MOSTRARE/NASCONDERE PASSWORD ---
    togglePassIcon.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        togglePassIcon.classList.toggle("fa-eye");
        togglePassIcon.classList.toggle("fa-eye-slash");
    });

    // --- 2. GENERAZIONE CAPTCHA DINAMICO ---
    const generateCaptcha = () => {
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@-#$?"; 
        
        let captcha = "";
        const captchaLength = 6; 

        // Genera la stringa casuale
        for (let i = 0; i < captchaLength; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Inserisce il testo
        captchaTextElement.textContent = captcha;
        captchaInput.value = ""; 

        // --- CALCOLO DISTORSIONE CASUALE ---
        const randomRot = Math.floor(Math.random() * 20) - 10; 
        const randomSkew = Math.floor(Math.random() * 40) - 20;
        const randomScale = (Math.random() * 0.15) + 0.95;

        // Applica le trasformazioni CSS via JS
        captchaTextElement.style.transform = `rotate(${randomRot}deg) skewX(${randomSkew}deg) scale(${randomScale})`;
    };

    // Avvio immediato
    generateCaptcha();

    // Refresh Captcha
    refreshBtn.addEventListener("click", () => {
        const icon = refreshBtn.querySelector("i");
        icon.style.transform = "rotate(360deg)";
        setTimeout(() => icon.style.transform = "none", 400);
        generateCaptcha();
    });

    // --- 3. LOGICA DI LOGIN AGGIORNATA ---
    loginForm.addEventListener("submit", (e) => {
        // Preveniamo sempre l'invio immediato per controllare PRIMA il captcha
        e.preventDefault(); 
        
        // A. Controllo Captcha
        const userCaptcha = captchaInput.value.trim(); 
        const validCaptcha = captchaTextElement.textContent;

        if (userCaptcha !== validCaptcha) {
            alert("❌ Codice Captcha Errato! Attenzione alle maiuscole/minuscole.");
            generateCaptcha(); 
            return; // Blocca tutto, non invia al server
        }

        // B. Invio al Server (PHP)
        // Se il captcha è giusto, lasciamo fare a PHP il controllo user/pass.
        // Usiamo il metodo submit() nativo del form DOM, che ignora l'event listener
        // e invia i dati a "login.php" (definito nell'HTML action).
        loginForm.submit();
    });

});
