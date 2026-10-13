/**
 * PizzaLab Scientifico - UI Controller & Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const engine = window.PizzaEngine;
  if (!engine) {
    console.error("PizzaEngine module not loaded!");
    return;
  }

  // --- STATO DELL'APPLICAZIONE ---
  const state = {
    numBalls: 6,
    ballWeight: 260,
    totalDoughWeight: 1560,
    hydration: 62,
    saltPct: 2.8,
    fatPct: 0,
    sugarPct: 0,
    yeastType: 'fresh',
    sourdoughPct: 15,
    hoursRoomPuntata: 2,
    hoursFridge: 0,
    fridgeTemp: 4,
    hoursRoomAppretto: 6,
    flourW: 260,
    flourPL: 0.55,
    ambientTemp: 22,
    flourTemp: 21,
    friction: 4,
    targetTFI: 23,
    tapWaterTemp: 18,
    activePreset: 'napoletana_stg',
    isPrudentialMode: false,
    ovenType: 'forno_casa_250'
  };

  // --- SELETTORI DOM ---
  // Sliders e Inputs Diretti
  const prudentialToggle = document.getElementById('prudentialToggle');
  const prudentialDetails = document.getElementById('prudentialDetails');
  const seasonalButtons = document.querySelectorAll('.seasonal-btn');

  const ovenTypeSelect = document.getElementById('ovenTypeSelect');
  const ovenTempSpec = document.getElementById('ovenTempSpec');
  const ovenTimeSpec = document.getElementById('ovenTimeSpec');
  const ovenPreheatSpec = document.getElementById('ovenPreheatSpec');
  const ovenSupportText = document.getElementById('ovenSupportText');
  const ovenAdviceBox = document.getElementById('ovenAdviceBox');
  const numBallsSlider = document.getElementById('numBalls');
  const numBallsInput = document.getElementById('numBallsInput');
  const numBallsVal = document.getElementById('numBallsVal');

  const ballWeightSlider = document.getElementById('ballWeight');
  const ballWeightInput = document.getElementById('ballWeightInput');
  const ballWeightVal = document.getElementById('ballWeightVal');

  const totalDoughWeightInput = document.getElementById('totalDoughWeightInput');

  const hydrationSlider = document.getElementById('hydration');
  const hydrationInput = document.getElementById('hydrationInput');
  const hydrationVal = document.getElementById('hydrationVal');

  const saltPctSlider = document.getElementById('saltPct');
  const saltPctInput = document.getElementById('saltPctInput');
  const saltPctVal = document.getElementById('saltPctVal');

  const fatPctSlider = document.getElementById('fatPct');
  const fatPctInput = document.getElementById('fatPctInput');
  const fatPctVal = document.getElementById('fatPctVal');

  const sugarPctSlider = document.getElementById('sugarPct');
  const sugarPctInput = document.getElementById('sugarPctInput');
  const sugarPctVal = document.getElementById('sugarPctVal');

  const yeastTypeSelect = document.getElementById('yeastTypeSelect');
  const sourdoughPctGroup = document.getElementById('sourdoughPctGroup');
  const sourdoughPctSlider = document.getElementById('sourdoughPct');
  const sourdoughPctInput = document.getElementById('sourdoughPctInput');
  const sourdoughPctVal = document.getElementById('sourdoughPctVal');

  const hoursRoomPuntataSlider = document.getElementById('hoursRoomPuntata');
  const hoursRoomPuntataInput = document.getElementById('hoursRoomPuntataInput');
  const hoursRoomPuntataVal = document.getElementById('hoursRoomPuntataVal');

  const hoursFridgeSlider = document.getElementById('hoursFridge');
  const hoursFridgeInput = document.getElementById('hoursFridgeInput');
  const hoursFridgeVal = document.getElementById('hoursFridgeVal');

  const hoursRoomApprettoSlider = document.getElementById('hoursRoomAppretto');
  const hoursRoomApprettoInput = document.getElementById('hoursRoomApprettoInput');
  const hoursRoomApprettoVal = document.getElementById('hoursRoomApprettoVal');

  const flourWSlider = document.getElementById('flourW');
  const flourWInput = document.getElementById('flourWInput');
  const flourWVal = document.getElementById('flourWVal');
  const flourPLInput = document.getElementById('flourPLInput');

  const ambientTempSlider = document.getElementById('ambientTemp');
  const ambientTempInput = document.getElementById('ambientTempInput');
  const ambientTempVal = document.getElementById('ambientTempVal');

  const flourTempInput = document.getElementById('flourTempInput');
  const mixerTypeSelect = document.getElementById('mixerTypeSelect');
  const targetTFIInput = document.getElementById('targetTFIInput');
  const tapWaterTempInput = document.getElementById('tapWaterTempInput');

  // Risultati Output
  const recipeTableBody = document.getElementById('recipeTableBody');
  const recipeTotalPct = document.getElementById('recipeTotalPct');
  const recipeTotalWeight = document.getElementById('recipeTotalWeight');
  const doughSummaryBadge = document.getElementById('doughSummaryBadge');
  const waterTempDisplay = document.getElementById('waterTempDisplay');
  const thermoSubtext = document.getElementById('thermoSubtext');
  const iceAlertBox = document.getElementById('iceAlertBox');
  const iceGramsDisplay = document.getElementById('iceGramsDisplay');
  const maturationStatusTag = document.getElementById('maturationStatusTag');
  const maturationProgress = document.getElementById('maturationProgress');
  const maturationDesc = document.getElementById('maturationDesc');

  // Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const presetPills = document.querySelectorAll('.preset-pill');

  // Metodi Indiretti
  const prefermentTypeSelect = document.getElementById('prefermentTypeSelect');
  const prefTotalFlour = document.getElementById('prefTotalFlour');
  const prefTotalHydration = document.getElementById('prefTotalHydration');
  const prefTotalSalt = document.getElementById('prefTotalSalt');
  const bigaControls = document.getElementById('bigaControls');
  const poolishControls = document.getElementById('poolishControls');
  const prefBigaPct = document.getElementById('prefBigaPct');
  const prefBigaHydration = document.getElementById('prefBigaHydration');
  const prefPoolishPct = document.getElementById('prefPoolishPct');
  const prefPoolishHours = document.getElementById('prefPoolishHours');
  const prefStage1Body = document.getElementById('prefStage1Body');
  const prefStage1Instructions = document.getElementById('prefStage1Instructions');
  const prefStage2Body = document.getElementById('prefStage2Body');
  const prefStage2Instructions = document.getElementById('prefStage2Instructions');

  // Teglia
  const tegliaShape = document.getElementById('tegliaShape');
  const tegliaRectGroup = document.getElementById('tegliaRectGroup');
  const tegliaRoundGroup = document.getElementById('tegliaRoundGroup');
  const tegliaLength = document.getElementById('tegliaLength');
  const tegliaWidth = document.getElementById('tegliaWidth');
  const tegliaDiameter = document.getElementById('tegliaDiameter');
  const tegliaCoeffSelect = document.getElementById('tegliaCoeffSelect');
  const tegliaCount = document.getElementById('tegliaCount');
  const tegliaAreaDisplay = document.getElementById('tegliaAreaDisplay');
  const tegliaSingleWeightDisplay = document.getElementById('tegliaSingleWeightDisplay');
  const tegliaTotalNotice = document.getElementById('tegliaTotalNotice');
  const applyTegliaToDirectBtn = document.getElementById('applyTegliaToDirectBtn');

  // Blend Farine
  const flourBlendRows = document.getElementById('flourBlendRows');
  const addFlourRowBtn = document.getElementById('addFlourRowBtn');
  const blendTotalPctNotice = document.getElementById('blendTotalPctNotice');
  const blendResultW = document.getElementById('blendResultW');
  const blendResultProt = document.getElementById('blendResultProt');
  const blendResultHydr = document.getElementById('blendResultHydr');
  const applyBlendWToDirectBtn = document.getElementById('applyBlendWToDirectBtn');

  // Timeline
  const targetBakeDate = document.getElementById('targetBakeDate');
  const targetBakeTime = document.getElementById('targetBakeTime');
  const timelineAcclimation = document.getElementById('timelineAcclimation');
  const timelineList = document.getElementById('timelineList');
  const goToTimelineBtn = document.getElementById('goToTimelineBtn');

  // --- SELETTORI MODALITÀ REVERSE ---
  const revStyleSelect = document.getElementById('revStyleSelect');
  const revHours = document.getElementById('revHours');
  const revHoursInput = document.getElementById('revHoursInput');
  const revHoursVal = document.getElementById('revHoursVal');
  const revQuickPills = document.querySelectorAll('.quick-pill');
  const revNumBalls = document.getElementById('revNumBalls');
  const revBallWeight = document.getElementById('revBallWeight');
  const revAmbientTemp = document.getElementById('revAmbientTemp');
  const revFlourSelect = document.getElementById('revFlourSelect');
  const revCustomWGroup = document.getElementById('revCustomWGroup');
  const revCustomWInput = document.getElementById('revCustomWInput');
  const revFlourWDisplay = document.getElementById('revFlourWDisplay');
  const revFlourProtDisplay = document.getElementById('revFlourProtDisplay');
  const revFlourPLDisplay = document.getElementById('revFlourPLDisplay');
  const revFlourHydrDisplay = document.getElementById('revFlourHydrDisplay');
  const revFlourCatDisplay = document.getElementById('revFlourCatDisplay');
  const revOvenSelect = document.getElementById('revOvenSelect');
  const revMixerSelect = document.getElementById('revMixerSelect');
  const revOvenAdvice = document.getElementById('revOvenAdvice');
  const revRunBtn = document.getElementById('revRunBtn');
  const revScoreCircle = document.getElementById('revScoreCircle');
  const revScoreTitle = document.getElementById('revScoreTitle');
  const revScoreDesc = document.getElementById('revScoreDesc');
  const revTimeBarPuntata = document.getElementById('revTimeBarPuntata');
  const revTimeBarFridge = document.getElementById('revTimeBarFridge');
  const revTimeBarAppretto = document.getElementById('revTimeBarAppretto');
  const revStrategyList = document.getElementById('revStrategyList');
  const revRecipeTableBody = document.getElementById('revRecipeTableBody');
  const revWaterTempDisplay = document.getElementById('revWaterTempDisplay');
  const revThermoSubtext = document.getElementById('revThermoSubtext');
  const revTimelineList = document.getElementById('revTimelineList');
  const revApplyToDirectBtn = document.getElementById('revApplyToDirectBtn');
  const revCopyRecipeBtn = document.getElementById('revCopyRecipeBtn');

  let currentReverseResult = null;

  // Azioni, Salvataggio Default & Toast
  const saveDefaultsBtn = document.getElementById('saveDefaultsBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const saveEquipmentDirectBtn = document.getElementById('saveEquipmentDirectBtn');
  const saveEquipmentReverseBtn = document.getElementById('saveEquipmentReverseBtn');
  const copyRecipeBtn = document.getElementById('copyRecipeBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const printBtn = document.getElementById('printBtn');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  // Inizializza data infornata con domani alle 20:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  targetBakeDate.value = tomorrow.toISOString().split('T')[0];

  let currentCalculatedDough = null;

  // --- FUNZIONI DI SINCRONIZZAZIONE INPUT ---
  function bindSliderAndInput(slider, input, badge, suffix, onUpdate) {
    slider.addEventListener('input', () => {
      input.value = slider.value;
      if (badge) badge.textContent = `${slider.value} ${suffix}`.trim();
      onUpdate(parseFloat(slider.value));
    });

    input.addEventListener('input', () => {
      slider.value = input.value;
      if (badge) badge.textContent = `${input.value} ${suffix}`.trim();
      onUpdate(parseFloat(input.value));
    });
  }

  // Binding Inputs Impasto Diretto
  bindSliderAndInput(numBallsSlider, numBallsInput, numBallsVal, '', (val) => {
    state.numBalls = val;
    state.totalDoughWeight = state.numBalls * state.ballWeight;
    totalDoughWeightInput.value = state.totalDoughWeight;
    recalculateDirect();
  });

  bindSliderAndInput(ballWeightSlider, ballWeightInput, ballWeightVal, 'g', (val) => {
    state.ballWeight = val;
    state.totalDoughWeight = state.numBalls * state.ballWeight;
    totalDoughWeightInput.value = state.totalDoughWeight;
    recalculateDirect();
  });

  totalDoughWeightInput.addEventListener('input', () => {
    const val = parseFloat(totalDoughWeightInput.value) || 0;
    if (val > 0) {
      state.totalDoughWeight = val;
      state.ballWeight = Math.round(val / state.numBalls);
      ballWeightSlider.value = state.ballWeight;
      ballWeightInput.value = state.ballWeight;
      ballWeightVal.textContent = `${state.ballWeight} g`;
      recalculateDirect();
    }
  });

  bindSliderAndInput(hydrationSlider, hydrationInput, hydrationVal, '%', (val) => {
    state.hydration = val;
    recalculateDirect();
  });

  bindSliderAndInput(saltPctSlider, saltPctInput, saltPctVal, '%', (val) => {
    state.saltPct = val;
    recalculateDirect();
  });

  bindSliderAndInput(fatPctSlider, fatPctInput, fatPctVal, '%', (val) => {
    state.fatPct = val;
    recalculateDirect();
  });

  bindSliderAndInput(sugarPctSlider, sugarPctInput, sugarPctVal, '%', (val) => {
    state.sugarPct = val;
    recalculateDirect();
  });

  yeastTypeSelect.addEventListener('change', () => {
    state.yeastType = yeastTypeSelect.value;
    if (state.yeastType === 'madre' || state.yeastType === 'licoli') {
      sourdoughPctGroup.style.display = 'flex';
    } else {
      sourdoughPctGroup.style.display = 'none';
    }
    recalculateDirect();
  });

  bindSliderAndInput(sourdoughPctSlider, sourdoughPctInput, sourdoughPctVal, '%', (val) => {
    state.sourdoughPct = val;
    recalculateDirect();
  });

  bindSliderAndInput(hoursRoomPuntataSlider, hoursRoomPuntataInput, hoursRoomPuntataVal, 'h', (val) => {
    state.hoursRoomPuntata = val;
    recalculateDirect();
  });

  bindSliderAndInput(hoursFridgeSlider, hoursFridgeInput, hoursFridgeVal, 'h', (val) => {
    state.hoursFridge = val;
    recalculateDirect();
  });

  bindSliderAndInput(hoursRoomApprettoSlider, hoursRoomApprettoInput, hoursRoomApprettoVal, 'h', (val) => {
    state.hoursRoomAppretto = val;
    recalculateDirect();
  });

  bindSliderAndInput(flourWSlider, flourWInput, flourWVal, '', (val) => {
    state.flourW = val;
    flourWVal.textContent = `W ${val}`;
    recalculateDirect();
  });

  flourPLInput.addEventListener('input', () => {
    state.flourPL = parseFloat(flourPLInput.value) || 0.55;
    recalculateDirect();
  });

  bindSliderAndInput(ambientTempSlider, ambientTempInput, ambientTempVal, '°C', (val) => {
    state.ambientTemp = val;
    recalculateDirect();
  });

  flourTempInput.addEventListener('input', () => {
    state.flourTemp = parseFloat(flourTempInput.value) || 20;
    recalculateDirect();
  });

  const mixerTip = document.getElementById('mixerTip');

  mixerTypeSelect.addEventListener('change', () => {
    const val = mixerTypeSelect.value;
    if (val === 'custom') {
      const customFriction = prompt("Inserisci l'attrito meccanico stimato in °C:", "5");
      state.friction = parseFloat(customFriction) || 5;
    } else if (engine.MIXERS[val]) {
      state.friction = engine.MIXERS[val].friction;
    }
    if (mixerTip && engine.MIXERS[val]) {
      mixerTip.innerHTML = engine.MIXERS[val].tip;
    }
    recalculateDirect();
  });

  // Modalità Stima Prudenziale
  if (prudentialToggle) {
    prudentialToggle.addEventListener('change', () => {
      state.isPrudentialMode = prudentialToggle.checked;
      prudentialDetails.style.display = state.isPrudentialMode ? 'block' : 'none';
      if (state.isPrudentialMode) {
        state.flourTemp = Math.round((state.ambientTemp - 0.5) * 10) / 10;
        flourTempInput.value = state.flourTemp;
        state.tapWaterTemp = Math.min(22, Math.max(14, state.ambientTemp - 3));
        tapWaterTempInput.value = state.tapWaterTemp;
      }
      recalculateDirect();
    });
  }

  seasonalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      seasonalButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = parseFloat(btn.dataset.temp);
      state.ambientTemp = t;
      ambientTempSlider.value = t;
      ambientTempInput.value = t;
      ambientTempVal.textContent = `${t} °C`;
      state.flourTemp = Math.max(10, t - 1);
      flourTempInput.value = state.flourTemp;
      state.tapWaterTemp = Math.min(22, Math.max(14, t - 3));
      tapWaterTempInput.value = state.tapWaterTemp;
      recalculateDirect();
    });
  });

  // Gestione Forno e Consigli di Cottura
  function updateOvenDisplay() {
    if (!ovenTypeSelect) return;
    const ovenKey = ovenTypeSelect.value;
    state.ovenType = ovenKey;
    const oven = engine.OVENS[ovenKey] || engine.OVENS.forno_casa_250;
    if (ovenTempSpec) ovenTempSpec.textContent = oven.tempRange;
    if (ovenTimeSpec) ovenTimeSpec.textContent = oven.bakeTimeStr;
    if (ovenPreheatSpec) ovenPreheatSpec.textContent = `${oven.preheatMinutes} min`;
    if (ovenSupportText) ovenSupportText.textContent = oven.support;
    
    if (ovenAdviceBox) {
      let adviceHtml = `💡 <strong>${oven.name}:</strong> ${oven.advice}`;
      if (oven.requiresFatAndSugar && (state.fatPct < 1.5 || state.sugarPct < 0.5)) {
        adviceHtml += `<br><span style="color: var(--accent); font-weight: 600; display: block; margin-top: 0.35rem;">👉 Suggerimento: a 250°C aggiungi 2-3% olio EVO e 1% malto o zucchero per evitare che l'impasto perda troppa acqua.</span>`;
      } else if (!oven.requiresFatAndSugar && state.sugarPct > 0 && oven.targetTemp >= 450) {
        adviceHtml += `<br><span style="color: var(--danger); font-weight: 600; display: block; margin-top: 0.35rem;">⚠️ Rischio bruciatura: a ${oven.targetTemp}°C gli zuccheri carbonizzano precocemente, azzera gli zuccheri!</span>`;
      }
      ovenAdviceBox.innerHTML = adviceHtml;
    }
  }

  if (ovenTypeSelect) {
    ovenTypeSelect.addEventListener('change', () => {
      updateOvenDisplay();
      recalculateDirect();
      updateTimeline();
    });
  }

  targetTFIInput.addEventListener('input', () => {
    state.targetTFI = parseFloat(targetTFIInput.value) || 23;
    recalculateDirect();
  });

  tapWaterTempInput.addEventListener('input', () => {
    state.tapWaterTemp = parseFloat(tapWaterTempInput.value) || 18;
    recalculateDirect();
  });

  // --- CALCOLO IMPASTO DIRETTO ---
  function recalculateDirect() {
    const res = engine.calculateDirectDough({
      numBalls: state.numBalls,
      ballWeight: state.ballWeight,
      totalDoughWeight: state.totalDoughWeight,
      hydration: state.hydration,
      saltPct: state.saltPct,
      fatPct: state.fatPct,
      sugarPct: state.sugarPct,
      ambientTemp: state.ambientTemp,
      hoursRoomPuntata: state.hoursRoomPuntata,
      hoursFridge: state.hoursFridge,
      fridgeTemp: state.fridgeTemp,
      hoursRoomAppretto: state.hoursRoomAppretto,
      flourW: state.flourW,
      yeastType: state.yeastType,
      sourdoughPct: state.sourdoughPct,
      targetTFI: state.targetTFI,
      flourTemp: state.flourTemp,
      friction: state.friction,
      tapWaterTemp: state.tapWaterTemp,
      isPrudentialMode: state.isPrudentialMode,
      ovenType: state.ovenType
    });

    currentCalculatedDough = res;
    updateOvenDisplay();

    // Aggiorna Badge
    doughSummaryBadge.textContent = `${res.numBalls} panetti da ${res.ballWeight}g`;

    // Render Tabella Ingredienti
    let rowsHtml = '';

    // Farina
    rowsHtml += `
      <tr>
        <td class="ing-name">🌾 Farina (W ${state.flourW})</td>
        <td class="ing-pct">100.0 %</td>
        <td class="ing-weight">${res.flour.toFixed(1)} g</td>
      </tr>
    `;

    // Acqua
    rowsHtml += `
      <tr>
        <td class="ing-name">💧 Acqua</td>
        <td class="ing-pct">${res.hydration.toFixed(1)} %</td>
        <td class="ing-weight">${res.water.toFixed(1)} g</td>
      </tr>
    `;

    // Sale
    rowsHtml += `
      <tr>
        <td class="ing-name">🧂 Sale Marino</td>
        <td class="ing-pct">${res.saltPct.toFixed(1)} %</td>
        <td class="ing-weight">${res.salt.toFixed(1)} g</td>
      </tr>
    `;

    // Grassi (se presenti)
    if (res.fat > 0) {
      rowsHtml += `
        <tr>
          <td class="ing-name">🫒 Olio EVO / Grassi</td>
          <td class="ing-pct">${res.fatPct.toFixed(1)} %</td>
          <td class="ing-weight">${res.fat.toFixed(1)} g</td>
        </tr>
      `;
    }

    // Zuccheri / Malto (se presenti)
    if (res.sugar > 0) {
      rowsHtml += `
        <tr>
          <td class="ing-name">🍯 Malto Diastatico / Zucchero</td>
          <td class="ing-pct">${res.sugarPct.toFixed(1)} %</td>
          <td class="ing-weight">${res.sugar.toFixed(1)} g</td>
        </tr>
      `;
    }

    // Lievito
    if (state.yeastType === 'fresh') {
      rowsHtml += `
        <tr>
          <td class="ing-name">🧫 Lievito di Birra Fresco (LBF)</td>
          <td class="ing-pct">${res.yeastPct.toFixed(3)} %</td>
          <td class="ing-weight">${res.yeastGrams.toFixed(2)} g</td>
        </tr>
      `;
    } else if (state.yeastType === 'dry') {
      rowsHtml += `
        <tr>
          <td class="ing-name">🧫 Lievito Secco Istantaneo (IDY)</td>
          <td class="ing-pct">${res.yeastPct.toFixed(3)} %</td>
          <td class="ing-weight">${res.yeastGrams.toFixed(2)} g</td>
        </tr>
      `;
    } else if (state.yeastType === 'ady') {
      rowsHtml += `
        <tr>
          <td class="ing-name">🧫 Lievito Secco Attivo (ADY)</td>
          <td class="ing-pct">${res.yeastPct.toFixed(3)} %</td>
          <td class="ing-weight">${res.yeastGrams.toFixed(2)} g</td>
        </tr>
      `;
    } else if (state.yeastType === 'licoli') {
      rowsHtml += `
        <tr>
          <td class="ing-name">🏺 Li.Co.Li (Idr. 100%)</td>
          <td class="ing-pct">${res.yeastPct.toFixed(1)} %</td>
          <td class="ing-weight">${res.licoliGrams.toFixed(1)} g</td>
        </tr>
      `;
    } else if (state.yeastType === 'madre') {
      rowsHtml += `
        <tr>
          <td class="ing-name">🏺 Pasta Madre Solida (Idr. 50%)</td>
          <td class="ing-pct">${res.yeastPct.toFixed(1)} %</td>
          <td class="ing-weight">${res.pastaMadreGrams.toFixed(1)} g</td>
        </tr>
      `;
    }

    recipeTableBody.innerHTML = rowsHtml;

    // Totali
    const totalBakersPct = 100 + res.hydration + res.saltPct + res.fatPct + res.sugarPct;
    recipeTotalPct.textContent = `${totalBakersPct.toFixed(1)} %`;
    recipeTotalWeight.textContent = `${Math.round(res.totalDough)} g`;

    // Termodinamica TFI e Ghiaccio
    const thermo = res.thermodynamics;
    waterTempDisplay.textContent = `${thermo.waterTemp.toFixed(1)} °C`;
    thermoSubtext.textContent = `Formula: (3 × ${thermo.targetTemp}°C) - (${thermo.roomTemp}°C amb + ${thermo.flourTemp}°C farina + ${thermo.friction}°C attrito)`;

    if (thermo.needsIce) {
      iceAlertBox.style.display = 'flex';
      iceGramsDisplay.textContent = `${thermo.iceGrams} g ghiaccio + ${thermo.liquidWaterGrams} g acqua`;
    } else {
      iceAlertBox.style.display = 'none';
    }

    // Diagnostica Maturazione
    const mat = res.maturation;
    maturationStatusTag.className = `maturation-tag ${mat.status}`;
    maturationDesc.textContent = `${mat.message} ${mat.detail}`;

    if (mat.status === 'optimal') {
      maturationStatusTag.textContent = 'Maturazione Ottimale';
      maturationProgress.style.background = '#2a9d8f';
      maturationProgress.style.width = '100%';
    } else if (mat.status === 'good') {
      maturationStatusTag.textContent = 'Maturazione Buona';
      maturationProgress.style.background = '#f4a261';
      maturationProgress.style.width = '75%';
    } else if (mat.status === 'under') {
      maturationStatusTag.textContent = 'Impasto Sottomaturo';
      maturationProgress.style.background = '#e76f51';
      maturationProgress.style.width = '40%';
    } else if (mat.status === 'over') {
      maturationStatusTag.textContent = 'Rischio Collasso';
      maturationProgress.style.background = '#d90429';
      maturationProgress.style.width = '100%';
    } else {
      maturationStatusTag.textContent = 'Maturazione Alta';
      maturationProgress.style.background = '#e76f51';
      maturationProgress.style.width = '90%';
    }

    // Se timeline è aperta, rigenera
    updateTimeline();
  }

  // --- APPLICAZIONE PRESET ---
  function applyPreset(presetKey) {
    const p = engine.PRESETS[presetKey];
    if (!p) return;

    state.activePreset = presetKey;

    // Aggiorna valori di stato
    state.hydration = p.hydration;
    state.saltPct = p.saltPct;
    state.fatPct = p.fatPct;
    state.sugarPct = p.sugarPct;
    state.hoursRoomPuntata = p.hoursRoomPuntata;
    state.hoursFridge = p.hoursFridge;
    state.hoursRoomAppretto = p.hoursRoomAppretto;
    state.flourW = p.flourW;
    state.ballWeight = p.ballWeight;
    state.yeastType = p.yeastType;
    state.ambientTemp = p.ambientTemp;
    state.fridgeTemp = p.fridgeTemp;
    state.totalDoughWeight = state.numBalls * state.ballWeight;

    // Aggiorna UI
    hydrationSlider.value = p.hydration;
    hydrationInput.value = p.hydration;
    hydrationVal.textContent = `${p.hydration} %`;

    saltPctSlider.value = p.saltPct;
    saltPctInput.value = p.saltPct;
    saltPctVal.textContent = `${p.saltPct} %`;

    fatPctSlider.value = p.fatPct;
    fatPctInput.value = p.fatPct;
    fatPctVal.textContent = `${p.fatPct} %`;

    sugarPctSlider.value = p.sugarPct;
    sugarPctInput.value = p.sugarPct;
    sugarPctVal.textContent = `${p.sugarPct} %`;

    hoursRoomPuntataSlider.value = p.hoursRoomPuntata;
    hoursRoomPuntataInput.value = p.hoursRoomPuntata;
    hoursRoomPuntataVal.textContent = `${p.hoursRoomPuntata} h`;

    hoursFridgeSlider.value = p.hoursFridge;
    hoursFridgeInput.value = p.hoursFridge;
    hoursFridgeVal.textContent = `${p.hoursFridge} h`;

    hoursRoomApprettoSlider.value = p.hoursRoomAppretto;
    hoursRoomApprettoInput.value = p.hoursRoomAppretto;
    hoursRoomApprettoVal.textContent = `${p.hoursRoomAppretto} h`;

    flourWSlider.value = p.flourW;
    flourWInput.value = p.flourW;
    flourWVal.textContent = `W ${p.flourW}`;

    ballWeightSlider.value = p.ballWeight;
    ballWeightInput.value = p.ballWeight;
    ballWeightVal.textContent = `${p.ballWeight} g`;

    totalDoughWeightInput.value = state.totalDoughWeight;

    yeastTypeSelect.value = p.yeastType;
    ambientTempSlider.value = p.ambientTemp;
    ambientTempInput.value = p.ambientTemp;
    ambientTempVal.textContent = `${p.ambientTemp} °C`;

    // Pill active style
    presetPills.forEach(pill => {
      if (pill.dataset.preset === presetKey) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    recalculateDirect();
  }

  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      applyPreset(pill.dataset.preset);
    });
  });

  // --- METODI INDIRETTI (BIGA & POOLISH) ---
  function recalculateIndirect() {
    const type = prefermentTypeSelect.value;
    const totalFlour = parseFloat(prefTotalFlour.value) || 1000;
    const totalHydration = parseFloat(prefTotalHydration.value) || 70;
    const totalSalt = parseFloat(prefTotalSalt.value) || 2.5;

    if (type === 'biga') {
      bigaControls.style.display = 'contents';
      poolishControls.style.display = 'none';

      const bigaFlourPct = parseFloat(prefBigaPct.value) || 100;
      const bigaHydr = parseFloat(prefBigaHydration.value) || 45;

      const res = engine.calculatePrefermentBiga({
        totalFlour,
        totalHydration,
        totalSaltPct: totalSalt,
        bigaFlourPct,
        bigaHydration: bigaHydr,
        bigaYeastPct: 1.0
      });

      // Render Stage 1 (Biga)
      prefStage1Body.innerHTML = `
        <tr><td>🌾 Farina Forte (W 320-360)</td><td class="ing-weight">${res.biga.flour} g</td></tr>
        <tr><td>💧 Acqua (${res.biga.hydration}%)</td><td class="ing-weight">${res.biga.water} g</td></tr>
        <tr><td>🧫 Lievito Fresco (1%)</td><td class="ing-weight">${res.biga.yeastFresh} g</td></tr>
        <tr><td><em>(oppure Lievito Secco IDY)</em></td><td class="ing-weight"><em>${res.biga.yeastDry} g</em></td></tr>
      `;
      prefStage1Instructions.textContent = res.biga.instructions;

      // Render Stage 2 (Rinfresco)
      prefStage2Body.innerHTML = `
        <tr><td>🌾 Farina Rimanente</td><td class="ing-weight">${res.refreshment.flour} g</td></tr>
        <tr><td>💧 Acqua Rimanente (Fredda)</td><td class="ing-weight">${res.refreshment.water} g</td></tr>
        <tr><td>🧂 Sale Marino</td><td class="ing-weight">${res.refreshment.salt} g</td></tr>
        <tr><td>🍯 Malto Diastatico (Opzionale)</td><td class="ing-weight">${res.maltGrams} g</td></tr>
      `;
      prefStage2Instructions.textContent = res.refreshment.instructions;

    } else {
      bigaControls.style.display = 'none';
      poolishControls.style.display = 'contents';

      const poolishPct = parseFloat(prefPoolishPct.value) || 30;
      const poolishHours = parseFloat(prefPoolishHours.value) || 8;

      const res = engine.calculatePrefermentPoolish({
        totalFlour,
        totalHydration,
        totalSaltPct: totalSalt,
        poolishFlourPct: poolishPct,
        poolishHours
      });

      // Render Stage 1 (Poolish)
      prefStage1Body.innerHTML = `
        <tr><td>🌾 Farina Poolish</td><td class="ing-weight">${res.poolish.flour} g</td></tr>
        <tr><td>💧 Acqua Poolish (100%)</td><td class="ing-weight">${res.poolish.water} g</td></tr>
        <tr><td>🧫 Lievito Fresco (${res.poolish.hours}h)</td><td class="ing-weight">${res.poolish.yeastFresh} g</td></tr>
        <tr><td><em>(oppure Lievito Secco IDY)</em></td><td class="ing-weight"><em>${res.poolish.yeastDry} g</em></td></tr>
      `;
      prefStage1Instructions.textContent = res.poolish.instructions;

      // Render Stage 2 (Rinfresco)
      prefStage2Body.innerHTML = `
        <tr><td>🌾 Farina Rimanente</td><td class="ing-weight">${res.refreshment.flour} g</td></tr>
        <tr><td>💧 Acqua Rimanente</td><td class="ing-weight">${res.refreshment.water} g</td></tr>
        <tr><td>🧂 Sale Marino</td><td class="ing-weight">${res.refreshment.salt} g</td></tr>
      `;
      prefStage2Instructions.textContent = res.refreshment.instructions;
    }
  }

  prefermentTypeSelect.addEventListener('change', recalculateIndirect);
  prefTotalFlour.addEventListener('input', recalculateIndirect);
  prefTotalHydration.addEventListener('input', recalculateIndirect);
  prefTotalSalt.addEventListener('input', recalculateIndirect);
  prefBigaPct.addEventListener('change', recalculateIndirect);
  prefBigaHydration.addEventListener('input', recalculateIndirect);
  prefPoolishPct.addEventListener('input', recalculateIndirect);
  prefPoolishHours.addEventListener('change', recalculateIndirect);

  // --- CALCOLATORE TEGLIA ---
  function recalculateTeglia() {
    const shape = tegliaShape.value;
    const coeff = parseFloat(tegliaCoeffSelect.value);
    const count = parseInt(tegliaCount.value) || 1;

    let res;
    if (shape === 'rectangle') {
      tegliaRectGroup.style.display = 'contents';
      tegliaRoundGroup.style.display = 'none';

      res = engine.calculateTeglia({
        shape: 'rectangle',
        length: parseFloat(tegliaLength.value) || 40,
        width: parseFloat(tegliaWidth.value) || 30,
        coefficient: coeff
      });
    } else {
      tegliaRectGroup.style.display = 'none';
      tegliaRoundGroup.style.display = 'contents';

      res = engine.calculateTeglia({
        shape: 'round',
        diameter: parseFloat(tegliaDiameter.value) || 32,
        coefficient: coeff
      });
    }

    tegliaAreaDisplay.textContent = `${res.area} cm²`;
    tegliaSingleWeightDisplay.textContent = `${res.doughWeight} g`;
    const totalTegliaWeight = res.doughWeight * count;
    tegliaTotalNotice.innerHTML = `Massa totale per ${count} tegli${count > 1 ? 'e' : 'a'}: <strong>${totalTegliaWeight} g</strong>`;
  }

  tegliaShape.addEventListener('change', recalculateTeglia);
  tegliaLength.addEventListener('input', recalculateTeglia);
  tegliaWidth.addEventListener('input', recalculateTeglia);
  tegliaDiameter.addEventListener('input', recalculateTeglia);
  tegliaCoeffSelect.addEventListener('change', recalculateTeglia);
  tegliaCount.addEventListener('input', recalculateTeglia);

  applyTegliaToDirectBtn.addEventListener('click', () => {
    const singleWeight = parseInt(tegliaSingleWeightDisplay.textContent) || 720;
    const count = parseInt(tegliaCount.value) || 1;

    state.numBalls = count;
    state.ballWeight = singleWeight;
    state.totalDoughWeight = singleWeight * count;

    // Aggiorna controlli tab diretto
    numBallsSlider.value = count;
    numBallsInput.value = count;
    numBallsVal.textContent = count;

    ballWeightSlider.value = singleWeight;
    ballWeightInput.value = singleWeight;
    ballWeightVal.textContent = `${singleWeight} g`;

    totalDoughWeightInput.value = state.totalDoughWeight;

    // Switcha al tab Diretto
    switchTab('tab-direct');
    recalculateDirect();
    showToast(`✅ Dimensioni teglia applicate: ${count} panetti da ${singleWeight}g!`);
  });

  // --- CALCOLATORE BLEND FARINE ---
  function recalculateBlend() {
    const rows = flourBlendRows.querySelectorAll('.blend-row:not(.blend-row-header)');
    const flours = [];
    let sumPct = 0;

    rows.forEach(r => {
      const w = parseFloat(r.querySelector('.blend-w').value) || 280;
      const prot = parseFloat(r.querySelector('.blend-prot').value) || 12;
      const pct = parseFloat(r.querySelector('.blend-pct').value) || 0;
      sumPct += pct;
      flours.push({ w, protein: prot, pct });
    });

    blendTotalPctNotice.textContent = `Somma Quote: ${sumPct.toFixed(0)}%`;
    if (Math.abs(sumPct - 100) > 0.1) {
      blendTotalPctNotice.style.color = '#e76f51';
    } else {
      blendTotalPctNotice.style.color = '#2a9d8f';
    }

    const blend = engine.calculateFlourBlend(flours);
    blendResultW.textContent = `W ${blend.w}`;
    blendResultProt.textContent = `${blend.protein}%`;
    blendResultHydr.textContent = `~${blend.maxRecommendedHydration}%`;

    applyBlendWToDirectBtn.textContent = `📥 Applica W ${blend.w} al Calcolatore Principale`;
  }

  flourBlendRows.addEventListener('input', recalculateBlend);

  addFlourRowBtn.addEventListener('click', () => {
    const newRow = document.createElement('div');
    newRow.className = 'blend-row';
    newRow.innerHTML = `
      <input type="text" class="form-input blend-name" value="Altra Farina">
      <input type="number" class="form-input blend-w" value="300" min="100" max="500">
      <input type="number" class="form-input blend-prot" value="13.0" min="8" max="20" step="0.1">
      <input type="number" class="form-input blend-pct" value="20" min="0" max="100">
      <button class="btn btn-secondary btn-sm delete-row-btn" style="color: #d90429;">✕</button>
    `;
    flourBlendRows.appendChild(newRow);

    newRow.querySelector('.delete-row-btn').addEventListener('click', () => {
      newRow.remove();
      recalculateBlend();
    });

    recalculateBlend();
  });

  applyBlendWToDirectBtn.addEventListener('click', () => {
    const calculatedW = parseInt(blendResultW.textContent.replace('W', '').trim()) || 280;
    state.flourW = calculatedW;
    flourWSlider.value = calculatedW;
    flourWInput.value = calculatedW;
    flourWVal.textContent = `W ${calculatedW}`;

    switchTab('tab-direct');
    recalculateDirect();
    showToast(`✅ Forza farina W ${calculatedW} applicata al calcolatore!`);
  });

  // --- CRONOPROGRAMMA / TIMELINE ---
  function updateTimeline() {
    const dateStr = targetBakeDate.value;
    const timeStr = targetBakeTime.value;
    if (!dateStr || !timeStr) return;

    const bakeTarget = new Date(`${dateStr}T${timeStr}`);
    const acclimation = parseFloat(timelineAcclimation.value) || 1;

    const oven = engine.OVENS[state.ovenType] || engine.OVENS.forno_casa_250;
    const timeline = engine.generateTimeline({
      bakeDate: bakeTarget,
      hoursRoomPuntata: state.hoursRoomPuntata,
      hoursFridge: state.hoursFridge,
      acclimationHours: acclimation,
      hoursRoomAppretto: state.hoursRoomAppretto,
      isIndirect: false,
      ovenPreheatMinutes: oven.preheatMinutes,
      ovenName: oven.name
    });

    let html = '';
    timeline.steps.forEach((step, index) => {
      const isLast = index === timeline.steps.length - 1;
      html += `
        <li class="timeline-item ${isLast ? 'active' : ''}">
          <div class="timeline-bullet"></div>
          <span class="timeline-time">${step.formattedTime}</span>
          <span class="timeline-duration-badge">${step.duration}</span>
          <div class="timeline-item-title">${step.label}</div>
          <div class="timeline-item-desc">${step.desc}</div>
        </li>
      `;
    });

    timelineList.innerHTML = html;
  }

  targetBakeDate.addEventListener('change', updateTimeline);
  targetBakeTime.addEventListener('change', updateTimeline);
  timelineAcclimation.addEventListener('input', updateTimeline);

  goToTimelineBtn.addEventListener('click', () => {
    switchTab('tab-timeline');
  });

  // --- LOGICA MODALITÀ REVERSE (WIZARD INTELLIGENTE) ---
  const STYLE_DEFAULTS = {
    napoletana_stg: { weight: 260, count: 4 },
    napoletana_canotto: { weight: 270, count: 4 },
    teglia_romana: { weight: 550, count: 2 },
    tonda_romana: { weight: 170, count: 4 },
    pinsa_romana: { weight: 320, count: 4 },
    new_york: { weight: 350, count: 3 },
    focaccia_genovese: { weight: 600, count: 2 }
  };

  function populateReverseFlours() {
    if (!revFlourSelect) return;
    const flours = engine.COMMERCIAL_FLOURS;
    if (!flours) return;

    const brands = {};
    for (const [key, f] of Object.entries(flours)) {
      if (!brands[f.brand]) brands[f.brand] = [];
      brands[f.brand].push({ key, ...f });
    }

    let html = '';
    for (const [brandName, list] of Object.entries(brands)) {
      html += `<optgroup label="${brandName}">`;
      list.forEach(item => {
        html += `<option value="${item.key}" ${item.key === 'caputo_pizzeria' ? 'selected' : ''}>${item.name} (W ${item.w})</option>`;
      });
      html += `</optgroup>`;
    }
    html += `<optgroup label="Personalizzata">
      <option value="custom">✏️ Inserisci W Manuale Personalizzato</option>
    </optgroup>`;

    revFlourSelect.innerHTML = html;
  }

  function updateFlourCard() {
    if (!revFlourSelect) return;
    const val = revFlourSelect.value;
    if (val === 'custom') {
      if (revCustomWGroup) revCustomWGroup.style.display = 'block';
      const customW = parseInt(revCustomWInput.value, 10) || 280;
      if (revFlourWDisplay) revFlourWDisplay.textContent = `W ${customW}`;
      if (revFlourProtDisplay) revFlourProtDisplay.textContent = `~${(10 + (customW * 0.012)).toFixed(1)}%`;
      if (revFlourPLDisplay) revFlourPLDisplay.textContent = '0.55';
      if (revFlourHydrDisplay) revFlourHydrDisplay.textContent = `~${Math.round(52 + (customW * 0.08))}%`;
      if (revFlourCatDisplay) revFlourCatDisplay.textContent = customW >= 300 ? 'Forte' : (customW >= 240 ? 'Media' : 'Debole');
    } else {
      if (revCustomWGroup) revCustomWGroup.style.display = 'none';
      const f = engine.COMMERCIAL_FLOURS[val];
      if (f) {
        if (revFlourWDisplay) revFlourWDisplay.textContent = `W ${f.w}`;
        if (revFlourProtDisplay) revFlourProtDisplay.textContent = `${f.protein}%`;
        if (revFlourPLDisplay) revFlourPLDisplay.textContent = f.pl.toFixed(2);
        if (revFlourHydrDisplay) revFlourHydrDisplay.textContent = `${f.maxHydr}%`;
        if (revFlourCatDisplay) revFlourCatDisplay.textContent = f.category;
      }
    }
  }

  function updateReverseOvenAdvice() {
    if (!revOvenSelect || !revOvenAdvice) return;
    const oven = engine.OVENS[revOvenSelect.value];
    if (oven) {
      revOvenAdvice.innerHTML = `💡 <span><strong>${oven.name}:</strong> ${oven.advice} ${oven.requiresFatAndSugar ? '(Aggiunti olio e zuccheri per compensare la cottura prolungata ed evitare secchezza)' : ''}</span>`;
    }
  }

  function recalculateReverse() {
    if (!revStyleSelect) return;

    const targetStyle = revStyleSelect.value;
    const flourKey = revFlourSelect ? revFlourSelect.value : 'caputo_pizzeria';
    const customFlourW = parseInt(revCustomWInput?.value, 10) || 280;
    const ovenKey = revOvenSelect ? revOvenSelect.value : 'forno_casa_250';
    const mixerKey = revMixerSelect ? revMixerSelect.value : 'spirale_1';
    const availableHours = parseFloat(revHours?.value) || 8;
    const numBalls = parseInt(revNumBalls?.value, 10) || 4;
    const ballWeight = parseFloat(revBallWeight?.value) || 260;
    const ambientTemp = parseFloat(revAmbientTemp?.value) || 21;

    const res = engine.optimizeReversePlan({
      targetStyle,
      flourKey,
      customFlourW,
      ovenKey,
      mixerKey,
      availableHours,
      numBalls,
      ballWeight,
      ambientTemp
    });

    currentReverseResult = res;

    // 1. Compatibilità Score
    const score = res.compatibilityScore;
    if (revScoreCircle) {
      revScoreCircle.textContent = `${score}%`;
      revScoreCircle.className = 'score-circle';
      if (score >= 90) {
        if (revScoreTitle) revScoreTitle.textContent = `Compatibilità Eccellente (${score}%)`;
        if (revScoreDesc) revScoreDesc.textContent = 'Farina, tempi di maturazione e forno sono in perfetto equilibrio reologico.';
      } else if (score >= 75) {
        revScoreCircle.classList.add('score-warning');
        if (revScoreTitle) revScoreTitle.textContent = `Buona Compatibilità (${score}%)`;
        if (revScoreDesc) revScoreDesc.textContent = 'La combinazione funziona bene grazie agli adattamenti scientifici applicati.';
      } else {
        revScoreCircle.classList.add('score-danger');
        if (revScoreTitle) revScoreTitle.textContent = `Attenzione Reologica (${score}%)`;
        if (revScoreDesc) revScoreDesc.textContent = 'La farina o i tempi selezionati richiedono accortezze particolari (vedi note sotto).';
      }
    }

    // 2. Visual Time Breakdown Bar
    const totalH = res.parameters.hoursRoomPuntata + res.parameters.hoursFridge + res.parameters.hoursRoomAppretto;
    const safeTotal = totalH > 0 ? totalH : 1;
    const pctPuntata = Math.max(10, Math.round((res.parameters.hoursRoomPuntata / safeTotal) * 100));
    const pctFridge = res.parameters.hoursFridge > 0 ? Math.round((res.parameters.hoursFridge / safeTotal) * 100) : 0;
    const pctAppretto = Math.max(10, 100 - pctPuntata - pctFridge);

    if (revTimeBarPuntata) {
      revTimeBarPuntata.style.width = `${pctPuntata}%`;
      revTimeBarPuntata.textContent = `Puntata: ${res.parameters.hoursRoomPuntata}h`;
    }
    if (revTimeBarFridge) {
      if (res.parameters.hoursFridge > 0) {
        revTimeBarFridge.style.display = 'block';
        revTimeBarFridge.style.width = `${pctFridge}%`;
        revTimeBarFridge.textContent = `Frigo: ${res.parameters.hoursFridge}h`;
      } else {
        revTimeBarFridge.style.display = 'none';
        revTimeBarFridge.style.width = '0%';
      }
    }
    if (revTimeBarAppretto) {
      revTimeBarAppretto.style.width = `${pctAppretto}%`;
      revTimeBarAppretto.textContent = `Appretto: ${res.parameters.hoursRoomAppretto}h`;
    }

    // 3. Note Strategiche
    if (revStrategyList) {
      let stratHtml = '';
      res.strategyNotes.forEach(note => {
        const isAlert = note.includes('⚠️');
        stratHtml += `<li class="rev-strategy-item ${isAlert ? 'alert' : ''}">${note}</li>`;
      });
      revStrategyList.innerHTML = stratHtml;
    }

    // 4. Tabella Ingredienti
    if (revRecipeTableBody) {
      const recipe = res.recipe;
      let tableHtml = `
        <tr>
          <td class="ing-name">🌾 Farina (${res.flour.name} - W ${res.flour.w})</td>
          <td class="ing-pct">100.0 %</td>
          <td class="ing-weight">${recipe.flour.toFixed(1)} g</td>
        </tr>
        <tr>
          <td class="ing-name">💧 Acqua (Idratazione calibrata)</td>
          <td class="ing-pct">${recipe.hydration.toFixed(1)} %</td>
          <td class="ing-weight">${recipe.water.toFixed(1)} g</td>
        </tr>
        <tr>
          <td class="ing-name">🧂 Sale Marino</td>
          <td class="ing-pct">${recipe.saltPct.toFixed(1)} %</td>
          <td class="ing-weight">${recipe.salt.toFixed(1)} g</td>
        </tr>
      `;

      if (recipe.fat > 0) {
        tableHtml += `
          <tr>
            <td class="ing-name">🫒 Olio Extravergine d'Oliva</td>
            <td class="ing-pct">${recipe.fatPct.toFixed(1)} %</td>
            <td class="ing-weight">${recipe.fat.toFixed(1)} g</td>
          </tr>
        `;
      }

      if (recipe.sugar > 0) {
        tableHtml += `
          <tr>
            <td class="ing-name">🍯 Malto Diastasico / Zucchero</td>
            <td class="ing-pct">${recipe.sugarPct.toFixed(1)} %</td>
            <td class="ing-weight">${recipe.sugar.toFixed(1)} g</td>
          </tr>
        `;
      }

      tableHtml += `
        <tr>
          <td class="ing-name">🍞 Lievito di Birra Fresco (LBF)</td>
          <td class="ing-pct">${recipe.yeastPct.toFixed(3)} %</td>
          <td class="ing-weight">${recipe.yeastGrams.toFixed(2)} g</td>
        </tr>
        <tr style="opacity: 0.75; font-size: 0.85rem;">
          <td class="ing-name" style="padding-left: 1.5rem;">↳ <em>oppure Lievito Secco (IDY)</em></td>
          <td class="ing-pct">${(recipe.yeastPct / 3).toFixed(3)} %</td>
          <td class="ing-weight">${(recipe.yeastGrams / 3).toFixed(2)} g</td>
        </tr>
        <tr class="recipe-total-row">
          <td><strong>⚖️ Totale Impasto (${res.parameters.numBalls} panetti da ${res.parameters.ballWeight}g)</strong></td>
          <td></td>
          <td class="ing-weight" style="color: var(--accent);">${Math.round(recipe.totalDough)} g</td>
        </tr>
      `;
      revRecipeTableBody.innerHTML = tableHtml;
    }

    // 5. Termodinamica TFI
    if (revWaterTempDisplay) {
      const thermo = res.recipe.thermodynamics;
      revWaterTempDisplay.textContent = `${thermo.waterTemp.toFixed(1)} °C`;
      if (revThermoSubtext) {
        if (thermo.needsIce) {
          revThermoSubtext.innerHTML = `⚠️ <strong>Attrito elevato!</strong> Usa <strong>${thermo.iceGrams}g</strong> di ghiaccio tritato + <strong>${thermo.liquidWaterGrams}g</strong> di acqua fredda da frigo.`;
        } else {
          revThermoSubtext.textContent = `Acqua a ${thermo.waterTemp.toFixed(1)}°C per chiusura a 23°C con ${res.mixer.name}.`;
        }
      }
    }

    // 6. Timeline Step-by-Step
    if (revTimelineList) {
      let timelineHtml = '';
      res.timeline.forEach(step => {
        timelineHtml += `
          <li class="timeline-item ${step.isPast ? 'timeline-past' : ''}">
            <div class="timeline-time">${step.timeStr}</div>
            <span class="timeline-duration-badge">${step.duration}</span>
            <div class="timeline-item-title">${step.label}</div>
            <div class="timeline-item-desc">${step.desc}</div>
          </li>
        `;
      });
      revTimelineList.innerHTML = timelineHtml;
    }
  }

  function initReverseMode() {
    if (!revStyleSelect) return;

    populateReverseFlours();
    updateFlourCard();
    updateReverseOvenAdvice();

    // Event listeners
    if (revRunBtn) revRunBtn.addEventListener('click', recalculateReverse);

    revStyleSelect.addEventListener('change', () => {
      const def = STYLE_DEFAULTS[revStyleSelect.value];
      if (def) {
        if (revBallWeight) revBallWeight.value = def.weight;
        if (revNumBalls) revNumBalls.value = def.count;
      }
      recalculateReverse();
    });

    if (revFlourSelect) {
      revFlourSelect.addEventListener('change', () => {
        updateFlourCard();
        recalculateReverse();
      });
    }

    if (revCustomWInput) {
      revCustomWInput.addEventListener('input', () => {
        updateFlourCard();
        recalculateReverse();
      });
    }

    if (revOvenSelect) {
      revOvenSelect.addEventListener('change', () => {
        updateReverseOvenAdvice();
        recalculateReverse();
      });
    }

    if (revMixerSelect) {
      revMixerSelect.addEventListener('change', recalculateReverse);
    }

    if (revNumBalls) revNumBalls.addEventListener('input', recalculateReverse);
    if (revBallWeight) revBallWeight.addEventListener('input', recalculateReverse);
    if (revAmbientTemp) revAmbientTemp.addEventListener('input', recalculateReverse);

    // Quick pills ore
    revQuickPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const h = parseInt(pill.dataset.hours, 10);
        if (revHours) revHours.value = h;
        if (revHoursInput) revHoursInput.value = h;
        if (revHoursVal) revHoursVal.textContent = `${h} ore`;
        revQuickPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        recalculateReverse();
      });
    });

    if (revHours) {
      revHours.addEventListener('input', () => {
        const h = revHours.value;
        if (revHoursInput) revHoursInput.value = h;
        if (revHoursVal) revHoursVal.textContent = `${h} ore`;
        revQuickPills.forEach(p => {
          if (parseInt(p.dataset.hours, 10) === parseInt(h, 10)) {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });
        recalculateReverse();
      });
    }

    if (revHoursInput) {
      revHoursInput.addEventListener('input', () => {
        const h = revHoursInput.value;
        if (revHours) revHours.value = h;
        if (revHoursVal) revHoursVal.textContent = `${h} ore`;
        revQuickPills.forEach(p => {
          if (parseInt(p.dataset.hours, 10) === parseInt(h, 10)) {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });
        recalculateReverse();
      });
    }

    // Carica ricetta nel calcolatore principale
    if (revApplyToDirectBtn) {
      revApplyToDirectBtn.addEventListener('click', () => {
        if (!currentReverseResult) return;
        const p = currentReverseResult.parameters;

        state.numBalls = p.numBalls;
        state.ballWeight = p.ballWeight;
        state.totalDoughWeight = p.numBalls * p.ballWeight;
        state.hydration = p.hydration;
        state.saltPct = p.saltPct;
        state.fatPct = p.fatPct;
        state.sugarPct = p.sugarPct;
        state.hoursRoomPuntata = p.hoursRoomPuntata;
        state.hoursFridge = p.hoursFridge;
        state.hoursRoomAppretto = p.hoursRoomAppretto;
        state.flourW = p.flourW;
        state.ambientTemp = p.ambientTemp;
        state.ovenType = p.ovenType;
        if (p.mixerKey) {
          state.friction = p.friction;
          if (mixerTypeSelect) mixerTypeSelect.value = p.mixerKey;
        }

        // Sincronizza UI calcolatore diretto
        numBallsSlider.value = p.numBalls;
        numBallsInput.value = p.numBalls;
        numBallsVal.textContent = p.numBalls;

        ballWeightSlider.value = p.ballWeight;
        ballWeightInput.value = p.ballWeight;
        ballWeightVal.textContent = `${p.ballWeight} g`;

        totalDoughWeightInput.value = state.totalDoughWeight;

        hydrationSlider.value = p.hydration;
        hydrationInput.value = p.hydration;
        hydrationVal.textContent = `${p.hydration} %`;

        saltPctSlider.value = p.saltPct;
        saltPctInput.value = p.saltPct;
        saltPctVal.textContent = `${p.saltPct} %`;

        fatPctSlider.value = p.fatPct;
        fatPctInput.value = p.fatPct;
        fatPctVal.textContent = `${p.fatPct} %`;

        sugarPctSlider.value = p.sugarPct;
        sugarPctInput.value = p.sugarPct;
        sugarPctVal.textContent = `${p.sugarPct} %`;

        hoursRoomPuntataSlider.value = p.hoursRoomPuntata;
        hoursRoomPuntataInput.value = p.hoursRoomPuntata;
        hoursRoomPuntataVal.textContent = `${p.hoursRoomPuntata} h`;

        hoursFridgeSlider.value = p.hoursFridge;
        hoursFridgeInput.value = p.hoursFridge;
        hoursFridgeVal.textContent = `${p.hoursFridge} h`;

        hoursRoomApprettoSlider.value = p.hoursRoomAppretto;
        hoursRoomApprettoInput.value = p.hoursRoomAppretto;
        hoursRoomApprettoVal.textContent = `${p.hoursRoomAppretto} h`;

        flourWSlider.value = p.flourW;
        flourWInput.value = p.flourW;
        flourWVal.textContent = `W ${p.flourW}`;

        ambientTempSlider.value = p.ambientTemp;
        ambientTempInput.value = p.ambientTemp;
        ambientTempVal.textContent = `${p.ambientTemp} °C`;

        ovenTypeSelect.value = p.ovenType;

        recalculateDirect();
        switchTab('tab-direct');
        showToast('Parametri ottimizzati trasferiti nel Calcolatore Diretto!', '🧙');
      });
    }

    // Copia scheda tecnica ottimizzata
    if (revCopyRecipeBtn) {
      revCopyRecipeBtn.addEventListener('click', () => {
        if (!currentReverseResult) return;
        const res = currentReverseResult;
        const recipe = res.recipe;
        const thermo = recipe.thermodynamics;

        let text = `🍕 RICETTA OTTIMIZZATA (MODALITÀ REVERSE) - PizzaLab\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `Stile: ${res.styleName}\n`;
        text += `Farina: ${res.flour.name} (W ${res.flour.w}, Proteine ${res.flour.protein}%)\n`;
        text += `Forno: ${res.oven.name}\n`;
        text += `Impastatrice: ${res.mixer.name}\n`;
        text += `Tempo Totale: ${res.availableHours} ore (Compatibilità: ${res.compatibilityScore}%)\n\n`;
        text += `⚖️ INGREDIENTI (${res.parameters.numBalls} panetti da ${res.parameters.ballWeight}g - Totale ${Math.round(recipe.totalDough)}g):\n`;
        text += `• Farina: ${recipe.flour.toFixed(1)}g (100%)\n`;
        text += `• Acqua: ${recipe.water.toFixed(1)}g (${recipe.hydration}%)\n`;
        text += `• Sale: ${recipe.salt.toFixed(1)}g (${recipe.saltPct}%)\n`;
        if (recipe.fat > 0) text += `• Olio EVO: ${recipe.fat.toFixed(1)}g (${recipe.fatPct}%)\n`;
        if (recipe.sugar > 0) text += `• Malto/Zucchero: ${recipe.sugar.toFixed(1)}g (${recipe.sugarPct}%)\n`;
        text += `• Lievito Fresco LBF: ${recipe.yeastGrams.toFixed(2)}g (${recipe.yeastPct.toFixed(3)}%)\n`;
        text += `  (oppure Lievito Secco IDY: ${(recipe.yeastGrams / 3).toFixed(2)}g)\n\n`;
        text += `🌡️ TEMPERATURA ACQUA TFI: ${thermo.waterTemp.toFixed(1)}°C\n\n`;
        text += `📋 ADATTAMENTI SCIENTIFICI:\n`;
        res.strategyNotes.forEach(n => { text += `• ${n}\n`; });
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        navigator.clipboard.writeText(text).then(() => {
          showToast('Scheda Reverse copiata con successo!', '📋');
        }).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showToast('Scheda copiata negli appunti!', '📋');
        });
      });
    }

    recalculateReverse();
  }

  // --- GESTIONE TABS ---
  function switchTab(tabId) {
    tabButtons.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    if (tabId === 'tab-reverse') recalculateReverse();
    if (tabId === 'tab-indirect') recalculateIndirect();
    if (tabId === 'tab-teglia') recalculateTeglia();
    if (tabId === 'tab-blend') recalculateBlend();
    if (tabId === 'tab-timeline') updateTimeline();
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // --- TOAST NOTIFICATION ---
  function showToast(message, icon = '📋') {
    toastMsg.textContent = message;
    document.getElementById('toastIcon').textContent = icon;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --- COPIA RICETTA FORMATTATA ---
  copyRecipeBtn.addEventListener('click', () => {
    if (!currentCalculatedDough) return;

    const res = currentCalculatedDough;
    const thermo = res.thermodynamics;

    let text = `🍕 RICETTA PIZZA SCIENTIFICA - PizzaLab Pro\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Stile: ${engine.PRESETS[state.activePreset]?.name || 'Personalizzato'}\n`;
    text += `Panetti: ${res.numBalls} da ${res.ballWeight}g (Totale ${Math.round(res.totalDough)}g)\n\n`;
    text += `⚖️ INGREDIENTI:\n`;
    text += `• Farina (W ${state.flourW}): ${res.flour.toFixed(1)}g (100%)\n`;
    text += `• Acqua: ${res.water.toFixed(1)}g (${res.hydration}%)\n`;
    text += `• Sale: ${res.salt.toFixed(1)}g (${res.saltPct}%)\n`;
    if (res.fat > 0) text += `• Olio EVO/Grassi: ${res.fat.toFixed(1)}g (${res.fatPct}%)\n`;
    if (res.sugar > 0) text += `• Malto/Zucchero: ${res.sugar.toFixed(1)}g (${res.sugarPct}%)\n`;

    if (state.yeastType === 'fresh') {
      text += `• Lievito Fresco LBF: ${res.yeastGrams.toFixed(2)}g (${res.yeastPct.toFixed(3)}%)\n`;
    } else if (state.yeastType === 'dry') {
      text += `• Lievito Secco IDY: ${res.yeastGrams.toFixed(2)}g (${res.yeastPct.toFixed(3)}%)\n`;
    } else if (state.yeastType === 'licoli') {
      text += `• Li.Co.Li (Idr. 100%): ${res.licoliGrams.toFixed(1)}g (${res.yeastPct}%)\n`;
    } else if (state.yeastType === 'madre') {
      text += `• Pasta Madre (Idr. 50%): ${res.pastaMadreGrams.toFixed(1)}g (${res.yeastPct}%)\n`;
    }

    text += `\n🌡️ TERMODINAMICA TFI:\n`;
    text += `• Temperatura Acqua da Inserire: ${thermo.waterTemp.toFixed(1)}°C\n`;
    if (thermo.needsIce) {
      text += `• ATTENZIONE GHIACCIO: usa ${thermo.iceGrams}g di ghiaccio tritato + ${thermo.liquidWaterGrams}g di acqua!\n`;
    }

    text += `\n⏳ TEMPI & FERMENTAZIONE:\n`;
    text += `• Puntata a T.A. (${state.ambientTemp}°C): ${state.hoursRoomPuntata} ore\n`;
    if (state.hoursFridge > 0) text += `• Frigorifero (4°C): ${state.hoursFridge} ore\n`;
    text += `• Appretto Panetti a T.A.: ${state.hoursRoomAppretto} ore\n`;
    text += `• Maturazione Enzimatica: ${res.maturation.message}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Ricetta copiata con successo!');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Ricetta copiata negli appunti!');
    });
  });

  // --- GESTIONE PREFERENZE PREDEFINITE DELL'UTENTE (LOCALSTORAGE) ---
  function saveUserDefaults(fromTab = 'direct') {
    let defaults = {};

    if (fromTab === 'reverse' && currentReverseResult) {
      const p = currentReverseResult.parameters;
      defaults = {
        ovenType: revOvenSelect.value,
        mixerKey: revMixerSelect.value,
        flourKey: revFlourSelect.value,
        flourW: p.flourW,
        numBalls: p.numBalls,
        ballWeight: p.ballWeight,
        ambientTemp: p.ambientTemp,
        flourTemp: state.flourTemp,
        tapWaterTemp: state.tapWaterTemp,
        targetTFI: state.targetTFI,
        yeastType: state.yeastType,
        isPrudentialMode: state.isPrudentialMode
      };
      // Sincronizza anche il tab Diretto
      state.ovenType = defaults.ovenType;
      ovenTypeSelect.value = defaults.ovenType;
      if (mixerTypeSelect) mixerTypeSelect.value = defaults.mixerKey;
      state.numBalls = defaults.numBalls;
      state.ballWeight = defaults.ballWeight;
      numBallsSlider.value = defaults.numBalls;
      numBallsInput.value = defaults.numBalls;
      numBallsVal.textContent = defaults.numBalls;
      ballWeightSlider.value = defaults.ballWeight;
      ballWeightInput.value = defaults.ballWeight;
      ballWeightVal.textContent = `${defaults.ballWeight} g`;
      state.ambientTemp = defaults.ambientTemp;
      ambientTempSlider.value = defaults.ambientTemp;
      ambientTempInput.value = defaults.ambientTemp;
      ambientTempVal.textContent = `${defaults.ambientTemp} °C`;
      recalculateDirect();
    } else {
      defaults = {
        ovenType: ovenTypeSelect.value,
        mixerKey: mixerTypeSelect.value,
        flourKey: revFlourSelect ? revFlourSelect.value : 'caputo_pizzeria',
        flourW: state.flourW,
        numBalls: state.numBalls,
        ballWeight: state.ballWeight,
        ambientTemp: state.ambientTemp,
        flourTemp: state.flourTemp,
        tapWaterTemp: state.tapWaterTemp,
        targetTFI: state.targetTFI,
        yeastType: state.yeastType,
        isPrudentialMode: state.isPrudentialMode
      };
      // Sincronizza anche il tab Reverse
      if (revOvenSelect) revOvenSelect.value = defaults.ovenType;
      if (revMixerSelect) revMixerSelect.value = defaults.mixerKey;
      if (revNumBalls) revNumBalls.value = defaults.numBalls;
      if (revBallWeight) revBallWeight.value = defaults.ballWeight;
      if (revAmbientTemp) revAmbientTemp.value = defaults.ambientTemp;
      recalculateReverse();
    }

    localStorage.setItem('pizzalab_user_defaults', JSON.stringify(defaults));
    if (resetDefaultsBtn) resetDefaultsBtn.style.display = 'inline-flex';
    showToast('⭐ Forno, impastatrice e parametri salvati come predefiniti!', '💾');
  }

  function loadUserDefaults() {
    const raw = localStorage.getItem('pizzalab_user_defaults');
    if (!raw) return false;

    try {
      const d = JSON.parse(raw);
      if (!d) return false;

      // Aggiorna state
      if (d.ovenType) state.ovenType = d.ovenType;
      if (d.numBalls) state.numBalls = d.numBalls;
      if (d.ballWeight) state.ballWeight = d.ballWeight;
      state.totalDoughWeight = state.numBalls * state.ballWeight;
      if (d.ambientTemp !== undefined) state.ambientTemp = d.ambientTemp;
      if (d.flourTemp !== undefined) state.flourTemp = d.flourTemp;
      if (d.tapWaterTemp !== undefined) state.tapWaterTemp = d.tapWaterTemp;
      if (d.targetTFI !== undefined) state.targetTFI = d.targetTFI;
      if (d.flourW !== undefined) state.flourW = d.flourW;
      if (d.yeastType) state.yeastType = d.yeastType;
      if (d.isPrudentialMode !== undefined) state.isPrudentialMode = d.isPrudentialMode;

      // Sincronizza UI Diretto
      if (ovenTypeSelect && d.ovenType) ovenTypeSelect.value = d.ovenType;
      if (mixerTypeSelect && d.mixerKey) mixerTypeSelect.value = d.mixerKey;
      if (numBallsSlider) {
        numBallsSlider.value = state.numBalls;
        numBallsInput.value = state.numBalls;
        numBallsVal.textContent = state.numBalls;
      }
      if (ballWeightSlider) {
        ballWeightSlider.value = state.ballWeight;
        ballWeightInput.value = state.ballWeight;
        ballWeightVal.textContent = `${state.ballWeight} g`;
      }
      if (totalDoughWeightInput) totalDoughWeightInput.value = state.totalDoughWeight;
      if (ambientTempSlider) {
        ambientTempSlider.value = state.ambientTemp;
        ambientTempInput.value = state.ambientTemp;
        ambientTempVal.textContent = `${state.ambientTemp} °C`;
      }
      if (flourTempInput) flourTempInput.value = state.flourTemp;
      if (tapWaterTempInput) tapWaterTempInput.value = state.tapWaterTemp;
      if (targetTFIInput) targetTFIInput.value = state.targetTFI;
      if (flourWSlider) {
        flourWSlider.value = state.flourW;
        flourWInput.value = state.flourW;
        flourWVal.textContent = `W ${state.flourW}`;
      }
      if (yeastTypeSelect && d.yeastType) yeastTypeSelect.value = d.yeastType;
      if (prudentialToggle && d.isPrudentialMode !== undefined) {
        prudentialToggle.checked = d.isPrudentialMode;
        if (prudentialDetails) prudentialDetails.style.display = d.isPrudentialMode ? 'block' : 'none';
      }

      // Sincronizza UI Reverse
      if (revOvenSelect && d.ovenType) revOvenSelect.value = d.ovenType;
      if (revMixerSelect && d.mixerKey) revMixerSelect.value = d.mixerKey;
      if (revFlourSelect && d.flourKey) {
        revFlourSelect.value = d.flourKey;
        updateFlourCard();
      }
      if (revNumBalls && d.numBalls) revNumBalls.value = d.numBalls;
      if (revBallWeight && d.ballWeight) revBallWeight.value = d.ballWeight;
      if (revAmbientTemp && d.ambientTemp) revAmbientTemp.value = d.ambientTemp;

      if (resetDefaultsBtn) resetDefaultsBtn.style.display = 'inline-flex';
      recalculateDirect();
      return true;
    } catch (e) {
      console.warn("Errore caricamento preferenze utente:", e);
      return false;
    }
  }

  function resetUserDefaults() {
    localStorage.removeItem('pizzalab_user_defaults');
    if (resetDefaultsBtn) resetDefaultsBtn.style.display = 'none';
    applyPreset('napoletana_stg');
    if (revOvenSelect) revOvenSelect.value = 'forno_casa_250';
    if (revMixerSelect) revMixerSelect.value = 'spirale_1';
    if (revFlourSelect) {
      revFlourSelect.value = 'caputo_pizzeria';
      updateFlourCard();
    }
    recalculateReverse();
    showToast('Valori di fabbrica ripristinati!', '🔄');
  }

  if (saveDefaultsBtn) {
    saveDefaultsBtn.addEventListener('click', () => saveUserDefaults('direct'));
  }
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', resetUserDefaults);
  }
  if (saveEquipmentDirectBtn) {
    saveEquipmentDirectBtn.addEventListener('click', () => saveUserDefaults('direct'));
  }
  if (saveEquipmentReverseBtn) {
    saveEquipmentReverseBtn.addEventListener('click', () => saveUserDefaults('reverse'));
  }

  // --- TEMA CHIARO / SCURO ---
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('pizzalab_theme', newTheme);
  });

  const savedTheme = localStorage.getItem('pizzalab_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // --- STAMPA ---
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // Avvio iniziale
  initReverseMode();
  const defaultsLoaded = loadUserDefaults();
  if (!defaultsLoaded) {
    recalculateDirect();
  }
  recalculateIndirect();
  recalculateTeglia();
  recalculateBlend();
  updateTimeline();
  recalculateReverse();
});
