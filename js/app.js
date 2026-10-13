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
    friction: 5,
    targetTFI: 23,
    tapWaterTemp: 18,
    activePreset: 'napoletana_stg'
  };

  // --- SELETTORI DOM ---
  // Sliders e Inputs Diretti
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

  // Azioni & Toast
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
  const mixerTips = {
    "1": "👐 <strong>Impasto a mano:</strong> Trasferimento termico minimo (~1°C dalle mani). Per idratazioni elevate (>65%), effettua pause di 15 min e pieghe di rinforzo (slap & fold).",
    "5": "🌀 <strong>Spirale 1ª vel / Planetaria:</strong> Attrito moderato (~5°C). Ottima per incordare impasti tra 60% e 70%. Durata tipica d'impastamento: 10-14 minuti.",
    "9": "⚡ <strong>Spirale 2ª velocità (Alta incordatura):</strong> Attrito marcato (~9-12°C). Indispensabile per idratazioni estreme (75-85% teglia/pinsa), inserendo l'acqua a filo. Richiede acqua quasi gelata!",
    "3": "🤿 <strong>Braccia Tuffanti:</strong> Il massimo per l'ossigenazione dell'impasto. Scalda pochissimo (~3°C), simula il movimento umano senza stressare le catene glutiniche.",
    "2": "🔱 <strong>Forcella:</strong> Macchina tradizionale da pizzeria napoletana. Bassa velocità, attrito minimo (~2°C), non surriscalda. Richiede tempi più lunghi (18-22 minuti).",
    "custom": "⚙️ <strong>Attrito Personalizzato:</strong> Inserisci il surriscaldamento specifico della tua impastatrice."
  };

  mixerTypeSelect.addEventListener('change', () => {
    if (mixerTypeSelect.value === 'custom') {
      const customFriction = prompt("Inserisci l'attrito meccanico stimato in °C:", "5");
      state.friction = parseFloat(customFriction) || 5;
    } else {
      state.friction = parseFloat(mixerTypeSelect.value);
    }
    if (mixerTip && mixerTips[mixerTypeSelect.value]) {
      mixerTip.innerHTML = mixerTips[mixerTypeSelect.value];
    }
    recalculateDirect();
  });

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
      tapWaterTemp: state.tapWaterTemp
    });

    currentCalculatedDough = res;

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

    const timeline = engine.generateTimeline({
      bakeDate: bakeTarget,
      hoursRoomPuntata: state.hoursRoomPuntata,
      hoursFridge: state.hoursFridge,
      acclimationHours: acclimation,
      hoursRoomAppretto: state.hoursRoomAppretto,
      isIndirect: false
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
  recalculateDirect();
  recalculateIndirect();
  recalculateTeglia();
  recalculateBlend();
  updateTimeline();
});
