-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creato il: Feb 27, 2026 alle 09:20
-- Versione del server: 10.4.32-MariaDB
-- Versione PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `z-volta`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `asset`
--

CREATE TABLE `asset` (
  `ID_Asset` int(11) NOT NULL,
  `Codice_Univoco` varchar(20) NOT NULL,
  `Tipologia` enum('A','A2','B','C') NOT NULL,
  `Descrizione` varchar(100) DEFAULT NULL,
  `ID_Mappa` int(11) DEFAULT NULL,
  `Coordinate_X` int(11) DEFAULT NULL,
  `Coordinate_Y` int(11) DEFAULT NULL,
  `Stato_Fisico` enum('Attivo','Disabilitato') DEFAULT 'Attivo'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dump dei dati per la tabella `asset`
--

INSERT INTO `asset` (`ID_Asset`, `Codice_Univoco`, `Tipologia`, `Descrizione`, `ID_Mappa`, `Coordinate_X`, `Coordinate_Y`, `Stato_Fisico`) VALUES
(1, 'A-01', 'A', 'Scrivania Std', 1, 10, 10, 'Attivo'),
(2, 'A-02', 'A', 'Scrivania Std', 1, 15, 10, 'Attivo'),
(3, 'A-03', 'A', 'Scrivania Std', 1, 20, 10, 'Attivo'),
(4, 'A-04', 'A', 'Scrivania Std', 1, 25, 10, 'Attivo'),
(5, 'A-05', 'A', 'Scrivania Std', 1, 30, 10, 'Attivo'),
(6, 'A-06', 'A', 'Scrivania Std', 1, 35, 10, 'Attivo'),
(7, 'A-07', 'A', 'Scrivania Std', 1, 40, 10, 'Attivo'),
(8, 'A-08', 'A', 'Scrivania Std', 1, 45, 10, 'Attivo'),
(9, 'A-09', 'A', 'Scrivania Std', 1, 50, 10, 'Attivo'),
(10, 'A-10', 'A', 'Scrivania Std', 1, 55, 10, 'Attivo'),
(11, 'A-11', 'A', 'Scrivania Std', 1, 10, 20, 'Attivo'),
(12, 'A-12', 'A', 'Scrivania Std', 1, 15, 20, 'Attivo'),
(13, 'A-13', 'A', 'Scrivania Std', 1, 20, 20, 'Attivo'),
(14, 'A-14', 'A', 'Scrivania Std', 1, 25, 20, 'Attivo'),
(15, 'A-15', 'A', 'Scrivania Std', 1, 30, 20, 'Attivo'),
(16, 'A-16', 'A', 'Scrivania Std', 1, 35, 20, 'Attivo'),
(17, 'A-17', 'A', 'Scrivania Std', 1, 40, 20, 'Attivo'),
(18, 'A-18', 'A', 'Scrivania Std', 1, 45, 20, 'Attivo'),
(19, 'A-19', 'A', 'Scrivania Std', 1, 50, 20, 'Attivo'),
(20, 'A-20', 'A', 'Scrivania Std', 1, 55, 20, 'Attivo'),
(21, 'A2-01', 'A2', 'Scrivania+Monitor', 1, 10, 40, 'Attivo'),
(22, 'A2-02', 'A2', 'Scrivania+Monitor', 1, 15, 40, 'Attivo'),
(23, 'A2-03', 'A2', 'Scrivania+Monitor', 1, 20, 40, 'Attivo'),
(24, 'A2-04', 'A2', 'Scrivania+Monitor', 1, 25, 40, 'Attivo'),
(25, 'A2-05', 'A2', 'Scrivania+Monitor', 1, 30, 40, 'Attivo'),
(26, 'B-01', 'B', 'Sala 1', 1, 80, 10, 'Attivo'),
(27, 'B-02', 'B', 'Sala 2', 1, 80, 30, 'Attivo'),
(28, 'B-03', 'B', 'Sala 3', 1, 80, 50, 'Attivo'),
(29, 'B-04', 'B', 'Sala 4', 1, 80, 70, 'Attivo'),
(30, 'B-05', 'B', 'Sala 5', 1, 80, 90, 'Attivo'),
(31, 'C-01', 'C', 'Posto Auto', 2, 10, 10, 'Attivo'),
(32, 'C-02', 'C', 'Posto Auto', 2, 20, 10, 'Attivo'),
(33, 'C-03', 'C', 'Posto Auto', 2, 30, 10, 'Attivo'),
(34, 'C-04', 'C', 'Posto Auto', 2, 40, 10, 'Attivo'),
(35, 'C-05', 'C', 'Posto Auto', 2, 50, 10, 'Attivo'),
(36, 'C-06', 'C', 'Posto Auto', 2, 60, 10, 'Attivo'),
(37, 'C-07', 'C', 'Posto Auto', 2, 70, 10, 'Attivo'),
(38, 'C-08', 'C', 'Posto Auto', 2, 80, 10, 'Attivo'),
(39, 'C-09', 'C', 'Posto Auto', 2, 90, 10, 'Attivo'),
(40, 'C-10', 'C', 'Posto Auto', 2, 10, 30, 'Attivo'),
(41, 'A2-06', 'A2', 'Scrivania+Monitor', 1, 35, 40, 'Attivo'),
(42, 'A-21', 'A', 'Scrivania Std', 1, 0, 0, 'Attivo');

-- --------------------------------------------------------

--
-- Struttura della tabella `configurazione`
--

CREATE TABLE `configurazione` (
  `chiave` varchar(50) NOT NULL,
  `valore` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dump dei dati per la tabella `configurazione`
--

INSERT INTO `configurazione` (`chiave`, `valore`) VALUES
('manutenzione_mode', '0'),
('max_giorni_anticipo', '0'),
('ora_apertura', '08:00'),
('ora_chiusura', '19:00');

-- --------------------------------------------------------

--
-- Struttura della tabella `mappa`
--

CREATE TABLE `mappa` (
  `ID_Mappa` int(11) NOT NULL,
  `Nome_Mappa` varchar(50) DEFAULT NULL,
  `Tipologia` enum('Sede','Parcheggio') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dump dei dati per la tabella `mappa`
--

INSERT INTO `mappa` (`ID_Mappa`, `Nome_Mappa`, `Tipologia`) VALUES
(1, 'Open Space Principale', 'Sede'),
(2, 'Garage Sotterraneo', 'Parcheggio');

-- --------------------------------------------------------

--
-- Struttura della tabella `prenotazione`
--

CREATE TABLE `prenotazione` (
  `ID_Prenotazione` int(11) NOT NULL,
  `ID_Utente` int(11) DEFAULT NULL,
  `ID_Asset` int(11) DEFAULT NULL,
  `Data_Prenotazione` date NOT NULL,
  `Stato` enum('Attiva','Cancellata','Revocata') DEFAULT 'Attiva',
  `Contatore_Modifiche` int(11) DEFAULT 0,
  `Timestamp_Creazione` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dump dei dati per la tabella `prenotazione`
--

INSERT INTO `prenotazione` (`ID_Prenotazione`, `ID_Utente`, `ID_Asset`, `Data_Prenotazione`, `Stato`, `Contatore_Modifiche`, `Timestamp_Creazione`) VALUES
(1, 1, 31, '2026-02-21', 'Cancellata', 0, '2026-02-21 09:42:00'),
(2, 1, 1, '0000-00-00', 'Cancellata', 0, '2026-02-21 09:48:50'),
(3, 1, 31, '0000-00-00', 'Cancellata', 0, '2026-02-21 09:49:20'),
(4, 1, 1, '0000-00-00', 'Cancellata', 0, '2026-02-21 09:49:29'),
(5, 1, 1, '2026-02-21', 'Cancellata', 0, '2026-02-21 09:59:36'),
(6, 1, 31, '2026-02-21', 'Cancellata', 0, '2026-02-21 10:14:24'),
(7, 1, 19, '2026-02-21', 'Cancellata', 0, '2026-02-21 10:19:23'),
(8, 1, 4, '2026-02-23', 'Cancellata', 0, '2026-02-23 08:01:05'),
(9, 1, 5, '2026-02-23', 'Cancellata', 0, '2026-02-23 08:26:53'),
(10, 1, 35, '2026-02-23', 'Cancellata', 0, '2026-02-23 08:37:05'),
(11, 1, 40, '2026-02-23', 'Cancellata', 0, '2026-02-23 08:47:45'),
(12, 1, 31, '2026-02-23', 'Cancellata', 0, '2026-02-23 08:55:25'),
(13, 1, 10, '2026-02-23', 'Cancellata', 0, '2026-02-23 09:31:11'),
(14, 1, 27, '2026-02-23', 'Cancellata', 0, '2026-02-23 11:26:09'),
(15, 1, 32, '2026-02-23', 'Cancellata', 0, '2026-02-23 11:26:26'),
(16, 1, 4, '2026-02-23', 'Cancellata', 0, '2026-02-23 13:41:01'),
(17, 1, 26, '2026-02-24', 'Cancellata', 0, '2026-02-24 07:19:03'),
(18, 1, 3, '2026-02-27', 'Cancellata', 0, '2026-02-27 08:12:19');

-- --------------------------------------------------------

--
-- Struttura della tabella `utente`
--

CREATE TABLE `utente` (
  `ID_Utente` int(11) NOT NULL,
  `Username` varchar(30) NOT NULL,
  `Nome` varchar(50) DEFAULT NULL,
  `Cognome` varchar(50) DEFAULT NULL,
  `Ruolo` enum('dipendente','coordinatore','gestore') NOT NULL,
  `ID_Team` int(11) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dump dei dati per la tabella `utente`
--

INSERT INTO `utente` (`ID_Utente`, `Username`, `Nome`, `Cognome`, `Ruolo`, `ID_Team`, `Password`) VALUES
(1, 'admin', 'Marco', 'Negri', 'gestore', 1, 'admin'),
(2, 'g.verdi', 'Giulia', 'Verdi', 'coordinatore', 1, 'Zucchetti_01!'),
(3, 'l.bianchi', 'Luca', 'Bianchi', 'dipendente', 1, 'Zucchetti_01!'),
(4, 'm.rossi', 'Mario', 'Rossi', 'dipendente', 1, 'Zucchetti_01!');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `asset`
--
ALTER TABLE `asset`
  ADD PRIMARY KEY (`ID_Asset`),
  ADD UNIQUE KEY `Codice_Univoco` (`Codice_Univoco`),
  ADD KEY `ID_Mappa` (`ID_Mappa`);

--
-- Indici per le tabelle `configurazione`
--
ALTER TABLE `configurazione`
  ADD PRIMARY KEY (`chiave`);

--
-- Indici per le tabelle `mappa`
--
ALTER TABLE `mappa`
  ADD PRIMARY KEY (`ID_Mappa`);

--
-- Indici per le tabelle `prenotazione`
--
ALTER TABLE `prenotazione`
  ADD PRIMARY KEY (`ID_Prenotazione`),
  ADD KEY `ID_Utente` (`ID_Utente`),
  ADD KEY `ID_Asset` (`ID_Asset`);

--
-- Indici per le tabelle `utente`
--
ALTER TABLE `utente`
  ADD PRIMARY KEY (`ID_Utente`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `asset`
--
ALTER TABLE `asset`
  MODIFY `ID_Asset` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT per la tabella `prenotazione`
--
ALTER TABLE `prenotazione`
  MODIFY `ID_Prenotazione` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT per la tabella `utente`
--
ALTER TABLE `utente`
  MODIFY `ID_Utente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
