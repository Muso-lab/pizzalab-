/**
 * PizzaScience Engine - Modulo Scientifico di Calcolo per Impasti Pizza
 * 
 * Modelli implementati:
 * 1. Termodinamica dell'impasto (TFI - Regola del 3 ed equazione entalpica del ghiaccio)
 * 2. Cinetica di fermentazione non lineare (Modello Craig / Arrhenius con inerzia termica)
 * 3. Reologia della farina (Blend W ponderato, P/L, indice di maturazione enzimatica)
 * 4. Metodi Indiretti (Biga 100% / parziale e Poolish a tempo variabile)
 * 5. Lievito Madre solido e Li.Co.Li con sottrazione stechiometrica liquidi/solidi
 * 6. Dimensionamento teglie (rettangolari, tonde, coefficienti di densità alveolare)
 * 7. Cronoprogramma a ritroso (Backward Schedule Generator)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PizzaEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // --- COSTANTI SCIENTIFICHE ---
  const LATENT_HEAT_ICE_FUSION = 80; // kcal/kg (o cal/g)
  const DOUGH_COOLING_TAU = 3.0; // Costante tempo raffreddamento impasto in frigo (ore)
  const DEFAULT_TARGET_TFI = 23; // °C temperatura ideale chiusura impasto

  /**
   * Calcola la velocità metabolica relativa del lievito Saccharomyces cerevisiae a temperatura T
   * Normalizzata a 1.0 per T = 20°C.
   * Basata sulla combinazione di curva Q10 e dati empirici TXCraig1 per panificazione.
   */
  function yeastActivityRate(T) {
    if (T <= 0) return 0.005;
    if (T <= 6) {
      // Zona frigo: forte rallentamento per rigidità delle membrane cellulari
      return 0.02 + 0.010 * Math.max(0, T - 1);
    }
    if (T <= 32) {
      // Regime normale metabolico (cresce con Q10 ~ 2.25)
      return Math.pow(2.0, (T - 20) / 8.2);
    }
    if (T <= 42) {
      // Regime sub-letale (denaturazione termica proteine cellulari)
      const peak = Math.pow(2.0, (32 - 20) / 8.2);
      return peak * Math.max(0, 1 - (T - 32) / 10);
    }
    return 0; // Termoinattivazione / morte del lievito
  }

  /**
   * Calcola le Unità Fermentative Equivalenti (EFU) tenendo conto dell'inerzia termica nel frigo
   */
  function calculateEffectiveFermentationUnits(params) {
    const {
      hoursRoomPuntata = 2,
      hoursFridge = 0,
      fridgeTemp = 4,
      hoursRoomAppretto = 6,
      ambientTemp = 20,
      targetTFI = 23
    } = params;

    // Fase 1: Puntata a temperatura ambiente
    const efuPuntata = hoursRoomPuntata * yeastActivityRate(ambientTemp);

    // Fase 2: Raffreddamento dinamico ed eventuale stasi in frigo
    let efuFridge = 0;
    if (hoursFridge > 0) {
      const dt = 0.25; // integrazione ogni 15 minuti
      const steps = Math.floor(hoursFridge / dt);
      for (let i = 0; i < steps; i++) {
        const t = i * dt;
        // Legge del raffreddamento di Newton per la massa d'impasto
        const currentTemp = fridgeTemp + (targetTFI - fridgeTemp) * Math.exp(-t / DOUGH_COOLING_TAU);
        efuFridge += yeastActivityRate(currentTemp) * dt;
      }
      // Rimanenza frazionaria
      const rem = hoursFridge - steps * dt;
      if (rem > 0) {
        const curT = fridgeTemp + (targetTFI - fridgeTemp) * Math.exp(-hoursFridge / DOUGH_COOLING_TAU);
        efuFridge += yeastActivityRate(curT) * rem;
      }
    }

    // Fase 3: Appretto / Seconda lievitazione a temperatura ambiente
    const efuAppretto = hoursRoomAppretto * yeastActivityRate(ambientTemp);

    const totalEFU = efuPuntata + efuFridge + efuAppretto;

    return {
      efuPuntata,
      efuFridge,
      efuAppretto,
      totalEFU
    };
  }

  /**
   * Modificatori chimico-fisici sulla fermentazione (Sale, Idratazione, Grassi)
   */
  function getFermentationModifiers(saltPct, hydrationPct, fatPct) {
    // Il sale inibisce la pressione osmotica del lievito (ref standard 2.8%)
    const kSalt = 1.0 - 0.10 * (saltPct - 2.8);
    // L'idratazione agevola la mobilità enzimatica e l'assorbimento (ref standard 60%)
    const kHydr = 1.0 + 0.006 * (hydrationPct - 60);
    // I grassi rivestono leggermente le cellule e impermeabilizzano (ref 0%)
    const kFat = 1.0 - 0.015 * (fatPct || 0);

    return Math.max(0.5, kSalt * kHydr * kFat);
  }

  /**
   * Calcolo della quantità di lievito (LBF, IDY, ADY)
   */
  function calculateYeastPercentage(totalEFU, saltPct, hydrationPct, fatPct) {
    const modifier = getFermentationModifiers(saltPct, hydrationPct, fatPct);
    const adjustedEFU = Math.max(0.5, totalEFU * modifier);

    // Curva di potenza empirica tarata su TXCraig1 e disciplinare Napoletano STG
    // A 8h 20°C (EFU=8) -> IDY% ~ 0.17%, LBF% ~ 0.51% (~5.1g/kg)
    // A 24h 20°C (EFU=24) -> IDY% ~ 0.052%, LBF% ~ 0.156% (~1.5g/kg)
    const idyPct = 1.65 / Math.pow(adjustedEFU, 1.08);

    const freshYeastPct = idyPct * 3.0; // Lievito birra fresco = 3x IDY
    const adyPct = idyPct * 1.25;       // Lievito birra secco attivo = 1.25x IDY

    return {
      idyPct: Math.max(0.005, idyPct),
      freshYeastPct: Math.max(0.015, freshYeastPct),
      adyPct: Math.max(0.007, adyPct),
      adjustedEFU
    };
  }

  /**
   * Termodinamica dell'acqua e calcolo ghiaccio
   * Formula: T_acqua = 3 * T_target - (T_ambiente + T_farina + T_attrito)
   */
  function calculateThermodynamics(params) {
    const {
      targetTemp = DEFAULT_TARGET_TFI,
      roomTemp = 20,
      flourTemp = 20,
      friction = 5,
      totalWater = 600,
      tapWaterTemp = 18
    } = params;

    const theoreticalWaterTemp = (3 * targetTemp) - (roomTemp + flourTemp + friction);
    const roundedWaterTemp = Math.round(theoreticalWaterTemp * 10) / 10;

    let needsIce = false;
    let iceGrams = 0;
    let liquidWaterGrams = totalWater;
    let warning = null;

    if (theoreticalWaterTemp < 3) {
      needsIce = true;
      // Formula dell'entalpia del ghiaccio in panificazione:
      // m_ghiaccio = m_acqua_tot * (T_rubinetto - T_desiderata) / (80 + T_rubinetto)
      iceGrams = Math.round(totalWater * (tapWaterTemp - theoreticalWaterTemp) / (LATENT_HEAT_ICE_FUSION + tapWaterTemp));
      if (iceGrams > totalWater) iceGrams = totalWater;
      liquidWaterGrams = Math.round(totalWater - iceGrams);
      warning = "Attenzione: la temperatura richiesta dell'acqua è inferiore a 3°C. È necessario sostituire una parte dell'acqua con ghiaccio tritato fino!";
    } else if (theoreticalWaterTemp > 35) {
      warning = "Attenzione: l'acqua richiesta supera i 35°C, rischio di surriscaldare e inattivare i lieviti prima dell'incordatura!";
    }

    return {
      waterTemp: roundedWaterTemp,
      needsIce,
      iceGrams,
      liquidWaterGrams,
      targetTemp,
      roomTemp,
      flourTemp,
      friction,
      warning
    };
  }

  /**
   * Calcolo del Blend di Farine (W, Proteine e Idratazione Consigliata)
   */
  function calculateFlourBlend(flours) {
    if (!flours || flours.length === 0) {
      return { w: 280, protein: 12.0, maxRecommendedHydration: 72, pl: 0.55 };
    }

    let totalPct = 0;
    let weightedW = 0;
    let weightedProtein = 0;
    let weightedPL = 0;

    flours.forEach(f => {
      const pct = f.pct || 0;
      totalPct += pct;
      weightedW += (f.w || 280) * (pct / 100);
      weightedProtein += (f.protein || 12.0) * (pct / 100);
      weightedPL += (f.pl || 0.55) * (pct / 100);
    });

    if (totalPct === 0) {
      return { w: 280, protein: 12.0, maxRecommendedHydration: 72, pl: 0.55 };
    }

    // Normalizza se la somma delle percentuali differisce da 100
    if (Math.abs(totalPct - 100) > 0.01) {
      weightedW = (weightedW / totalPct) * 100;
      weightedProtein = (weightedProtein / totalPct) * 100;
      weightedPL = (weightedPL / totalPct) * 100;
    }

    const w = Math.round(weightedW);
    const protein = Math.round(weightedProtein * 10) / 10;
    const pl = Math.round(weightedPL * 100) / 100;

    // Assorbimento ottimale empirico in base a W
    // Farina W 180 -> ~58-62%, W 280 -> ~68-72%, W 350+ -> ~78-85%
    const maxRecommendedHydration = Math.round(52 + (w * 0.08));

    return {
      w,
      protein,
      pl,
      maxRecommendedHydration
    };
  }

  /**
   * Analisi di compatibilità tra Forza Farina W e Tempi di Maturazione
   * (Rapporto tra maturazione enzimatica e fermentazione)
   */
  function analyzeMaturation(flourW, hoursAmbient, hoursFridge) {
    // Le proteasi e amilasi mantengono circa il 28-30% di attività a 4°C
    const enzymaticUnits = (hoursAmbient * 1.0) + (hoursFridge * 0.28);
    
    // Unità ottimali di maturazione per una farina di forza W:
    // W 180 -> ~6h, W 220 -> ~10h, W 260 -> ~14h, W 320 -> ~20h, W 380 -> ~26h
    const targetUnits = Math.max(4, (flourW - 120) / 10);

    const ratio = enzymaticUnits / targetUnits;
    let status = 'optimal';
    let message = 'Maturazione enzimatica ottimale!';
    let detail = 'La maglia glutinica sarà perfettamente rilassata, la pizza risulterà altamente digeribile con zuccheri semplici ideali per la doratura.';

    if (ratio < 0.50) {
      status = 'under';
      message = 'Impasto sottomaturo per la forza W selezionata!';
      detail = `La farina (W ${flourW}) è troppo forte per sole ${(hoursAmbient + hoursFridge).toFixed(1)} ore totali. I complessi proteici non avranno tempo di scindersi a sufficienza: l'impasto potrebbe risultare gommoso/tenace e meno digeribile.`;
    } else if (ratio < 0.75) {
      status = 'good';
      message = 'Maturazione buona / accettabile.';
      detail = `L'impasto ha raggiunto un buon grado di maturazione per una farina W ${flourW}, anche se un tempo leggermente più lungo ne avrebbe esaltato ulteriormente la scioglievolezza.`;
    } else if (ratio > 1.65) {
      status = 'over';
      message = 'Rischio di sovramaturazione e collasso glutinico!';
      detail = `Il tempo di maturazione (${(hoursAmbient + hoursFridge).toFixed(1)}h) è eccessivo per una farina di forza W ${flourW}. L'azione prolungata delle proteasi potrebbe degradare la maglia glutinica, causando panetti spiattellati e strappi in stesura.`;
    } else if (ratio > 1.35) {
      status = 'mature_high';
      message = 'Maturazione avanzata.';
      detail = `L'impasto è al limite superiore della maturazione per W ${flourW}: massima estensibilità, maneggiare con cura in stesura.`;
    }

    return {
      status,
      ratio: Math.round(ratio * 100) / 100,
      enzymaticUnits: Math.round(enzymaticUnits * 10) / 10,
      targetUnits: Math.round(targetUnits * 10) / 10,
      message,
      detail
    };
  }

  /**
   * Calcolo Impasto Diretto Completo
   */
  function calculateDirectDough(options) {
    const {
      numBalls = 6,
      ballWeight = 260,
      totalDoughWeight, // Se fornito direttamente al posto di numBalls*ballWeight
      hydration = 65,
      saltPct = 2.8,
      fatPct = 0,
      sugarPct = 0,
      ambientTemp = 21,
      hoursRoomPuntata = 2,
      hoursFridge = 0,
      fridgeTemp = 4,
      hoursRoomAppretto = 6,
      flourW = 280,
      yeastType = 'fresh', // 'fresh', 'dry', 'ady', 'madre', 'licoli'
      sourdoughPct = 15, // Usato se yeastType è 'madre' o 'licoli'
      targetTFI = 23,
      flourTemp = 20,
      friction = 5,
      tapWaterTemp = 18,
      isPrudentialMode = false,
      ovenType = 'forno_casa_250'
    } = options;

    const targetDoughWeight = totalDoughWeight || (numBalls * ballWeight);

    // 1. Calcolo EFU e cinetica lievito
    const efu = calculateEffectiveFermentationUnits({
      hoursRoomPuntata,
      hoursFridge,
      fridgeTemp,
      hoursRoomAppretto,
      ambientTemp,
      targetTFI
    });

    const yeastPctObj = calculateYeastPercentage(efu.totalEFU, saltPct, hydration, fatPct);

    // Cuscinetto prudenziale lievito (-10% lievito commerciale per sicurezza contro sovrafermentazioni a T ignota)
    if (isPrudentialMode) {
      yeastPctObj.freshYeastPct = Math.round(yeastPctObj.freshYeastPct * 0.90 * 1000) / 1000;
      yeastPctObj.idyPct = Math.round(yeastPctObj.idyPct * 0.90 * 1000) / 1000;
      yeastPctObj.adyPct = Math.round(yeastPctObj.adyPct * 0.90 * 1000) / 1000;
    }

    // 2. Determinazione percentuale lievito selezionato per Baker's Math
    let activeYeastPct = 0;
    if (yeastType === 'fresh') activeYeastPct = yeastPctObj.freshYeastPct;
    else if (yeastType === 'dry') activeYeastPct = yeastPctObj.idyPct;
    else if (yeastType === 'ady') activeYeastPct = yeastPctObj.adyPct;
    else if (yeastType === 'madre' || yeastType === 'licoli') activeYeastPct = sourdoughPct;

    // 3. Risoluzione Baker's Percentages
    // MassaTotale = FarinaTotale * (1 + (H + Salt + Fat + Sugar + Yeast) / 100)
    // Per Lievito Madre e Licoli, il lievito apporta farina e acqua, quindi gestiamo la stechiometria:
    let totalFlourEquivalent = 0;
    let totalWaterEquivalent = 0;
    let flour = 0;
    let water = 0;
    let salt = 0;
    let fat = 0;
    let sugar = 0;
    let yeastGrams = 0;
    let licoliGrams = 0;
    let pastaMadreGrams = 0;

    const baseSumPct = 1 + ((hydration + saltPct + fatPct + sugarPct) / 100);

    if (yeastType === 'licoli') {
      // Licoli è 50% farina e 50% acqua
      // La ricetta complessiva ha farina totale F_tot = targetDough / (baseSumPct + sourdoughPct/100 * ...)
      // Più precisamente:
      totalFlourEquivalent = targetDoughWeight / (baseSumPct);
      licoliGrams = Math.round(totalFlourEquivalent * (sourdoughPct / 100) * 10) / 10;
      
      const licoliFlour = licoliGrams / 2;
      const licoliWater = licoliGrams / 2;

      totalWaterEquivalent = totalFlourEquivalent * (hydration / 100);
      flour = Math.round((totalFlourEquivalent - licoliFlour) * 10) / 10;
      water = Math.round((totalWaterEquivalent - licoliWater) * 10) / 10;
      salt = Math.round(totalFlourEquivalent * (saltPct / 100) * 10) / 10;
      fat = Math.round(totalFlourEquivalent * (fatPct / 100) * 10) / 10;
      sugar = Math.round(totalFlourEquivalent * (sugarPct / 100) * 10) / 10;
      yeastGrams = licoliGrams;
    } else if (yeastType === 'madre') {
      // Pasta madre solida è 66.7% farina e 33.3% acqua (idratazione 50%)
      totalFlourEquivalent = targetDoughWeight / baseSumPct;
      pastaMadreGrams = Math.round(totalFlourEquivalent * (sourdoughPct / 100) * 10) / 10;

      const madreFlour = pastaMadreGrams * (2 / 3);
      const madreWater = pastaMadreGrams * (1 / 3);

      totalWaterEquivalent = totalFlourEquivalent * (hydration / 100);
      flour = Math.round((totalFlourEquivalent - madreFlour) * 10) / 10;
      water = Math.round((totalWaterEquivalent - madreWater) * 10) / 10;
      salt = Math.round(totalFlourEquivalent * (saltPct / 100) * 10) / 10;
      fat = Math.round(totalFlourEquivalent * (fatPct / 100) * 10) / 10;
      sugar = Math.round(totalFlourEquivalent * (sugarPct / 100) * 10) / 10;
      yeastGrams = pastaMadreGrams;
    } else {
      // Lieviti commerciali (LBF / IDY / ADY)
      const bakerTotalPct = 1 + ((hydration + saltPct + fatPct + sugarPct + activeYeastPct) / 100);
      flour = Math.round((targetDoughWeight / bakerTotalPct) * 10) / 10;
      totalFlourEquivalent = flour;
      totalWaterEquivalent = Math.round(flour * (hydration / 100) * 10) / 10;
      water = totalWaterEquivalent;
      salt = Math.round(flour * (saltPct / 100) * 10) / 10;
      fat = Math.round(flour * (fatPct / 100) * 10) / 10;
      sugar = Math.round(flour * (sugarPct / 100) * 10) / 10;
      yeastGrams = Math.round(flour * (activeYeastPct / 100) * 100) / 100;
    }

    const yeastFreshGrams = Math.round(totalFlourEquivalent * (yeastPctObj.freshYeastPct / 100) * 100) / 100;
    const yeastDryGrams = Math.round(totalFlourEquivalent * (yeastPctObj.idyPct / 100) * 100) / 100;
    const yeastAdyGrams = Math.round(totalFlourEquivalent * (yeastPctObj.adyPct / 100) * 100) / 100;

    // 4. Termodinamica
    const thermodynamics = calculateThermodynamics({
      targetTemp: targetTFI,
      roomTemp: ambientTemp,
      flourTemp,
      friction,
      totalWater: water,
      tapWaterTemp
    });

    // 5. Analisi Maturazione
    const maturation = analyzeMaturation(flourW, hoursRoomPuntata + hoursRoomAppretto, hoursFridge);

    // 6. Analisi Forno & Consigli Cottura
    const ovenInfo = OVENS[ovenType] || OVENS.forno_casa_250;
    const ovenAdvice = [];
    if (ovenType === 'forno_casa_250' && (fatPct < 1.5 || sugarPct < 0.5)) {
      ovenAdvice.push("💡 Per forno casalingo standard (250°C), consigliato aggiungere 2-3% Olio EVO e 1% Zucchero/Malto: a 250°C la cottura è più lunga (8-12 min) e senza grassi/zuccheri la pizza perde troppa umidità risultando dura e pallida.");
    }
    if ((ovenType === 'forno_elettrico_pro' || ovenType === 'forno_gas_pizza' || ovenType === 'forno_legna') && sugarPct > 0) {
      ovenAdvice.push("⚠️ Attenzione: nei forni da pizza ad altissima temperatura (>450°C) non inserire zuccheri né malto: carbonizzerebbero rapidamente bruciando la pizza in 40 secondi!");
    }

    return {
      totalDough: targetDoughWeight,
      numBalls,
      ballWeight: totalDoughWeight ? Math.round(totalDoughWeight / numBalls) : ballWeight,
      flour,
      water,
      salt,
      fat,
      sugar,
      yeastGrams,
      yeastType,
      yeastPct: activeYeastPct,
      yeastFresh: yeastFreshGrams,
      yeastDry: yeastDryGrams,
      yeastAdy: yeastAdyGrams,
      licoliGrams,
      pastaMadreGrams,
      totalFlourEquivalent,
      totalWaterEquivalent,
      hydration,
      saltPct,
      fatPct,
      sugarPct,
      efu,
      thermodynamics,
      maturation,
      isPrudentialMode,
      ovenType,
      ovenInfo,
      ovenAdvice
    };
  }

  /**
   * Metodo Indiretto con Biga (100% o parziale)
   */
  function calculatePrefermentBiga(options) {
    const {
      totalFlour = 1000,
      totalHydration = 70,
      totalSaltPct = 2.5,
      totalFatPct = 0,
      totalSugarPct = 0,
      bigaFlourPct = 100, // % di farina totale da inserire nella biga (es. 100% o 50%)
      bigaHydration = 45, // tipicamente 44-50%
      bigaYeastPct = null, // se null: 1.0% per standard (18°C), 1.2% per cold (4°C)
      bigaType = 'standard', // 'standard' (16-18h a 18°C) oppure 'cold' (Biga Fredda da frigo: 2h TA + 24-48h frigo a 4°C + 1-2h acclimatamento)
      coldHours = 24,       // ore in frigorifero per biga fredda
      maltPct = 0.5        // estratto di malto diastatico opzionale nel rinfresco
    } = options;

    const isCold = bigaType === 'cold';
    const effectiveBigaYeastPct = (bigaYeastPct !== null && bigaYeastPct !== undefined)
      ? bigaYeastPct
      : (isCold ? 1.2 : 1.0);

    const bigaFlour = Math.round(totalFlour * (bigaFlourPct / 100));
    const bigaWater = Math.round(bigaFlour * (bigaHydration / 100));
    const bigaYeastFresh = Math.round(bigaFlour * (effectiveBigaYeastPct / 100) * 10) / 10;
    const bigaYeastDry = Math.round((bigaYeastFresh / 3) * 10) / 10;

    const totalWater = Math.round(totalFlour * (totalHydration / 100));
    const totalSalt = Math.round(totalFlour * (totalSaltPct / 100) * 10) / 10;
    const totalFat = Math.round(totalFlour * (totalFatPct / 100) * 10) / 10;
    const totalSugar = Math.round(totalFlour * (totalSugarPct / 100) * 10) / 10;
    const maltGrams = Math.round(totalFlour * (maltPct / 100) * 10) / 10;

    // Chiusura / Rinfresco
    const refreshFlour = Math.round(totalFlour - bigaFlour);
    const refreshWater = Math.round(totalWater - bigaWater);

    const totalDough = totalFlour + totalWater + totalSalt + totalFat + totalSugar + bigaYeastFresh + maltGrams;

    const bigaInstructions = isCold
      ? `Impastare brevemente a spirale (o a mano) per 3-4 minuti: l'impasto deve risultare grezzo, slegato e asciutto, senza formare maglia glutinica (temperatura finale ottimale: 18-20°C). Lasciare riposare 1-2 ore a temperatura ambiente per lo Start Fermentativo dei lieviti, quindi sigillare in mastello ermetico e riporre in frigorifero a 4°C per ${coldHours} ore. Estrarre dal frigorifero 1-2 ore prima del rinfresco per acclimatare la massa (target 16-18°C al cuore).`
      : "Impastare brevemente a spirale (o a mano) per 3-4 minuti senza formare maglia glutinica ('grezza e slegata'). Temperatura finale biga ottimale: 18-20°C. Riposo: 16-18 ore a 18°C.";

    const refreshInstructions = isCold
      ? "Spezzettare la biga fredda (acclimatata a 16-18°C) nella vasca dell'impastatrice. Aggiungere la restante farina, il malto e il 70% dell'acqua fredda di rinfresco. Incordare a velocità sostenuta (chiusura ad alta idratazione). A maglia formata, inserire il sale e l'acqua restante a filo fino al completo assorbimento."
      : "Spezzettare la biga nella vasca. Aggiungere la restante farina, l'eventuale malto e il 70% dell'acqua rimasta. Incordare a velocità sostenuta, quindi inserire il sale e l'acqua a filo fino al completo assorbimento.";

    return {
      totalDough,
      totalFlour,
      totalWater,
      totalSalt,
      totalFat,
      totalSugar,
      maltGrams,
      bigaType: isCold ? 'cold' : 'standard',
      coldHours: isCold ? coldHours : 0,
      biga: {
        flour: bigaFlour,
        water: bigaWater,
        yeastFresh: bigaYeastFresh,
        yeastDry: bigaYeastDry,
        hydration: bigaHydration,
        flourPct: bigaFlourPct,
        instructions: bigaInstructions
      },
      refreshment: {
        flour: refreshFlour,
        water: refreshWater,
        salt: totalSalt,
        fat: totalFat,
        sugar: totalSugar,
        malt: maltGrams,
        instructions: refreshInstructions
      }
    };
  }

  /**
   * Metodo Indiretto con Poolish
   */
  function calculatePrefermentPoolish(options) {
    const {
      totalFlour = 1000,
      totalHydration = 68,
      totalSaltPct = 2.5,
      totalFatPct = 0,
      poolishFlourPct = 30, // solitamente dal 20% al 50% o 100%
      poolishHours = 8      // durata prefermento (determina il lievito)
    } = options;

    // Percentuale lievito fresco su farina poolish in funzione delle ore (a 20°C)
    let yeastPctOnPoolish = 1.0;
    if (poolishHours <= 3) yeastPctOnPoolish = 2.0;
    else if (poolishHours <= 5) yeastPctOnPoolish = 1.2;
    else if (poolishHours <= 8) yeastPctOnPoolish = 0.5;
    else if (poolishHours <= 12) yeastPctOnPoolish = 0.25;
    else yeastPctOnPoolish = 0.1; // 15-18 ore

    const poolishFlour = Math.round(totalFlour * (poolishFlourPct / 100));
    const poolishWater = poolishFlour; // idratazione 100%
    const poolishYeastFresh = Math.round(poolishFlour * (yeastPctOnPoolish / 100) * 100) / 100;
    const poolishYeastDry = Math.round((poolishYeastFresh / 3) * 100) / 100;

    const totalWater = Math.round(totalFlour * (totalHydration / 100));
    const totalSalt = Math.round(totalFlour * (totalSaltPct / 100) * 10) / 10;
    const totalFat = Math.round(totalFlour * (totalFatPct / 100) * 10) / 10;

    const refreshFlour = Math.round(totalFlour - poolishFlour);
    const refreshWater = Math.round(totalWater - poolishWater);

    const totalDough = totalFlour + totalWater + totalSalt + totalFat + poolishYeastFresh;

    return {
      totalDough,
      totalFlour,
      totalWater,
      totalSalt,
      totalFat,
      poolish: {
        flour: poolishFlour,
        water: poolishWater,
        yeastFresh: poolishYeastFresh,
        yeastDry: poolishYeastDry,
        hours: poolishHours,
        instructions: "Mescolare farina, acqua e lievito in una ciotola fino a creare una crema omogenea. Coprire e lasciar fermentare finché non si forma una superficie concava ricca di bolle."
      },
      refreshment: {
        flour: refreshFlour,
        water: refreshWater,
        salt: totalSalt,
        fat: totalFat,
        instructions: "Versare il poolish maturo nella ciotola dell'impastatrice con la restante farina, incordare aggiungendo l'acqua residua e terminare con il sale e l'olio."
      }
    };
  }

  /**
   * Calcolo Dimensionamento Teglia (Rettangolare o Tonda)
   */
  function calculateTeglia(options) {
    const {
      shape = 'rectangle', // 'rectangle' | 'round'
      length = 40,
      width = 30,
      diameter = 32,
      coefficient = 0.58 // g/cm²: 0.50 sottile/alveolata, 0.58 classica, 0.65 alta/focaccia
    } = options;

    let area = 0;
    if (shape === 'rectangle') {
      area = length * width;
    } else {
      const radius = diameter / 2;
      area = Math.PI * radius * radius;
    }

    const doughWeight = Math.round(area * coefficient);

    return {
      shape,
      area: Math.round(area * 10) / 10,
      coefficient,
      doughWeight
    };
  }

  // --- DIZIONARIO IMPASTATRICI & ATTRITI MECCANICI ---
  const MIXERS = {
    a_mano: {
      name: "Impasto a mano",
      friction: 1,
      tip: "👐 <strong>Impasto a mano:</strong> Trasferimento termico minimo (~1°C dalle sole mani). Per idratazioni elevate (>65%), effettua pause di riposo di 15-20 min e pieghe di rinforzo (slap & fold)."
    },
    forcella: {
      name: "Forcella Tradizionale",
      friction: 2,
      tip: "🔱 <strong>Forcella:</strong> Macchina classica da pizzeria napoletana. Bassa velocità, movimento lento che non scalda (~2°C) e non 'strappa' la maglia glutinica. Richiede 18-22 minuti."
    },
    tuffanti: {
      name: "Braccia Tuffanti",
      friction: 3,
      tip: "🤿 <strong>Braccia Tuffanti:</strong> Il massimo per l'ossigenazione dell'impasto. Scalda pochissimo (~3°C), simula perfettamente il movimento umano delle braccia senza stressare le catene proteiche."
    },
    spirale_1: {
      name: "Impastatrice a Spirale (1ª velocità - Bassa)",
      friction: 4,
      tip: "🌀 <strong>Spirale 1ª vel:</strong> Attrito moderato (~4-5°C). Ottima per formare la maglia e incordare impasti tra 60% e 70%. Durata tipica: 10-14 minuti."
    },
    spirale_2: {
      name: "Impastatrice a Spirale (2ª velocità - Alta incordatura)",
      friction: 9,
      tip: "⚡ <strong>Spirale 2ª vel:</strong> Attrito marcato (~9-12°C). Indispensabile per idratazioni estreme (75-85% teglia/pinsa), inserendo l'acqua a filo. Scalda circa 1°C al minuto: richiede acqua a 3-4°C o ghiaccio tritato!"
    },
    planetaria_bassa: {
      name: "Planetaria Casalinga (Bassa vel / Gancio)",
      friction: 6,
      tip: "🥣 <strong>Planetaria (Bassa vel):</strong> Attrito medio (~6°C). La ciotola fissa in inox e l'attrito radente scaldano l'impasto più di una spirale professionale. Non prolungare oltre 12-14 minuti."
    },
    planetaria_alta: {
      name: "Planetaria Casalinga (Media-Alta vel / Foglia-Gancio)",
      friction: 10,
      tip: "🔥 <strong>Planetaria (Media-Alta vel):</strong> Attrito elevato (~10-12°C). Usata con foglia per incordare idratazioni alte prima di passare al gancio. Rischio di surriscaldare e stracciare il glutine: usa ciotola fredda e acqua di frigo a 4°C!"
    },
    custom: {
      name: "Personalizzato...",
      friction: 5,
      tip: "⚙️ <strong>Attrito Personalizzato:</strong> Inserisci il surriscaldamento specifico della tua impastatrice rilevato col termometro."
    }
  };

  // --- DIZIONARIO FORNI & TEMPERATURE DI RIFERIMENTO ---
  const OVENS = {
    forno_casa_250: {
      name: "Forno Elettrico Casalingo Standard (Max 250°C)",
      category: "Casalingo",
      tempRange: "230°C - 250°C",
      targetTemp: 250,
      bakeTimeStr: "8 - 12 minuti",
      preheatMinutes: 35,
      support: "Teglia in ferro blu o leccarda da forno",
      requiresFatAndSugar: true,
      advice: "A 250°C la cottura è prolungata: senza grassi (2-3% olio EVO) e zuccheri (1% malto o miele) la pizza si disidrata, rimanendo dura e biancastra."
    },
    forno_casa_pietra: {
      name: "Forno Casalingo con Pietra Refrattaria o Biscotto (275°C - 300°C)",
      category: "Casalingo Avanzato",
      tempRange: "275°C - 300°C",
      targetTemp: 290,
      bakeTimeStr: "4 - 6 minuti",
      preheatMinutes: 50,
      support: "Pietra refrattaria (posizionata sul ripiano più alto sotto il grill)",
      requiresFatAndSugar: false,
      advice: "Preriscalda la pietra per almeno 50 minuti per accumulare calore radiante. Accendi il grill al massimo negli ultimi 2-3 minuti di cottura per dorare il cornicione."
    },
    fornetto_elettrico: {
      name: "Fornetto Pizza a Conchiglia (es. G3Ferrari, Ariete, Spice) (390°C - 420°C)",
      category: "Semi-professionale",
      tempRange: "390°C - 420°C",
      targetTemp: 400,
      bakeTimeStr: "3 - 4 minuti",
      preheatMinutes: 25,
      support: "Pietra refrattaria integrata o Biscotto Saputo",
      requiresFatAndSugar: false,
      advice: "Forte spinta dal basso. Evita l'aggiunta di zuccheri nell'impasto per non bruciare il fondo a contatto con la pietra rovente."
    },
    forno_elettrico_pro: {
      name: "Forno Elettrico Professionale Pizza (es. Effeuno P134H, Ooni Volt) (450°C - 500°C)",
      category: "Professionale",
      tempRange: "450°C - 500°C",
      targetTemp: 480,
      bakeTimeStr: "60 - 90 secondi",
      preheatMinutes: 45,
      support: "Biscotto di Casapulla o argilla a bassa conducibilità",
      requiresFatAndSugar: false,
      advice: "Temperatura da vera pizzeria napoletana. Regola cielo a 460-480°C e platea a 400-420°C. Assolutamente ZERO olio e ZERO zuccheri nell'impasto!"
    },
    forno_gas_pizza: {
      name: "Forno a Gas da Esterno (es. Ooni Koda, Roccbox, Gozney) (450°C - 500°C)",
      category: "Esterno / Gas",
      tempRange: "450°C - 500°C",
      targetTemp: 480,
      bakeTimeStr: "60 - 90 secondi",
      preheatMinutes: 25,
      support: "Piano in cordierite o biscotto",
      requiresFatAndSugar: false,
      advice: "La fiamma viva laterale richiede di ruotare la pizza di 90° ogni 20 secondi con un palino per una cottura uniforme del cornicione."
    },
    forno_legna: {
      name: "Forno a Legna Tradizionale (450°C - 485°C)",
      category: "Tradizionale",
      tempRange: "450°C - 485°C",
      targetTemp: 480,
      bakeTimeStr: "60 - 90 secondi",
      preheatMinutes: 90,
      support: "Platea in mattoni refrattari / Biscotto sorrentino",
      requiresFatAndSugar: false,
      advice: "Il riferimento assoluto della pizza napoletana STG. Calore radiante della cupola ed essenze di faggio/rovere per un aroma inimitabile."
    },
    forno_teglia_pro: {
      name: "Forno Statico Professionale per Teglia Romana (280°C - 320°C)",
      category: "Teglia / Pala",
      tempRange: "280°C - 320°C",
      targetTemp: 300,
      bakeTimeStr: "10 - 13 minuti",
      preheatMinutes: 45,
      support: "Teglia in ferro blu da 40x30 o 60x40",
      requiresFatAndSugar: false,
      advice: "Taratura consigliata: 75% calore al cielo e 25% alla platea. Spinta dal fondo nei primi 7 minuti per far sviluppare l'alveolatura verticale."
    }
  };

  // --- DATABASE FARINE COMMERCIALI & DATI REOLOGICI ---
  const COMMERCIAL_FLOURS = {
    // Caputo
    caputo_pizzeria: { brand: "Caputo", name: "Caputo Pizzeria (Tipo 00)", w: 260, protein: 12.5, pl: 0.55, maxHydr: 68, category: "Media (W 260)" },
    caputo_cuoco: { brand: "Caputo", name: "Caputo Cuoco / Chef (Tipo 00)", w: 310, protein: 13.0, pl: 0.55, maxHydr: 75, category: "Forte (W 310)" },
    caputo_nuvola: { brand: "Caputo", name: "Caputo Nuvola (Tipo 0)", w: 270, protein: 12.5, pl: 0.55, maxHydr: 72, category: "Media (W 270)" },
    caputo_nuvola_super: { brand: "Caputo", name: "Caputo Nuvola Super (Tipo 0)", w: 330, protein: 13.5, pl: 0.55, maxHydr: 80, category: "Forte (W 330)" },
    caputo_manitoba: { brand: "Caputo", name: "Caputo Manitoba Oro (Tipo 0)", w: 380, protein: 14.5, pl: 0.65, maxHydr: 85, category: "Molto Forte (W 380)" },
    caputo_classica: { brand: "Caputo", name: "Caputo Classica (Tipo 00)", w: 220, protein: 11.5, pl: 0.50, maxHydr: 62, category: "Debole (W 220)" },
    
    // Le 5 Stagioni
    stagioni_napoletana: { brand: "Le 5 Stagioni", name: "5 Stagioni Pizza Napoletana", w: 300, protein: 13.0, pl: 0.55, maxHydr: 74, category: "Forte (W 300)" },
    stagioni_superiore: { brand: "Le 5 Stagioni", name: "5 Stagioni Superiore", w: 330, protein: 13.0, pl: 0.55, maxHydr: 78, category: "Forte (W 330)" },
    stagioni_manitoba: { brand: "Le 5 Stagioni", name: "5 Stagioni Manitoba", w: 390, protein: 14.5, pl: 0.65, maxHydr: 85, category: "Molto Forte (W 390)" },
    
    // Garofalo
    garofalo_w260: { brand: "Garofalo", name: "Garofalo Tipo 0 W 260", w: 260, protein: 12.0, pl: 0.55, maxHydr: 70, category: "Media (W 260)" },
    garofalo_w350: { brand: "Garofalo", name: "Garofalo Tipo 0 W 350", w: 350, protein: 14.0, pl: 0.60, maxHydr: 82, category: "Forte (W 350)" },
    
    // Barilla
    barilla_tipo00: { brand: "Barilla", name: "Barilla Tipo 00 Classica", w: 190, protein: 10.5, pl: 0.50, maxHydr: 60, category: "Debole (W 190)" },
    barilla_manitoba: { brand: "Barilla", name: "Barilla Manitoba Oro", w: 360, protein: 14.0, pl: 0.60, maxHydr: 80, category: "Forte (W 360)" },

    // Spadoni
    spadoni_pizza: { brand: "Molino Spadoni", name: "Spadoni Gran Mugnaio Pizza", w: 210, protein: 11.0, pl: 0.50, maxHydr: 62, category: "Debole (W 210)" },
    spadoni_pulcinella: { brand: "Molino Spadoni", name: "Spadoni Pulcinella Tipo 0", w: 280, protein: 12.5, pl: 0.55, maxHydr: 72, category: "Media (W 280)" },
    spadoni_manitoba: { brand: "Molino Spadoni", name: "Spadoni Manitoba d'America", w: 360, protein: 14.0, pl: 0.60, maxHydr: 82, category: "Forte (W 360)" },

    // Casillo
    casillo_pizza: { brand: "Molino Casillo", name: "Casillo Farina Pizza Tipo 0", w: 280, protein: 12.5, pl: 0.55, maxHydr: 72, category: "Media (W 280)" },
    casillo_super: { brand: "Molino Casillo", name: "Casillo Super Pizza Tipo 0", w: 320, protein: 13.0, pl: 0.55, maxHydr: 76, category: "Forte (W 320)" },
    casillo_manitoba: { brand: "Molino Casillo", name: "Casillo Manitoba Tipo 0", w: 380, protein: 14.5, pl: 0.65, maxHydr: 85, category: "Molto Forte (W 380)" },

    // Divella
    divella_pizza: { brand: "Divella", name: "Divella Pizza Tipo 00", w: 220, protein: 11.5, pl: 0.50, maxHydr: 63, category: "Debole (W 220)" },
    divella_manitoba: { brand: "Divella", name: "Divella Manitoba", w: 350, protein: 14.0, pl: 0.60, maxHydr: 80, category: "Forte (W 350)" },

    // Petra
    petra_5037: { brand: "Petra (Molino Quaglia)", name: "Petra 5037 Pizza", w: 300, protein: 13.0, pl: 0.55, maxHydr: 75, category: "Forte (W 300)" },
    petra_5063: { brand: "Petra (Molino Quaglia)", name: "Petra 5063 Special", w: 260, protein: 12.0, pl: 0.55, maxHydr: 70, category: "Media (W 260)" },

    // Generiche
    generic_debole: { brand: "Generica", name: "Farina Debole da Supermercato (W 180)", w: 180, protein: 10.0, pl: 0.50, maxHydr: 58, category: "Debole (W 180)" },
    generic_media: { brand: "Generica", name: "Farina Media Standard (W 250)", w: 250, protein: 11.5, pl: 0.55, maxHydr: 68, category: "Media (W 250)" },
    generic_forte: { brand: "Generica", name: "Farina Forte / Panettone (W 320)", w: 320, protein: 13.0, pl: 0.55, maxHydr: 76, category: "Forte (W 320)" },
    generic_manitoba: { brand: "Generica", name: "Manitoba Commerciale (W 380)", w: 380, protein: 14.5, pl: 0.65, maxHydr: 85, category: "Molto Forte (W 380)" }
  };

  /**
   * MODALITÀ REVERSE: Ottimizzatore Intelligente
   * Calcola l'assetto perfetto (farina, idratazione, grassi, zuccheri, frigo/TA, lievito e TFI)
   * in base a: stile desiderato + forno a disposizione + farina a disposizione + impastatrice + ore disponibili.
   */
  function optimizeReversePlan(options) {
    const {
      targetStyle = 'napoletana_stg',
      flourKey = 'caputo_pizzeria',
      customFlourW = 280,
      ovenKey = 'forno_casa_250',
      mixerKey = 'spirale_1',
      availableHours = 8,
      numBalls = 4,
      ballWeight = 260,
      ambientTemp = 21,
      targetBakeDate = null,
      isPrudentialMode = false,
      useAutolyse = null,
      useFolds = null,
      useBiga = false
    } = options;

    // 1. Riconoscimento Farina
    let flour = COMMERCIAL_FLOURS[flourKey];
    if (!flour) {
      flour = {
        brand: "Personalizzata",
        name: `Farina Personalizzata (W ${customFlourW})`,
        w: customFlourW || 280,
        protein: 12.0,
        pl: 0.55,
        maxHydr: Math.round(52 + ((customFlourW || 280) * 0.08)),
        category: `W ${customFlourW || 280}`
      };
    }

    // 2. Dati Forno, Impastatrice e Preset base
    const oven = OVENS[ovenKey] || OVENS.forno_casa_250;
    const mixer = MIXERS[mixerKey] || MIXERS.spirale_1;
    const basePreset = PRESETS[targetStyle] || PRESETS.napoletana_stg;

    // 3. Ripartizione Intelligente del Tempo (Puntata vs Frigo vs Appretto)
    let hoursPuntata = 2;
    let hoursFridge = 0;
    let hoursAppretto = 6;
    let strategyNotes = [];
    let compatibilityScore = 100;

    if (availableHours <= 5) {
      // Lievitazione rapida a T.A.
      hoursFridge = 0;
      hoursPuntata = 1;
      hoursAppretto = Math.max(2, availableHours - hoursPuntata);
      strategyNotes.push(`⚡ Lievitazione Express (${availableHours}h a T.A.): gestione diretta a temperatura ambiente senza passaggio in frigorifero.`);
      if (flour.w > 300) {
        compatibilityScore -= 20;
        strategyNotes.push(`⚠️ Farina molto forte (${flour.name} - W ${flour.w}) per sole ${availableHours} ore: consigliata autolisi di 45 minuti con il 60% dell'acqua per accelerare l'idrolisi enzimatica.`);
      }
    } else if (availableHours <= 10) {
      // Gestione classica a T.A. (tipo Napoletana da mattina per sera)
      hoursFridge = 0;
      hoursPuntata = Math.min(3, Math.max(1, Math.round(availableHours * 0.25)));
      hoursAppretto = availableHours - hoursPuntata;
      strategyNotes.push(`🕐 Lievitazione Giornaliera (${availableHours}h a T.A.): ideale per impastare al mattino e cuocere alla sera.`);
      if (flour.w > 320) {
        compatibilityScore -= 15;
        strategyNotes.push(`💡 Farina W ${flour.w} ha un potenziale enzimatico più lungo: con ${availableHours}h la pizza sarà buona ma darà il massimo a 24-48h.`);
      } else if (flour.w < 200) {
        strategyNotes.push(`Farina debole W ${flour.w}: tempi ottimali per non oltrepassare la maturazione.`);
      }
    } else if (availableHours <= 20) {
      // 12-20 ore
      if (flour.w >= 280) {
        hoursPuntata = 2;
        hoursFridge = Math.max(0, availableHours - 6 - hoursPuntata);
        hoursAppretto = availableHours - hoursPuntata - hoursFridge;
        strategyNotes.push(`❄️ Gestione Mista Frigo/T.A.: ${hoursFridge}h a 4°C per rilassare il glutine della farina W ${flour.w}, seguite da ${hoursAppretto}h di appretto a temperatura ambiente.`);
      } else {
        hoursFridge = 0;
        hoursPuntata = Math.round(availableHours * 0.3);
        hoursAppretto = availableHours - hoursPuntata;
        strategyNotes.push(`🏠 Lunga fermentazione a T.A. (${availableHours}h): calibrato dosaggio millimetrico di lievito per non sovralievitare.`);
      }
    } else {
      // 24h, 48h, 72h
      hoursPuntata = 2;
      hoursAppretto = Math.min(6, Math.max(4, Math.round(availableHours * 0.12)));
      hoursFridge = availableHours - hoursPuntata - hoursAppretto;
      strategyNotes.push(`🧊 Maturazione Lunga Controllata a Freddo (${hoursFridge}h in frigo a 4°C + ${hoursAppretto}h di appretto a T.A.): massima digeribilità e scomposizione proteica.`);
      if (flour.w < 260) {
        compatibilityScore -= 30;
        strategyNotes.push(`⚠️ Rischio collasso: la farina selezionata (W ${flour.w}) è debole per un tempo così prolungato (${availableHours}h). Si consiglia una farina con W almeno 300-340 o di ridurre i tempi.`);
      }
    }

    // 4. Ottimizzazione Idratazione in funzione di Farina e Forno
    let optimizedHydration = basePreset.hydration;
    const styleTargetHydration = basePreset.hydration;
    const isFlourTooWeakForStyle = styleTargetHydration > flour.maxHydr;

    if (isFlourTooWeakForStyle) {
      // Preserviamo l'idratazione autentica dello stile per non snaturare la ricetta,
      // ma penalizziamo severamente la compatibilità ed emettiamo un'allerta reologica inequivocabile.
      compatibilityScore -= 35;
      strategyNotes.push(`⚠️ Incompatibilità Reologica Farina/Stile: La vera ${basePreset.name} esige ${styleTargetHydration}% di idratazione per l'alveolatura tipica. Tuttavia la farina ${flour.name} (W ${flour.w}) regge fisiologicamente solo fino a ~${flour.maxHydr}%. Con il ${styleTargetHydration}% l'impasto risulterà eccessivamente bagnato, colloso e cederà in lievitazione/stesura. 👉 Per questo stile DEVI usare una farina con W almeno 300-340. Se vuoi comunque forzare la preparazione, attiva l'Autolisi preventiva e Pieghe multiple a intervalli ravvicinati per stimolare la tenuta meccanica.`);
    }

    let optimizedFatPct = basePreset.fatPct;
    let optimizedSugarPct = basePreset.sugarPct;

    if (oven.requiresFatAndSugar) {
      if (optimizedFatPct < 2.0) optimizedFatPct = 2.5; // Olio EVO per trattenere umidità
      if (optimizedSugarPct < 1.0) optimizedSugarPct = 1.0; // Malto / Zucchero per doratura a 250°C
      if (targetStyle === 'napoletana_stg') {
        // Per STG classica in forno casa 250°C un lieve aumento al 65% previene l'effetto secco
        optimizedHydration = Math.max(optimizedHydration, 65);
        strategyNotes.push(`🔥 Adattamento Forno Casalingo (250°C): aggiunti 2.5% Olio EVO, 1% Malto e idratazione a ${optimizedHydration}% per compensare la cottura lenta ed evitare che la pizza diventi secca o pallida.`);
      } else {
        strategyNotes.push(`🔥 Adattamento Forno Casalingo (250°C): aggiunti 2.5% Olio EVO e 1% Malto per compensare la cottura prolungata senza asciugare l'impasto.`);
      }
    } else if (oven.targetTemp >= 450) {
      optimizedFatPct = 0;
      optimizedSugarPct = 0;
      strategyNotes.push(`🔥 Adattamento Forno ad Alta Temperatura (${oven.targetTemp}°C): esclusi oli e zuccheri per garantire la vera maculatura napoletana senza bruciature.`);
    }

    // 5. Riconoscimento Tecniche Speciali e Modalità Consigliate
    // Se la farina è debole ma l'idratazione è alta, forziamo autolisi e pieghe come tecniche compensative
    const autolyseRecommended = (flour.w >= 290 && availableHours <= 6) || (optimizedHydration >= 72) || isFlourTooWeakForStyle;
    const foldsRecommended = (optimizedHydration >= 68) || isFlourTooWeakForStyle;
    const bigaRecommended = (flour.w >= 300 && availableHours >= 16);

    const activeAutolyse = useAutolyse !== null ? Boolean(useAutolyse) : autolyseRecommended;
    const activeFolds = useFolds !== null ? Boolean(useFolds) : foldsRecommended;
    const activeBiga = Boolean(useBiga);
    const isColdBiga = activeBiga && (availableHours >= 24);

    if (isFlourTooWeakForStyle && (activeAutolyse || activeFolds)) {
      strategyNotes.push(`🛠️ Tecniche Compensative Consigliate: Autolisi preventiva e pieghe di rinforzo suggerite per aiutare la farina debole a reggere l'idratazione elevata del ${styleTargetHydration}%.`);
    }

    if (isPrudentialMode) {
      strategyNotes.push(`🛡️ Stima Prudenziale attiva: applicato margine di sicurezza (-10% lievito) per prevenire sovralievitazioni.`);
    }

    if (activeAutolyse) {
      strategyNotes.push(`🥣 Autolisi Preventiva inclusa (45 min): la farina viene idratata al 60% prima dell'impasto, sviluppando spontaneamente estensibilità e riducendo l'attrito meccanico.`);
    }

    if (activeFolds) {
      strategyNotes.push(`🤲 Pieghe di Rinforzo incluse: 3 serie a intervalli di 20 min in puntata per strutturare l'idratazione elevata (${optimizedHydration}%).`);
    }

    if (activeBiga) {
      if (isColdBiga) {
        strategyNotes.push(`❄️ Metodo Indiretto Biga Fredda (4°C) attivo: ideale per maturazioni lunghe (${availableHours}h disponibili) con farina forte W ${flour.w}. Include 2h di avvio a T.A. + maturazione in frigo a 4°C + 2h di acclimatamento prima del rinfresco.`);
      } else {
        strategyNotes.push(`🥖 Metodo Indiretto Biga attivo (16-18h a 18°C): consigliato con la farina W ${flour.w} per alveolatura e croccantezza superiore.`);
      }
    }

    // 6. Calcolo della Ricetta Definitiva
    const flourTemp = Math.round((ambientTemp - 0.5) * 10) / 10;
    const directResult = calculateDirectDough({
      numBalls,
      ballWeight,
      hydration: optimizedHydration,
      saltPct: basePreset.saltPct || 2.5,
      fatPct: optimizedFatPct,
      sugarPct: optimizedSugarPct,
      ambientTemp,
      hoursRoomPuntata: hoursPuntata,
      hoursFridge,
      fridgeTemp: 4,
      hoursRoomAppretto: hoursAppretto,
      flourW: flour.w,
      yeastType: 'fresh',
      targetTFI: 23,
      flourTemp,
      friction: mixer.friction,
      ovenType: ovenKey,
      isPrudentialMode: Boolean(isPrudentialMode)
    });

    const autolyseWater = Math.round(directResult.flour * 0.60 * 10) / 10;
    const closingWater = Math.max(0, Math.round((directResult.water - autolyseWater) * 10) / 10);

    // 7. Generazione Procedure Operative Dettagliate
    const procedures = [];
    let stepNum = 1;

    if (activeBiga) {
      const bigaFlour = directResult.flour;
      const bigaWater = Math.round(bigaFlour * 0.45 * 10) / 10;
      const bigaYeast = isColdBiga
        ? Math.round(bigaFlour * 0.012 * 100) / 100 // 1.2% per biga fredda
        : Math.round(bigaFlour * 0.01 * 100) / 100; // 1.0% per biga tradizionale a 18°C
      const refreshWater = Math.max(0, Math.round((directResult.water - bigaWater) * 10) / 10);
      const coldBigaHours = Math.max(16, Math.round(availableHours - 8));

      if (isColdBiga) {
        procedures.push({
          step: stepNum++,
          title: "❄️ Fase 1: Impasto Biga Fredda & Start Fermentativo a T.A. (2 ore)",
          desc: `Unire tutta la farina (${Math.round(bigaFlour)}g), ${Math.round(bigaWater)}g di acqua (45%) e ${Math.max(1, Math.round(bigaYeast))}g di lievito fresco (1.2% per biga fredda da frigo). Impastare per soli 3-4 minuti a velocità 1: l'impasto deve rimanere slegato, grezzo e asciutto (target 18-20°C). Lasciare riposare per 2 ore a temperatura ambiente (${ambientTemp}°C) in ciotola coperta per attivare la moltiplicazione dei lieviti prima del freddo.`,
          tip: "Non incordare la biga! Deve sembrare un agglomerato di briciole asciutte."
        });

        procedures.push({
          step: stepNum++,
          title: `🧊 Fase 2: Maturazione Biga in Frigorifero (4°C per ${coldBigaHours} ore)`,
          desc: `Trasferire la biga in un mastello/contenitore con coperchio ermetico e riporla in frigorifero a 4°C per circa ${coldBigaHours} ore. A 4°C l'attività fermentativa rallenta mentre gli enzimi maturano amidi e glutine, sviluppando acidità acetica e aromi complessi.`,
          tip: "Assicurati che il contenitore permetta un leggero rigonfiamento (+30-40%)."
        });

        procedures.push({
          step: stepNum++,
          title: "🌡️ Fase 3: Acclimatamento Biga (2 ore prima del rinfresco)",
          desc: "Estrarre la biga dal frigorifero 2 ore prima dell'impasto finale e lasciarla a temperatura ambiente: la massa deve raggiungere circa 16-18°C al cuore prima di essere lavorata.",
          tip: "Non rinfrescare mai la biga a 4°C: il glutine freddo si spezzerebbe e non legherebbe l'acqua!"
        });

        procedures.push({
          step: stepNum++,
          title: "⚙️ Fase 4: Rinfresco e Chiusura Impasto",
          desc: `Spezzettare la biga acclimatata nella vasca dell'impastatrice. Aggiungere il malto, l'eventuale farina residua e il 70% dell'acqua di rinfresco (${Math.round(refreshWater)}g totali). Iniziare ad impastare a velocità sostenuta. A maglia formata, inserire il sale (${Math.round(directResult.salt)}g) e l'acqua restante a filo${directResult.fat > 0 ? ', quindi l\'olio EVO (' + Math.round(directResult.fat) + 'g)' : ''}.`,
          tip: `Per l'acqua di rinfresco usa acqua molto fredda da frigo (${directResult.thermodynamics.waterTemp.toFixed(1)}°C) per compensare l'attrito e chiudere a 23°C.`
        });
      } else {
        procedures.push({
          step: stepNum++,
          title: "🌾 Fase 1: Impasto e Fermentazione Biga (16-18 ore prima)",
          desc: `Unire tutta la farina (${Math.round(bigaFlour)}g), ${Math.round(bigaWater)}g di acqua (45%) e ${Math.max(1, Math.round(bigaYeast))}g di lievito fresco (1%). Mescolare per soli 3-4 minuti: l'impasto deve rimanere slegato e grezzo, non compatto né incordato. Lasciare riposare a 18°C per 16-18 ore.`,
          tip: "La temperatura ideale della biga finita deve essere attorno a 18°C. Non scaldarla!"
        });

        procedures.push({
          step: stepNum++,
          title: "⚙️ Fase 2: Rinfresco e Chiusura Impasto",
          desc: `Spezzettare la biga nella ciotola dell'impastatrice. Aggiungere l'eventuale lievito residuo (${Math.max(0, Math.round(directResult.yeastGrams - bigaYeast))}g) e una parte dell'acqua di rinfresco (${Math.round(refreshWater)}g totali). Iniziare ad impastare a 1ª velocità. A maglia formata, inserire il sale (${Math.round(directResult.salt)}g) e l'acqua restante a filo${directResult.fat > 0 ? ', quindi l\'olio EVO (' + Math.round(directResult.fat) + 'g)' : ''}.`,
          tip: `Per l'acqua di rinfresco usa acqua molto fredda da frigo (${directResult.thermodynamics.waterTemp.toFixed(1)}°C) per compensare l'attrito e chiudere a 23°C.`
        });
      }
    } else {
      if (activeAutolyse) {
        procedures.push({
          step: stepNum++,
          title: "🥣 Fase 1: Autolisi Preventiva (45 minuti)",
          desc: `Versare nella ciotola tutta la farina (${Math.round(directResult.flour)}g) e ${Math.round(autolyseWater)}g di acqua (60% idratazione di autolisi). Mescolare rapidamente per 2-3 minuti solo fino ad assorbire la farina, senza impastare a lungo e ASSOLUTAMENTE SENZA lievito né sale. Coprire e lasciare a riposo per 45 minuti a temperatura ambiente (${ambientTemp}°C).`,
          tip: "L'autolisi rompe parzialmente le catene proteiche e gli amidi, rendendo la pasta incredibilmente estensibile e riducendo il tempo di impastamento finale."
        });

        procedures.push({
          step: stepNum++,
          title: "⚙️ Fase 2: Chiusura e Incordatura Finale",
          desc: `Unire alla massa in autolisi il lievito (${Math.max(1, Math.round(directResult.yeastGrams))}g LBF o ${Math.max(1, Math.round(directResult.yeastGrams / 3))}g IDY). Avviare l'impastatrice a velocità 1 inserendo a filo la restante acqua (${Math.round(closingWater)}g). Non appena la massa si raccoglie attorno al gancio/spirale, aggiungere il sale (${Math.round(directResult.salt)}g)${directResult.sugar > 0 ? ', il malto/zucchero (' + Math.round(directResult.sugar) + 'g)' : ''}${directResult.fat > 0 ? ' e infine l\'olio EVO (' + Math.round(directResult.fat) + 'g)' : ''}. Incordare fino a maglia liscia e velo sottile.`,
          tip: `Temperatura acqua consigliata: ${directResult.thermodynamics.waterTemp.toFixed(1)}°C per chiusura perfetta a 23°C.`
        });
      } else {
        procedures.push({
          step: stepNum++,
          title: "⚙️ Fase 1: Impastamento Diretto",
          desc: `Versare tutta la farina (${Math.round(directResult.flour)}g) con il lievito (${Math.max(1, Math.round(directResult.yeastGrams))}g LBF o ${Math.max(1, Math.round(directResult.yeastGrams / 3))}g IDY) e il 75% dell'acqua (${Math.round(directResult.water * 0.75)}g a ${directResult.thermodynamics.waterTemp.toFixed(1)}°C). Avviare l'impasto. A maglia abbozzata, aggiungere il sale (${Math.round(directResult.salt)}g) e la restante acqua a filo${directResult.fat > 0 ? ' e l\'olio EVO (' + Math.round(directResult.fat) + 'g)' : ''}.`,
          tip: `Incordare senza surriscaldare: target finale 23°C (TFI).`
        });
      }

      if (activeFolds && hoursPuntata > 0) {
        procedures.push({
          step: stepNum++,
          title: "🤲 Fase Pieghe di Rinforzo",
          desc: "Durante la prima ora di puntata, eseguire 3 serie di pieghe a tre (slap & fold sul piano o coil folds in ciotola) distanziate di 20 minuti l'una dall'altra. Questo passaggio asciuga l'impasto e conferisce tensione ed elasticità alla maglia glutinica.",
          tip: "Inumidirsi leggermente le mani con acqua fresca per evitare che l'impasto si attacchi."
        });
      }

      procedures.push({
        step: stepNum++,
        title: hoursFridge > 0 ? `🧊 Fase Puntata & Maturazione in Frigo (${hoursFridge}h a 4°C)` : `🏠 Fase Puntata a T.A. (${hoursPuntata}h)`,
        desc: hoursFridge > 0
          ? `Lasciare puntare la massa a T.A. per ${hoursPuntata} ore, poi trasferirla in contenitore ermetico oleato in frigo a 4°C per ${hoursFridge} ore per la maturazione enzimatica profonda.`
          : `Lasciare riposare la massa in blocco coperta a ${ambientTemp}°C per ${hoursPuntata} ore.`,
        tip: hoursFridge > 0 ? "Estrarre dal frigo circa 1 ora prima dello staglio per far tornare la massa a temperatura lavorabile." : "Non muovere la massa durante la puntata."
      });

      procedures.push({
        step: stepNum++,
        title: `⚖️ Fase Staglio e Appretto (${hoursAppretto}h a T.A.)`,
        desc: `Porzionare l'impasto in ${numBalls} panetti da ${ballWeight}g ciascuno. Pirlare con decisione per creare una superficie tesa e liscia. Disporre nei cassetti o contenitori per lievitazione per ${hoursAppretto} ore a ${ambientTemp}°C.`,
        tip: "Al momento della stesura i panetti devono essere soffici e cedevoli al tocco, senza ritirarsi."
      });

      procedures.push({
        step: stepNum++,
        title: `🔥 Fase Stesura e Cottura (${oven.name})`,
        desc: `Preriscaldare il forno per ${oven.preheatMinutes} minuti (${oven.tempRange}). Allargare il panetto su semola rimacinata partendo dal centro verso il cornicione. Condire e infornare per ${oven.bakeTimeStr}.`,
        tip: oven.advice
      });
    }

    // 8. Generazione Timeline dedicata
    const bakeDate = targetBakeDate || new Date(Date.now() + (availableHours * 3600 * 1000));
    const timeline = generateTimeline({
      bakeDate,
      hoursRoomPuntata: hoursPuntata,
      hoursFridge,
      acclimationHours: hoursFridge > 0 ? 1 : 0,
      hoursRoomAppretto: hoursAppretto,
      isIndirect: activeBiga,
      isColdBiga: Boolean(isColdBiga),
      prefermentHours: isColdBiga ? Math.max(20, Math.round(availableHours - 4)) : 16,
      useAutolyse: activeAutolyse,
      autolyseMinutes: 45,
      autolyseWaterGrams: autolyseWater,
      useFolds: activeFolds,
      ovenPreheatMinutes: oven.preheatMinutes,
      ovenName: oven.name
    });

    return {
      compatibilityScore: Math.max(20, Math.min(100, compatibilityScore)),
      styleName: basePreset.name,
      flour,
      oven,
      mixer,
      availableHours,
      autolyseSuggested: autolyseRecommended,
      isColdBiga: Boolean(isColdBiga),
      recommendations: {
        autolyseRecommended,
        foldsRecommended,
        bigaRecommended
      },
      activeTechniques: {
        activeAutolyse,
        activeFolds,
        activeBiga
      },
      autolyseWater,
      closingWater,
      procedures,
      strategyNotes,
      parameters: {
        numBalls,
        ballWeight,
        hydration: optimizedHydration,
        saltPct: basePreset.saltPct || 2.5,
        fatPct: optimizedFatPct,
        sugarPct: optimizedSugarPct,
        hoursRoomPuntata: hoursPuntata,
        hoursFridge,
        hoursRoomAppretto: hoursAppretto,
        flourW: flour.w,
        friction: mixer.friction,
        ambientTemp,
        ovenType: ovenKey,
        mixerKey,
        isPrudentialMode: Boolean(isPrudentialMode),
        useAutolyse: activeAutolyse,
        useFolds: activeFolds,
        useBiga: activeBiga
      },
      recipe: directResult,
      timeline: timeline.steps || timeline,
      rawTimeline: timeline
    };
  }

  /**
   * Generatore di Cronoprogramma Temporale a Ritroso (Timeline Planner)
   * Corretto per eliminare step ridondanti quando hoursRoomPuntata = 0 e ordinamento garantito
   */
  function generateTimeline(options) {
    const {
      bakeDate = new Date(),
      hoursRoomPuntata = 2,
      hoursFridge = 24,
      acclimationHours = 1, // tempo uscita frigo prima dello staglio
      hoursRoomAppretto = 5,
      isIndirect = false,
      prefermentHours = 16,
      useAutolyse = false,
      autolyseMinutes = 45,
      autolyseWaterGrams = null,
      useFolds = false,
      ovenPreheatMinutes = 45,
      ovenName = "Forno"
    } = options;

    const STEP_ORDER = {
      preferment: 1,
      autolyse: 2,
      mixing: 3,
      folds: 4,
      puntata: 5,
      in_fridge: 6,
      out_fridge: 7,
      staglio: 8,
      oven: 9,
      bake: 10
    };

    const steps = [];
    const bakeTime = new Date(bakeDate).getTime();

    // 1. Infornata
    steps.push({
      id: 'bake',
      priority: STEP_ORDER.bake,
      time: new Date(bakeTime),
      label: 'Infornata e Cottura Pizza',
      desc: 'Forno a temperatura ottimale, stesura del panetto, farcitura e cottura.',
      duration: 'Cottura'
    });

    // 2. Preriscaldamento forno
    const actualPreheatMinutes = ovenPreheatMinutes || 45;
    const ovenPreheatTime = bakeTime - (actualPreheatMinutes * 60 * 1000);
    steps.push({
      id: 'oven',
      priority: STEP_ORDER.oven,
      time: new Date(ovenPreheatTime),
      label: `Accensione e Preriscaldamento (${ovenName})`,
      desc: `Accendere il forno e portare camera e refrattaria a regime termico (${actualPreheatMinutes} min prima dell'infornata).`,
      duration: `${actualPreheatMinutes} min prima`
    });

    // 3. Staglio dei panetti (Inizio Appretto)
    const staglioTime = bakeTime - (hoursRoomAppretto * 3600 * 1000);
    steps.push({
      id: 'staglio',
      priority: STEP_ORDER.staglio,
      time: new Date(staglioTime),
      label: 'Staglio e Formatura Panetti (Inizio Appretto)',
      desc: `Divisione dell'impasto nei panetti del peso target, pirlatura stretta e messa a lievitare nei contenitori a T.A. per ${hoursRoomAppretto} ore.`,
      duration: `${hoursRoomAppretto}h di appretto`
    });

    let currentCursor = staglioTime;

    // 4. Frigorifero (se previsto)
    if (hoursFridge > 0) {
      if (acclimationHours > 0) {
        const outFridgeTime = staglioTime - (acclimationHours * 3600 * 1000);
        steps.push({
          id: 'out_fridge',
          priority: STEP_ORDER.out_fridge,
          time: new Date(outFridgeTime),
          label: 'Estrazione Impasto dal Frigorifero',
          desc: `Togliere la massa dal frigo e lasciarla a temperatura ambiente per ${acclimationHours}h per far rilassare la maglia glutinica prima dello staglio.`,
          duration: `${acclimationHours}h di acclimatamento`
        });
        currentCursor = outFridgeTime;
      }

      const inFridgeTime = currentCursor - (hoursFridge * 3600 * 1000);
      steps.push({
        id: 'in_fridge',
        priority: STEP_ORDER.in_fridge,
        time: new Date(inFridgeTime),
        label: 'Messa in Cella / Frigorifero (4°C)',
        desc: `Trasferire il contenitore ermetico in frigo per la maturazione enzimatica controllata (${hoursFridge} ore).`,
        duration: `${hoursFridge}h a 4°C`
      });
      currentCursor = inFridgeTime;
    }

    // 5. Puntata a Temperatura Ambiente (SOLO se hoursRoomPuntata > 0)
    let puntataStartTime = currentCursor;
    if (hoursRoomPuntata > 0) {
      puntataStartTime = currentCursor - (hoursRoomPuntata * 3600 * 1000);
      steps.push({
        id: 'puntata',
        priority: STEP_ORDER.puntata,
        time: new Date(puntataStartTime),
        label: 'Chiusura Impasto e Inizio Puntata a T.A.',
        desc: `Misurare la TFI con termometro a sonda (target ~23°C). Dare pieghe di rinforzo e lasciar riposare la massa in blocco per ${hoursRoomPuntata} ore.`,
        duration: `${hoursRoomPuntata}h di puntata`
      });
      currentCursor = puntataStartTime;

      // Pieghe di rinforzo opzionali
      if (useFolds) {
        const foldsTime = puntataStartTime + (20 * 60 * 1000);
        steps.push({
          id: 'folds',
          priority: STEP_ORDER.folds,
          time: new Date(foldsTime),
          label: '🤲 Pieghe di Rinforzo (3 serie ogni 20 min)',
          desc: 'Eseguire 3 serie di pieghe a tre (slap & fold o coil folds in ciotola) distanziate di 20 minuti per rafforzare la maglia glutinica e dare verticalità.',
          duration: '1h totale'
        });
      }
    }

    // 6. Preparazione e Impastamento (30 min prima)
    const mixingTime = currentCursor - (30 * 60 * 1000);
    let mixingDesc = 'Pesatura ingredienti, calibrazione temperatura acqua e avvio impasto fino a completa incordatura.';
    if (useAutolyse) {
      mixingDesc = 'Unione del lievito alla massa autolitica, inserimento acqua residua a filo, sale e chiusura incordatura.';
    } else if (hoursRoomPuntata === 0) {
      if (hoursFridge > 0) {
        mixingDesc = 'Impasto e incordatura rapida. Senza puntata a T.A., la massa viene trasferita direttamente in frigo a 4°C (puntata a freddo).';
      } else {
        mixingDesc = 'Impasto e incordatura rapida. Si procede direttamente allo staglio immediato dei panetti (nessuna puntata).';
      }
    }

    steps.push({
      id: 'mixing',
      priority: STEP_ORDER.mixing,
      time: new Date(mixingTime),
      label: useAutolyse ? 'Chiusura Impasto post-Autolisi' : 'Preparazione Ingredienti e Impastamento',
      desc: mixingDesc,
      duration: '30 min'
    });

    // 7. Autolisi Preventiva (se attiva)
    if (useAutolyse) {
      const autolyseTime = mixingTime - (autolyseMinutes * 60 * 1000);
      steps.push({
        id: 'autolyse',
        priority: STEP_ORDER.autolyse,
        time: new Date(autolyseTime),
        label: `🥣 Inizio Autolisi Preventiva (${autolyseMinutes} min)`,
        desc: `Mescolare grossolanamente tutta la farina con l'acqua di autolisi (${autolyseWaterGrams ? autolyseWaterGrams + 'g' : '60%'}), senza lievito né sale. Riposo coperto per ${autolyseMinutes} min a T.A.`,
        duration: `${autolyseMinutes} min`
      });
    }

    // 8. Se metodo indiretto (Biga / Poolish)
    if (isIndirect) {
      if (options.isColdBiga) {
        const totalBigaHours = prefermentHours || 24;
        const coldFridgeHours = Math.max(12, totalBigaHours - 4); // 2h TA start + 2h TA acclim
        const prefermentStart = (useAutolyse ? (mixingTime - (autolyseMinutes * 60 * 1000)) : mixingTime) - (totalBigaHours * 3600 * 1000);
        const fridgeStart = prefermentStart + (2 * 3600 * 1000);
        const acclimStart = (useAutolyse ? (mixingTime - (autolyseMinutes * 60 * 1000)) : mixingTime) - (2 * 3600 * 1000);

        steps.push({
          id: 'preferment_start',
          priority: STEP_ORDER.preferment,
          time: new Date(prefermentStart),
          label: '❄️ Impasto Biga Fredda & Start Fermentativo (2h a T.A.)',
          desc: 'Impastare la biga per soli 3-4 minuti a bassa velocità (deve rimanere slegata e grezza). Lasciare riposare 2 ore a temperatura ambiente per attivare i lieviti prima del freddo.',
          duration: '2h di avvio a T.A.'
        });

        steps.push({
          id: 'preferment_fridge',
          priority: STEP_ORDER.preferment + 0.1,
          time: new Date(fridgeStart),
          label: '🧊 Messa in Frigorifero a 4°C della Biga',
          desc: `Trasferire la biga in mastello sigillato e riporla in frigo a 4°C per ${coldFridgeHours} ore per una maturazione aromatica ed enzimatica profonda.`,
          duration: `${coldFridgeHours}h in frigo`
        });

        steps.push({
          id: 'preferment_acclim',
          priority: STEP_ORDER.preferment + 0.2,
          time: new Date(acclimStart),
          label: '🌡️ Estrazione Biga dal Frigo per Acclimatamento',
          desc: 'Estrarre la biga dal frigorifero 2 ore prima del rinfresco: la temperatura interna deve raggiungere circa 16-18°C prima della chiusura.',
          duration: '2h di acclimatamento'
        });
      } else {
        const prefermentTime = (useAutolyse ? (mixingTime - (autolyseMinutes * 60 * 1000)) : mixingTime) - (prefermentHours * 3600 * 1000);
        steps.push({
          id: 'preferment',
          priority: STEP_ORDER.preferment,
          time: new Date(prefermentTime),
          label: 'Impasto Prefermento (Biga / Poolish)',
          desc: `Preparazione del prefermento e messa a riposo per ${prefermentHours} ore a temperatura idonea (18°C per biga).`,
          duration: `${prefermentHours}h di prefermento`
        });
      }
    }

    // Ordina cronologicamente con priorità secondaria garantita
    steps.sort((a, b) => {
      const diff = a.time.getTime() - b.time.getTime();
      if (diff !== 0) return diff;
      return a.priority - b.priority;
    });

    // Formattazione stringhe data
    const formattedSteps = steps.map(s => {
      const d = s.time;
      const dayName = d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
      const timeStr = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return {
        ...s,
        formattedTime: `${dayName} ore ${timeStr}`,
        timeStr: `${dayName} ore ${timeStr}`,
        timestamp: d.toISOString()
      };
    });

    return {
      bakeDate: new Date(bakeTime),
      steps: formattedSteps
    };
  }

  // --- PRESET SCIENTIFICI COLLAUDATI ---
  const PRESETS = {
    napoletana_stg: {
      name: "Pizza Napoletana STG (Classica)",
      category: "Napoletana",
      description: "Il disciplinare storico ufficiale: 8-12 ore a temperatura ambiente, idratazione 60-63%, farina media (W 260-280), niente frigo, cottura a 450-480°C in 60-90 secondi.",
      hydration: 62,
      saltPct: 2.8,
      fatPct: 0,
      sugarPct: 0,
      hoursRoomPuntata: 2,
      hoursFridge: 0,
      hoursRoomAppretto: 6,
      ambientTemp: 22,
      fridgeTemp: 4,
      flourW: 260,
      ballWeight: 260,
      yeastType: 'fresh'
    },
    napoletana_canotto: {
      name: "Napoletana Contemporanea (Canotto)",
      category: "Napoletana",
      description: "Cornicione pronunciato e alveolato, idratazione spinta (68-72%), farina forte (W 300-320) con maturazione mista in frigo (24-48 ore).",
      hydration: 70,
      saltPct: 2.5,
      fatPct: 0,
      sugarPct: 0,
      hoursRoomPuntata: 2,
      hoursFridge: 24,
      hoursRoomAppretto: 6,
      ambientTemp: 21,
      fridgeTemp: 4,
      flourW: 320,
      ballWeight: 270,
      yeastType: 'fresh'
    },
    teglia_romana: {
      name: "Pizza in Teglia alla Romana",
      category: "Romana",
      description: "Altissima idratazione (80%), farina forte (W 340-360), olio EVO per fragranza, 48-72h di maturazione a freddo per una struttura a nido d'ape leggera e croccante.",
      hydration: 80,
      saltPct: 2.5,
      fatPct: 2.5,
      sugarPct: 0,
      hoursRoomPuntata: 1,
      hoursFridge: 48,
      hoursRoomAppretto: 4,
      ambientTemp: 20,
      fridgeTemp: 4,
      flourW: 340,
      ballWeight: 650,
      yeastType: 'fresh'
    },
    tonda_romana: {
      name: "Pizza Tonda Romana (Scrocchiarella)",
      category: "Romana",
      description: "Bassa idratazione (55-58%), farina debole o media (W 220), olio EVO o strutto per friabilità, stesa sottilissima al mattarello.",
      hydration: 56,
      saltPct: 2.5,
      fatPct: 3.5,
      sugarPct: 0,
      hoursRoomPuntata: 2,
      hoursFridge: 24,
      hoursRoomAppretto: 4,
      ambientTemp: 20,
      fridgeTemp: 4,
      flourW: 230,
      ballWeight: 170,
      yeastType: 'fresh'
    },
    pinsa_romana: {
      name: "Pinsa Romana ad Alta Idratazione",
      category: "Romana",
      description: "Forma allungata ovale, croccante fuori e morbidissima dentro, idratazione 78-80%, olio EVO e maturazione controllata a freddo 48h.",
      hydration: 78,
      saltPct: 2.4,
      fatPct: 2.0,
      sugarPct: 0,
      hoursRoomPuntata: 2,
      hoursFridge: 48,
      hoursRoomAppretto: 4,
      ambientTemp: 20,
      fridgeTemp: 4,
      flourW: 340,
      ballWeight: 320,
      yeastType: 'fresh'
    },
    new_york: {
      name: "New York Style Pizza",
      category: "Internazionale",
      description: "Fetta piegabile e dorata, idratazione 63-65%, farina di forza con aggiunta di olio e zucchero (o malto) per favorire la colorazione nei forni casalinghi a 250-280°C.",
      hydration: 63,
      saltPct: 2.2,
      fatPct: 2.5,
      sugarPct: 1.5,
      hoursRoomPuntata: 1,
      hoursFridge: 48,
      hoursRoomAppretto: 4,
      ambientTemp: 20,
      fridgeTemp: 4,
      flourW: 320,
      ballWeight: 380,
      yeastType: 'dry'
    },
    focaccia_genovese: {
      name: "Focaccia Genovese Classica",
      category: "Focaccia",
      description: "Spessore di circa 2 cm, morbida con crosticina dorata e caratteristici buchi colmi di emulsione di acqua, olio EVO e sale.",
      hydration: 65,
      saltPct: 2.5,
      fatPct: 5.0,
      sugarPct: 1.0,
      hoursRoomPuntata: 2,
      hoursFridge: 0,
      hoursRoomAppretto: 3,
      ambientTemp: 22,
      fridgeTemp: 4,
      flourW: 260,
      ballWeight: 600,
      yeastType: 'fresh'
    }
  };

  return {
    yeastActivityRate,
    calculateEffectiveFermentationUnits,
    getFermentationModifiers,
    calculateYeastPercentage,
    calculateThermodynamics,
    calculateFlourBlend,
    analyzeMaturation,
    calculateDirectDough,
    calculatePrefermentBiga,
    calculatePrefermentPoolish,
    calculateTeglia,
    generateTimeline,
    PRESETS,
    MIXERS,
    OVENS,
    COMMERCIAL_FLOURS,
    optimizeReversePlan
  };
}));
