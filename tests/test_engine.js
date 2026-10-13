/**
 * Test suite for the scientific pizza dough engine
 */
const { 
  calculateDirectDough, 
  calculateThermodynamics, 
  calculateFlourBlend, 
  calculateTeglia,
  calculatePrefermentBiga,
  calculatePrefermentPoolish,
  generateTimeline,
  PRESETS
} = require('../js/engine.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

function runTests() {
  console.log("=== INIZIO TEST SCIENTIFICI IMPASTO PIZZA ===\n");

  // TEST 1: Napoletana Classica 8h TA
  console.log("--- Test 1: Napoletana Classica (Diretto, 8h a TA 22°C) ---");
  const napTest = calculateDirectDough({
    numBalls: 6,
    ballWeight: 260,
    hydration: 62,
    saltPct: 2.8,
    fatPct: 0,
    ambientTemp: 22,
    hoursRoomPuntata: 2,
    hoursFridge: 0,
    fridgeTemp: 4,
    hoursRoomAppretto: 6,
    yeastType: 'fresh',
    flourW: 260
  });

  const totalDough = 6 * 260; // 1560g
  assert(Math.abs(napTest.totalDough - totalDough) < 0.1, `Peso totale impasto corretto (${napTest.totalDough}g)`);
  assert(napTest.flour > 900 && napTest.flour < 1000, `Farina bilanciata (~946g): ${napTest.flour}g`);
  assert(napTest.water > 550 && napTest.water < 620, `Acqua idratata al 62% (~586g): ${napTest.water}g`);
  assert(napTest.salt > 24 && napTest.salt < 29, `Sale al 2.8% (~26.5g): ${napTest.salt}g`);
  assert(napTest.yeastFresh > 2.5 && napTest.yeastFresh < 6.0, `Lievito fresco coerente (~3-5g per 8h 22°C): ${napTest.yeastFresh}g (${napTest.yeastPct.toFixed(3)}%)`);
  assert(napTest.maturation.status === 'optimal' || napTest.maturation.status === 'good', `Maturazione W260 per 8h accettabile/buona: ${napTest.maturation.status}`);

  // TEST 2: Termodinamica e Calcolo Ghiaccio (TFI)
  console.log("\n--- Test 2: Termodinamica TFI e Fabbisogno Ghiaccio ---");
  // Caso normale
  const thermoNormal = calculateThermodynamics({
    targetTemp: 23,
    roomTemp: 21,
    flourTemp: 20,
    friction: 5,
    totalWater: 600,
    tapWaterTemp: 18
  });
  // T_water = 3*23 - (21+20+5) = 69 - 46 = 23°C
  assert(thermoNormal.waterTemp === 23, `Temperatura acqua normale corretta: ${thermoNormal.waterTemp}°C`);
  assert(!thermoNormal.needsIce, `Nessun ghiaccio richiesto con acqua a 23°C`);

  // Caso estivo estremo (richiede ghiaccio)
  const thermoSummer = calculateThermodynamics({
    targetTemp: 23,
    roomTemp: 30,
    flourTemp: 28,
    friction: 10, // spirale veloce
    totalWater: 600,
    tapWaterTemp: 22
  });
  // T_water = 3*23 - (30+28+10) = 69 - 68 = 1°C -> Richiede ghiaccio!
  assert(thermoSummer.waterTemp === 1, `Temperatura acqua richiesta bassissima: ${thermoSummer.waterTemp}°C`);
  assert(thermoSummer.needsIce, `Rilevata correttamente necessità di ghiaccio`);
  assert(thermoSummer.iceGrams > 100 && thermoSummer.iceGrams < 150, `Calcolo entalpia ghiaccio corretto (~123g): ${thermoSummer.iceGrams}g ghiaccio + ${thermoSummer.liquidWaterGrams}g acqua`);

  // TEST 3: Miscela Farine (Blend W e Proteine)
  console.log("\n--- Test 3: Miscela Farine (Blend W ponderato) ---");
  const blend = calculateFlourBlend([
    { name: 'Manitoba', w: 380, protein: 14.5, pct: 60 },
    { name: 'Tipo 0 debole', w: 200, protein: 10.5, pct: 40 }
  ]);
  // W atteso: 380*0.6 + 200*0.4 = 228 + 80 = 308
  assert(Math.abs(blend.w - 308) < 0.1, `W ponderato calcolato esattamente a 308: ${blend.w}`);
  // Proteine attese: 14.5*0.6 + 10.5*0.4 = 8.7 + 4.2 = 12.9%
  assert(Math.abs(blend.protein - 12.9) < 0.1, `Proteine ponderate calcolate esattamente a 12.9%: ${blend.protein}%`);

  // TEST 4: Calcolo Teglia (Rettangolare e Tonda)
  console.log("\n--- Test 4: Calcolo Dimensioni Teglia ---");
  const tegliaRett = calculateTeglia({
    shape: 'rectangle',
    length: 40,
    width: 30,
    coefficient: 0.60
  });
  // Area = 1200 cm² * 0.60 = 720g
  assert(tegliaRett.doughWeight === 720, `Peso impasto teglia 40x30 corretto: ${tegliaRett.doughWeight}g`);

  const tegliaTonda = calculateTeglia({
    shape: 'round',
    diameter: 32,
    coefficient: 0.55
  });
  // Area = pi * 16^2 = 804.24 * 0.55 = 442g
  assert(Math.abs(tegliaTonda.doughWeight - 442) <= 1, `Peso impasto teglia tonda d32 corretto: ${tegliaTonda.doughWeight}g`);

  // TEST 5: Metodo Indiretto Biga (100% e 50%)
  console.log("\n--- Test 5: Metodi Indiretti (Biga 100% e Biga 50%) ---");
  const bigaResult = calculatePrefermentBiga({
    totalFlour: 1000,
    totalHydration: 70,
    totalSaltPct: 2.5,
    totalFatPct: 2.0,
    bigaFlourPct: 100, // 100% biga
    bigaHydration: 45,
    bigaYeastPct: 1.0 // 1% lbf su farina biga
  });
  assert(bigaResult.biga.flour === 1000, `Biga 100% farina corretta: ${bigaResult.biga.flour}g`);
  assert(bigaResult.biga.water === 450, `Acqua biga al 45% corretta: ${bigaResult.biga.water}g`);
  assert(bigaResult.biga.yeastFresh === 10, `Lievito fresco biga corretto: ${bigaResult.biga.yeastFresh}g`);
  assert(bigaResult.refreshment.water === 250, `Acqua rinfresco corretta (700-450 = 250g): ${bigaResult.refreshment.water}g`);
  assert(bigaResult.refreshment.salt === 25, `Sale rinfresco corretto: ${bigaResult.refreshment.salt}g`);

  // TEST 6: Lievito Madre / Licoli
  console.log("\n--- Test 6: Lievito Madre e Licoli (Compensazione liquidi e solidi) ---");
  const licoliTest = calculateDirectDough({
    numBalls: 4,
    ballWeight: 280,
    hydration: 70,
    saltPct: 2.5,
    fatPct: 0,
    ambientTemp: 21,
    hoursRoomPuntata: 4,
    hoursFridge: 24,
    fridgeTemp: 4,
    hoursRoomAppretto: 4,
    yeastType: 'licoli',
    sourdoughPct: 20, // 20% licoli su farina
    flourW: 320
  });
  assert(licoliTest.licoliGrams > 100, `Grammatura licoli calcolata: ${licoliTest.licoliGrams}g`);
  assert(Math.abs(licoliTest.flour + (licoliTest.licoliGrams/2) - licoliTest.totalFlourEquivalent) < 1, `Farina totale rispettata dopo sottrazione licoli`);
  assert(Math.abs(licoliTest.water + (licoliTest.licoliGrams/2) - licoliTest.totalWaterEquivalent) < 1, `Acqua totale rispettata dopo sottrazione licoli`);

  // TEST 7: Cronoprogramma Temporale
  console.log("\n--- Test 7: Cronoprogramma / Timeline Backward Planning ---");
  const bakeTarget = new Date("2026-10-17T20:00:00");
  const timeline = generateTimeline({
    bakeDate: bakeTarget,
    hoursRoomPuntata: 2,
    hoursFridge: 24,
    fridgeTemp: 4,
    acclimationHours: 1,
    hoursRoomAppretto: 5,
    isIndirect: false
  });
  assert(timeline.steps.length >= 6, `Tappe timeline generate: ${timeline.steps.length}`);
  const firstStep = timeline.steps[0];
  const lastStep = timeline.steps[timeline.steps.length - 1];
  assert(lastStep.label.includes("Infornata") || lastStep.label.includes("Cottura"), `Ultimo step infornata`);
  console.log(`Inizio impasto calcolato a ritroso: ${firstStep.formattedTime} -> Infornata: ${lastStep.formattedTime}`);

  console.log("\n🎉 TUTTI I TEST SCIENTIFICI SUPERATI CON SUCCESSO!");
}

runTests();
