# 🍕 PizzaLab Scientifico - Calcolatore Professionale d'Impasti

**PizzaLab Scientifico** è una web application concepita per calcolare in maniera rigorosamente scientifica e termodinamica le formule degli impasti per pizza, pane e focaccia. 

Abbandona l'intuito e le "dosi a occhio": ogni grammo di farina, acqua, sale, grassi e lievito viene calcolato tramite **cinetica biologica non lineare**, **reologia delle farine** ed **equilibrio termodinamico di chiusura impasto (TFI)**.

---

## 🔬 Modelli Matematici e Fondamenti Scientifici

### 1. Cinetica di Fermentazione Non Lineare (Modello TXCraig1 & Arrhenius)
Il metabolismo del *Saccharomyces cerevisiae* non scala linearmente con il tempo e la temperatura, ma risponde secondo curve termiche biologiche ($Q_{10} \approx 2.15$):
- **Curva di regressione potenza del lievito:**
  $$\text{IDY}\% = \frac{1.65}{(\text{EFU})^{1.08}}$$
  $$\text{LBF}\% = \text{IDY}\% \times 3.0 \quad (\text{Lievito di Birra Fresco})$$
  $$\text{ADY}\% = \text{IDY}\% \times 1.25 \quad (\text{Lievito Secco Attivo})$$
- **Inerzia Termica del Frigorifero:**  
  Quando la massa d'impasto (ad esempio a 23°C) viene riposta in cella a 4°C, il cuore dell'impasto impiega svariate ore a raffreddarsi. L'applicazione integra la **legge di raffreddamento termico di Newton** a intervalli di 15 minuti:
  $$T(t) = T_{\text{frigo}} + (T_{\text{iniziale}} - T_{\text{frigo}}) \cdot e^{-t / \tau} \quad (\tau \approx 3.0 \text{ ore})$$
- **Fattori Inibitori e Acceleratori:**  
  Il sale agisce per pressione osmotica rallentando i lieviti, l'idratazione spinta aumenta la mobilità enzimatica, i grassi impermeabilizzano leggermente le cellule. Tali coefficienti vengono applicati direttamente sulle **EFU (Effective Fermentation Units)**.

### 2. Termodinamica di Chiusura Impasto (TFI) & Entalpia del Ghiaccio
Per ottenere un impasto chiuso alla temperatura ideale (target predefinito: **23°C**):
$$\text{Temp. Acqua Richiesta} = (3 \times T_{\text{target}}) - (T_{\text{ambiente}} + T_{\text{farina}} + T_{\text{attrito\_impastatrice}})$$
- **Fattore Attrito Meccanico:**
  - A mano: $\approx 1^\circ\text{C}$
  - Braccia tuffanti: $\approx 3^\circ\text{C}$
  - Planetaria / Spirale a 1ª velocità: $\approx 5^\circ\text{C}$
  - Spirale a 2ª velocità (alta incordatura): $\approx 9^\circ\text{C}$ – $12^\circ\text{C}$
- **Formula del Ghiaccio Tritato (se $T_{\text{acqua}} < 3^\circ\text{C}$):**  
  In estate o con lavorazioni intense, l'acqua richiesta può scendere sotto i 3°C o essere negativa. Il calcolatore calcola istantaneamente l'esatta massa di ghiaccio da sciogliere sfruttando il calore latente di fusione ($80 \text{ kcal/kg}$):
  $$m_{\text{ghiaccio}} = m_{\text{acqua\_totale}} \times \frac{T_{\text{rubinetto}} - T_{\text{acqua\_calcolata}}}{80 + T_{\text{rubinetto}}}$$

### 3. Reologia della Farina: Forza W e Maturazione Enzimatica
- **Chopin Alveografo ($W$):** Correlazione tra proteine (gliadine/glutenine), capacità di assorbimento idrico ($H_{\text{opt}} \approx 52 + 0.08 \times W$) e resistenza della maglia glutinica.
- **Rapporto P/L:** Tenacità / Estensibilità (ottimale per pizza tra 0.50 e 0.60).
- **Diagnostica Maturazione Enzimatica:**  
  A 4°C i lieviti riducono la produzione di gas del ~92%, mentre le proteasi e le amilasi continuano a idrolizzare amidi e proteine al ~30% della velocità. Il motore confronta le ore enzimatiche accumulate con le ore teoriche necessarie al $W$ della farina e avverte in tempo reale in caso di **impasto sottomaturo** (gommoso, meno digeribile) o **sovramaturo** (maglia glutinica degradata, panetto che collassa e si strappa).

### 4. Metodi Indiretti (Biga & Poolish)
- **Biga (100% o parziale):** Gestione della fermentazione solida (idratazione 44-50%, 1% LBF su farina biga, 16-18h a 18°C) con calcolo stechiometrico automatico del rinfresco (acqua residua fredda, farina rimanente, sale e malto).
- **Poolish (liquido 100% idro):** Calibrazione del lievito in funzione delle ore (da 3h al 2% fino a 16h allo 0.1%).

### 5. Lievito Madre e Li.Co.Li
Sottrazione stechiometrica esatta: l'acqua e la farina apportate dal lievito madre (50% solidi per pasta madre solida, 50% liquidi/solidi per Li.Co.Li) vengono scorporate dalla ricetta base mantenendo invariati l'idratazione finale e il peso dei panetti desiderati.

---

## 🚀 Come Utilizzare l'Applicazione

L'applicazione è completamente **standalone**, zero-dipendenze esterne: funziona nativamente in qualsiasi browser web moderno.

### Metodo 1: Avvio Rapido con Python (Consigliato)
Nel terminale, all'interno della cartella del progetto, esegui:
```bash
python start_server.py
```
Il server si avvierà su `http://localhost:8080/index.html` e aprirà automaticamente l'interfaccia nel tuo browser predefinito.

### Metodo 2: Apertura Diretta Senza Server
Fai doppio click su `index.html` (o trascinalo su Google Chrome / Microsoft Edge / Safari / Firefox).

### Metodo 3: Esecuzione Suite di Test Scientifici
Per verificare l'integrità dei modelli matematici, dei calcoli di entalpia del ghiaccio e delle formule di Craig:
```bash
node tests/test_engine.js
```

---

## 📱 Funzionalità Principali della Webapp

1. **Preset Tipici Certificati:**
   - *Napoletana STG (Classica 8h TA)*
   - *Napoletana Contemporanea (Canotto 48h Frigo)*
   - *Pizza in Teglia alla Romana (80% Idratazione 48h)*
   - *Tonda Romana Scrocchiarella*
   - *Pinsa ad Alta Idratazione*
   - *New York Style*
   - *Focaccia Genovese*
2. **Tabella Ricetta in Tempo Reale:** Calcolo istantaneo di ogni ingrediente al decimo di grammo.
3. **Calcolatore Dimensioni Teglia:** Inserisci le dimensioni in cm (teglia rettangolare o tonda) e applica la grammatura direttamente all'impasto con un click.
4. **Calcolatore Blend Farine:** Miscela fino a 4 farine diverse con differenti $W$ e percentuali per calcolare il $W$ ponderato finale e la stima proteica.
5. **Cronoprogramma a Ritroso (Timeline):** Inserisci la data e l'ora esatta in cui vuoi infornare (es. Sabato ore 20:30) per visualizzare l'intera tabella di marcia ora per ora (dall'impasto, alla puntata, al frigo, allo staglio, fino al preriscaldamento del forno).
6. **Esportazione & Condivisione:**
   - Pulsante **"Copia Ricetta"** per esportare un testo ordinato pronto per WhatsApp, Telegram o note personali.
   - Pulsante **"Stampa / PDF"** con layout ottimizzato per foglio A4.
   - Supporto **Dark Mode / Light Mode**.
