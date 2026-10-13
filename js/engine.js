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
      tapWaterTemp = 18
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
      maturation
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
      bigaYeastPct = 1.0,  // tipicamente 1% di LBF su farina biga (per 16-18h a 18°C)
      maltPct = 0.5        // estratto di malto diastatico opzionale nel rinfresco
    } = options;

    const bigaFlour = Math.round(totalFlour * (bigaFlourPct / 100));
    const bigaWater = Math.round(bigaFlour * (bigaHydration / 100));
    const bigaYeastFresh = Math.round(bigaFlour * (bigaYeastPct / 100) * 10) / 10;
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

    return {
      totalDough,
      totalFlour,
      totalWater,
      totalSalt,
      totalFat,
      totalSugar,
      maltGrams,
      biga: {
        flour: bigaFlour,
        water: bigaWater,
        yeastFresh: bigaYeastFresh,
        yeastDry: bigaYeastDry,
        hydration: bigaHydration,
        flourPct: bigaFlourPct,
        instructions: "Impastare brevemente a spirale (o a mano) per 3-4 minuti senza formare maglia glutinica ('grezza e slegata'). Temperatura finale biga ottimale: 18-20°C. Riposo: 16-18 ore a 18°C."
      },
      refreshment: {
        flour: refreshFlour,
        water: refreshWater,
        salt: totalSalt,
        fat: totalFat,
        sugar: totalSugar,
        malt: maltGrams,
        instructions: "Spezzettare la biga nella vasca. Aggiungere la restante farina, l'eventuale malto e il 70% dell'acqua rimasta. Incordare a velocità sostenuta, quindi inserire il sale e l'acqua a filo fino al completo assorbimento."
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

  /**
   * Generatore di Cronoprogramma Temporale a Ritroso (Timeline Planner)
   */
  function generateTimeline(options) {
    const {
      bakeDate = new Date(),
      hoursRoomPuntata = 2,
      hoursFridge = 24,
      acclimationHours = 1, // tempo uscita frigo prima dello staglio
      hoursRoomAppretto = 5,
      isIndirect = false,
      prefermentHours = 16
    } = options;

    const steps = [];
    const bakeTime = new Date(bakeDate).getTime();

    // 1. Infornata
    steps.push({
      id: 'bake',
      time: new Date(bakeTime),
      label: 'Infornata e Cottura Pizza',
      desc: 'Forno alla massima temperatura, stesura del panetto, farcitura rapida e cottura.',
      duration: 'Cottura'
    });

    // 2. Preriscaldamento forno (1h prima)
    const ovenPreheatTime = bakeTime - (1 * 3600 * 1000);
    steps.push({
      id: 'oven',
      time: new Date(ovenPreheatTime),
      label: 'Accensione e Preriscaldamento Forno',
      desc: 'Accendere il forno (o forno pizza con pietra refrattaria / biscotto) al massimo livello per raggiungere la temperatura target.',
      duration: '1h prima'
    });

    // 3. Staglio dei panetti
    const staglioTime = bakeTime - (hoursRoomAppretto * 3600 * 1000);
    steps.push({
      id: 'staglio',
      time: new Date(staglioTime),
      label: 'Staglio e Formatura Panetti (Inizio Appretto)',
      desc: `Divisione dell'impasto nei panetti del peso target, pirlatura stretta e messa a lievitare nei cassetti/contenitori ermetici a T.A. per ${hoursRoomAppretto} ore.`,
      duration: `${hoursRoomAppretto}h di appretto`
    });

    // 4. Estrazione dal frigo (se previsto frigo)
    let currentCursor = staglioTime;
    if (hoursFridge > 0) {
      if (acclimationHours > 0) {
        const outFridgeTime = staglioTime - (acclimationHours * 3600 * 1000);
        steps.push({
          id: 'out_fridge',
          time: new Date(outFridgeTime),
          label: 'Estrazione Impasto dal Frigorifero',
          desc: `Togliere la massa dal frigo e lasciarla a temperatura ambiente per ${acclimationHours}h per far rilassare la maglia glutinica prima dello staglio.`,
          duration: `${acclimationHours}h di acclimatamento`
        });
        currentCursor = outFridgeTime;
      }

      // 5. Messa in frigorifero
      const inFridgeTime = currentCursor - (hoursFridge * 3600 * 1000);
      steps.push({
        id: 'in_fridge',
        time: new Date(inFridgeTime),
        label: 'Messa in Cella / Frigorifero (4°C)',
        desc: `Trasferire il contenitore ermetico leggermente oliato in frigo per la maturazione enzimatica controllata (${hoursFridge} ore).`,
        duration: `${hoursFridge}h a 4°C`
      });
      currentCursor = inFridgeTime;
    }

    // 6. Chiusura impasto e Puntata
    const puntataStartTime = currentCursor - (hoursRoomPuntata * 3600 * 1000);
    steps.push({
      id: 'puntata',
      time: new Date(puntataStartTime),
      label: 'Chiusura Impasto e Inizio Puntata',
      desc: `Misurare la TFI con termometro a sonda (target ~23°C). Dare un paio di pieghe di rinforzo e lasciar riposare la massa in massa a T.A. per ${hoursRoomPuntata} ore.`,
      duration: `${hoursRoomPuntata}h di puntata`
    });

    // 7. Preparazione e Impastamento (30 min prima)
    const mixingTime = puntataStartTime - (30 * 60 * 1000);
    steps.push({
      id: 'mixing',
      time: new Date(mixingTime),
      label: 'Preparazione Ingredienti e Impastamento',
      desc: 'Pesatura al decimo di grammo di farina, acqua calibrata (con eventuale ghiaccio), sale e lievito. Avvio impastatrice.',
      duration: '30 min'
    });

    // 8. Se metodo indiretto (Biga / Poolish)
    if (isIndirect) {
      const prefermentTime = mixingTime - (prefermentHours * 3600 * 1000);
      steps.push({
        id: 'preferment',
        time: new Date(prefermentTime),
        label: 'Impasto Prefermento (Biga / Poolish)',
        desc: `Preparazione del prefermento e messa a riposo per ${prefermentHours} ore a temperatura idonea (18°C per biga).`,
        duration: `${prefermentHours}h di prefermento`
      });
    }

    // Ordina cronologicamente (dal più lontano nel tempo all'infornata)
    steps.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Formattazione stringhe data
    const formattedSteps = steps.map(s => {
      const d = s.time;
      const dayName = d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
      const timeStr = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return {
        ...s,
        formattedTime: `${dayName} ore ${timeStr}`,
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
    PRESETS
  };
}));
