<?php
session_start();
// Svuota l'array della sessione
$_SESSION = array();
// Distrugge la sessione sul server
session_destroy();
// Reindirizza l'utente alla pagina di login (fuori dalla cartella PHP)
header("Location: ../index.html");
exit;
