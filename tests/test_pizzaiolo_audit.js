/**
 * PizzaLab Scientifico - Test Suite & Scientific Audit
 * Simulazione avanzata con due profili distinti:
 * 1. PIZZAIOLO PROFESSIONISTA (AVPN / Reologia contemporanea)
 * 2. PIZZAIOLO CASALINGO (Sicurezza, limiti termici, adattamento forno 250°C)
 */

const engine = require('../js/engine.js');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    if (details) console.log(`     ↳ ${details}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     ↳ ${details}`);
    failCount++;
    throw new Error(`Assertion failed: ${testName} - ${details}`);
  }
}

console.log("===============================================================================");
console.log("       PIZZALAB SCIENTIFICO - COLLAUDO & AUDIT SCIENTIFICO AVANZATO           ");
console.log("===============================================================================\n");

// =============================================================================
// PARTE 1: PROFILO PIZZAIOLO PROFESSIONISTA
// =============================================================================
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🍕 PROFILO 1: PIZZAIOLO PROFESSIONISTA (AVPN & Reologia Contemporanea)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// --- CASO P1: Napoletana Contemporanea a Canotto 48h ---
console.log("📌 CASO P1: Napoletana Contemporanea a Canotto 48h");
console.log("   Setup: Farina Caputo Nuvola Super (W 330), Spirale 2ª vel (attrito 9°C),");
console.log("          48h totali (2h TA + 42h frigo 4°C + 4h appretto TA), forno Effeuno 500°C,");
console.log("          Autolisi al 60% e Pieghe di rinforzo attive.\n");

const p1Reverse = engine.optimizeReversePlan({
  targetStyle: 'napoletana_canotto',
  flourKey: 'caputo_nuvola_super',
  ovenKey: 'forno_elettrico_pro',
  mixerKey: 'spirale_2',
  availableHours: 48,
  numBalls: 6,
  ballWeight: 270,
  ambientTemp: 22,
  useAutolyse: true,
  useFolds: true
});

const p1Recipe = p1Reverse.recipe;

// Verifiche chimiche & reologiche P1
assert(p1Recipe.fat === 0, "Zero grassi", `Grassi: ${p1Recipe.fat}g (essenziale a 500°C per evitare fumo e bruciatura superficiale)`);
assert(p1Recipe.sugar === 0, "Zero zuccheri/malto", `Zuccheri: ${p1Recipe.sugar}g (a 500°C il malto provocherebbe carbonizzazione in 40s)`);
assert(p1Reverse.flour.w === 330, "Riconoscimento farina Caputo Nuvola Super W330", `W: ${p1Reverse.flour.w}, Proteine: ${p1Reverse.flour.protein}%`);
assert(p1Recipe.hydration === 70, "Idratazione da Napoletana Contemporanea", `Idratazione: ${p1Recipe.hydration}%`);
assert(p1Reverse.compatibilityScore >= 90, "Punteggio di compatibilità reologica eccellente", `Score: ${p1Reverse.compatibilityScore}% (W330 è ideale per 48h)`);

// Verifica scomposizione acqua Autolisi al 60%
const expectedAutolyseWater = Math.round(p1Recipe.flour * 0.60 * 10) / 10;
const expectedClosingWater = Math.round((p1Recipe.water - expectedAutolyseWater) * 10) / 10;
assert(Math.abs(p1Reverse.autolyseWater - expectedAutolyseWater) < 0.2, "Ripartizione acqua per Autolisi al 60%", `Acqua autolisi: ${p1Reverse.autolyseWater}g, Acqua chiusura: ${p1Reverse.closingWater}g (Tot: ${p1Recipe.water}g)`);

// Verifica termodinamica Spirale 2ª velocità (attrito 9°C) con temperatura estiva/moderata
const p1Thermo = engine.calculateThermodynamics({
  targetTemp: 23,
  roomTemp: 24,
  flourTemp: 23,
  friction: 9, // Spirale 2ª vel
  totalWater: p1Recipe.water,
  tapWaterTemp: 20
});
// T_acqua = 3*23 - (24 + 23 + 9) = 69 - 56 = 13°C (acqua fredda di frigo)
assert(p1Thermo.waterTemp === 13, "Calcolo TFI Spirale 2ª vel a 24°C ambiente", `T_acqua calcolata: ${p1Thermo.waterTemp}°C (Target TFI 23°C)`);

// Test estivo estremo con Spirale 2ª vel (ambiente 27°C, farina 26°C, attrito 10°C): T_acqua = 69 - 63 = 6°C
// Se ambiente 29°C, farina 28°C, attrito 10°C: T_acqua = 69 - 67 = 2°C -> Fabbisogno Ghiaccio Tritato!
const p1ThermoExtreme = engine.calculateThermodynamics({
  targetTemp: 23,
  roomTemp: 29,
  flourTemp: 28,
  friction: 10,
  totalWater: p1Recipe.water,
  tapWaterTemp: 22
});
assert(p1ThermoExtreme.needsIce === true, "Scatto allerta ghiaccio in regime professionale estivo", `T_acqua teorica: ${p1ThermoExtreme.waterTemp}°C < 3°C. Ghiaccio tritato richiesto: ${p1ThermoExtreme.iceGrams}g`);
assert(p1ThermoExtreme.liquidWaterGrams + p1ThermoExtreme.iceGrams === Math.round(p1Recipe.water), "Conservazione stechiometrica della massa d'acqua con ghiaccio", `Ghiaccio: ${p1ThermoExtreme.iceGrams}g + Acqua liquida: ${p1ThermoExtreme.liquidWaterGrams}g = ${p1Recipe.water}g`);

// Verifica Timeline P1
const p1TimelineSteps = p1Reverse.timeline;
const autolyseStep = p1TimelineSteps.find(s => s.id === 'autolyse');
const foldsStep = p1TimelineSteps.find(s => s.id === 'folds');
const fridgeStep = p1TimelineSteps.find(s => s.id === 'in_fridge');
const staglioStep = p1TimelineSteps.find(s => s.id === 'staglio');
const ovenStep = p1TimelineSteps.find(s => s.id === 'oven');
const bakeStep = p1TimelineSteps.find(s => s.id === 'bake');

assert(autolyseStep !== undefined, "Timeline include step Autolisi Preventiva", autolyseStep ? autolyseStep.label : "");
assert(foldsStep !== undefined, "Timeline include step Pieghe di Rinforzo", foldsStep ? foldsStep.label : "");
assert(fridgeStep !== undefined, "Timeline include step Messa in Cella/Frigo", fridgeStep ? fridgeStep.label : "");
assert(staglioStep !== undefined, "Timeline include step Staglio e Formatura", staglioStep ? staglioStep.label : "");
assert(ovenStep !== undefined, "Timeline include step Preriscaldamento Effeuno", ovenStep ? ovenStep.label : "");
assert(bakeStep !== undefined, "Timeline conclude con Infornata e Cottura Pizza", bakeStep ? bakeStep.label : "");

// Verifica ordine cronologico della Timeline
for (let i = 0; i < p1TimelineSteps.length - 1; i++) {
  const tCurr = new Date(p1TimelineSteps[i].time).getTime();
  const tNext = new Date(p1TimelineSteps[i+1].time).getTime();
  assert(tCurr <= tNext, `Coerenza temporale step ${i} -> ${i+1}`, `${p1TimelineSteps[i].label} (${p1TimelineSteps[i].formattedTime}) <= ${p1TimelineSteps[i+1].label} (${p1TimelineSteps[i+1].formattedTime})`);
}

// Verifica dosaggio lievito per 48h a 4°C
assert(p1Recipe.yeastFresh >= 1.0 && p1Recipe.yeastFresh <= 3.5, "Dosaggio lievito fresco millimetrico per 48h mista frigo", `LBF: ${p1Recipe.yeastFresh}g (${p1Recipe.yeastPct.toFixed(3)}% su farina)`);


// --- CASO P2: Biga al 100% per Pizza in Pala/Teglia Romana ---
console.log("\n📌 CASO P2: Biga al 100% per Pizza in Pala/Teglia Romana");
console.log("   Setup: Farina W 320, 16h prefermento a 18°C, chiusura all'80% idratazione con spirale,");
console.log("          forno statico professionale 320°C (forno_teglia_pro).\n");

const p2Biga = engine.calculatePrefermentBiga({
  totalFlour: 1000,
  totalHydration: 80,
  totalSaltPct: 2.5,
  totalFatPct: 2.5, // Olio EVO per pala/teglia romana
  totalSugarPct: 0,
  bigaFlourPct: 100, // Biga totale 100%
  bigaHydration: 45, // Biga classica 45%
  bigaYeastPct: 1.0,  // 1% LBF
  maltPct: 0.5        // 0.5% Malto diastatico nel rinfresco
});

assert(p2Biga.biga.flour === 1000, "Biga al 100%: tutta la farina nel prefermento", `Farina biga: ${p2Biga.biga.flour}g`);
assert(p2Biga.biga.water === 450, "Idratazione biga al 45%", `Acqua biga: ${p2Biga.biga.water}g`);
assert(p2Biga.biga.yeastFresh === 10, "Lievito fresco biga 1% su farina", `LBF biga: ${p2Biga.biga.yeastFresh}g`);
assert(p2Biga.refreshment.flour === 0, "Nessuna farina residua nel rinfresco (Biga 100%)", `Farina rinfresco: ${p2Biga.refreshment.flour}g`);
assert(p2Biga.refreshment.water === 350, "Acqua residua rinfresco corretta (800 - 450 = 350g)", `Acqua rinfresco: ${p2Biga.refreshment.water}g`);
assert(p2Biga.refreshment.salt === 25, "Sale al 2.5% inserito esclusivamente nel rinfresco", `Sale: ${p2Biga.refreshment.salt}g`);
assert(p2Biga.refreshment.fat === 25, "Olio EVO al 2.5% inserito a fine rinfresco", `Olio EVO: ${p2Biga.refreshment.fat}g`);
assert(p2Biga.refreshment.malt === 5, "Malto diastatico al 0.5% nel rinfresco", `Malto: ${p2Biga.refreshment.malt}g`);
assert(p2Biga.totalDough === 1000 + 800 + 25 + 25 + 10 + 5, "Bilancio totale massa impasto biga", `Massa totale: ${p2Biga.totalDough}g`);


// =============================================================================
// PARTE 2: PROFILO PIZZAIOLO CASALINGO
// =============================================================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🏠 PROFILO 2: PIZZAIOLO CASALINGO (Sicurezza, Cottura 250°C, Limiti Termici)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// --- CASO C1: Pizza Napoletana a Casa in 8 ore a 24°C (Modalità Reverse + Stima Prudenziale) ---
console.log("📌 CASO C1: Napoletana Casalinga in 8 ore a 24°C");
console.log("   Setup: Farina Caputo Pizzeria W260, impasto con Planetaria (attrito 6°C),");
console.log("          Forno casalingo standard 250°C, Modalità Reverse con Stima Prudenziale attiva.\n");

const c1Plan = engine.optimizeReversePlan({
  targetStyle: 'napoletana_stg',
  flourKey: 'caputo_pizzeria',
  ovenKey: 'forno_casa_250',
  mixerKey: 'planetaria_bassa',
  availableHours: 8,
  numBalls: 4,
  ballWeight: 260,
  ambientTemp: 24,
  isPrudentialMode: true
});

const c1Recipe = c1Plan.recipe;

// Confrontiamo con lo stesso calcolo SENZA stima prudenziale per verificare la riduzione del 10%
const c1PlanNoPrudential = engine.optimizeReversePlan({
  targetStyle: 'napoletana_stg',
  flourKey: 'caputo_pizzeria',
  ovenKey: 'forno_casa_250',
  mixerKey: 'planetaria_bassa',
  availableHours: 8,
  numBalls: 4,
  ballWeight: 260,
  ambientTemp: 24,
  isPrudentialMode: false
});

assert(c1Plan.parameters.isPrudentialMode === true, "Flag Stima Prudenziale attivo nel piano");
const yeastRatio = c1Recipe.yeastFresh / c1PlanNoPrudential.recipe.yeastFresh;
assert(yeastRatio >= 0.89 && yeastRatio <= 0.91, "Stima prudenziale applica abbattimento del 10% sul lievito", `LBF con prudenziale: ${c1Recipe.yeastFresh}g vs Standard: ${c1PlanNoPrudential.recipe.yeastFresh}g (Ratio: ${(yeastRatio*100).toFixed(1)}%)`);

// Verifica adattamenti termici per Forno Casalingo 250°C
assert(c1Recipe.fatPct === 2.5, "Aggiunta automatica Olio EVO 2.5% per forno 250°C", `Grassi: ${c1Recipe.fatPct}% (${c1Recipe.fat}g) - Previene disidratazione nella cottura di 8-12 min`);
assert(c1Recipe.sugarPct === 1.0, "Aggiunta automatica Zucchero/Malto 1.0% per doratura a 250°C", `Zuccheri: ${c1Recipe.sugarPct}% (${c1Recipe.sugar}g) - Reazione di Maillard garantita`);
assert(c1Recipe.hydration === 65, "Idratazione ottimizzata a 65% per compensare perdita umidità a 250°C", `Idratazione: ${c1Recipe.hydration}%`);

// Verifica TFI e temperatura dell'acqua con Planetaria
// Target TFI = 23°C. Amb = 24°C, Farina = 23.5°C, Attrito Planetaria = 6°C
// T_acqua = 69 - (24 + 23.5 + 6) = 69 - 53.5 = 15.5°C
assert(c1Recipe.thermodynamics.waterTemp === 15.5, "Calcolo T_acqua per planetaria casalinga (15.5°C)", `T_acqua calcolata: ${c1Recipe.thermodynamics.waterTemp}°C (evita surriscaldamento oltre i 24°C)`);
assert(c1Recipe.thermodynamics.needsIce === false, "Nessun ghiaccio richiesto con acqua a 15.5°C", "Basta acqua fresca di rubinetto o leggermente rinfrescata");

// Verifica chiarezza e completezza delle procedure per il casalingo
assert(c1Plan.procedures.length >= 4, "Procedure operative step-by-step complete", `Generati ${c1Plan.procedures.length} passaggi dettagliati`);
const cookingProc = c1Plan.procedures.find(p => p.title.includes("Cottura"));
assert(cookingProc !== undefined && cookingProc.tip.includes("250°C"), "Consigli di cottura specifici per forno casalingo presenti", cookingProc ? cookingProc.tip : "");


// --- CASO C2: "Ho solo 4 ore e una farina debole da supermercato W180" ---
console.log("\n📌 CASO C2: Emergenza Pizza Express (4 ore, Farina Debole W180)");
console.log("   Setup: Farina debole da supermercato W180, 4 ore disponibili,");
console.log("          Forno casalingo 250°C, Planetaria/A mano.\n");

const c2Plan = engine.optimizeReversePlan({
  targetStyle: 'napoletana_stg',
  flourKey: 'generic_debole',
  ovenKey: 'forno_casa_250',
  mixerKey: 'a_mano',
  availableHours: 4,
  numBalls: 3,
  ballWeight: 250,
  ambientTemp: 22,
  isPrudentialMode: true
});

const c2Recipe = c2Plan.recipe;

// Verifiche reologiche C2
assert(c2Plan.flour.w === 180, "Farina debole W180 riconosciuta", `Farina: ${c2Plan.flour.name}`);
assert(c2Recipe.hydration >= 62, "Idratazione autentica dello stile preservata senza snaturare la ricetta", `Idratazione impostata: ${c2Recipe.hydration}%`);
assert(c2Plan.compatibilityScore <= 65, "Punteggio di compatibilità fortemente penalizzato per farina W180 inadeguata allo stile", `Score: ${c2Plan.compatibilityScore}%`);
const hasIncompatibilityWarning = c2Plan.strategyNotes.some(n => n.includes("Incompatibilità"));
assert(hasIncompatibilityWarning, "Presenza allarme critico di incompatibilità reologica farina/idratazione", c2Plan.strategyNotes.join(" | "));
assert(c2Plan.recommendations.autolyseRecommended === true, "Autolisi raccomandata come tecnica compensativa per la farina debole", "Autolisi raccomandata");
assert(c2Plan.parameters.hoursFridge === 0, "Nessun passaggio in frigo con sole 4 ore", `Ore frigo: ${c2Plan.parameters.hoursFridge}h`);
assert(c2Plan.parameters.hoursRoomPuntata === 1, "Puntata breve di 1 ora per non snervare la maglia debole", `Puntata: ${c2Plan.parameters.hoursRoomPuntata}h`);
assert(c2Plan.parameters.hoursRoomAppretto === 3, "Appretto controllato di 3 ore", `Appretto: ${c2Plan.parameters.hoursRoomAppretto}h`);


// --- CASO C3: Calcolo Teglia 40x30 per Forno Casalingo con Idratazione 75% e Planetaria ---
console.log("\n📌 CASO C3: Teglia Romana Casalinga 40x30 con Planetaria ad Alta Velocità");
console.log("   Setup: Teglia 40x30 cm, idratazione 75%, coefficiente 0.58 g/cm²,");
console.log("          Planetaria alta velocità (attrito 10°C), test termico estivo.\n");

// 1. Dimensionamento teglia
const tegliaDim = engine.calculateTeglia({
  shape: 'rectangle',
  length: 40,
  width: 30,
  coefficient: 0.58
});

const expectedArea = 40 * 30; // 1200 cm²
const expectedDough = Math.round(1200 * 0.58); // 696g
assert(tegliaDim.area === expectedArea, "Calcolo superficie teglia 40x30 corretto", `Area: ${tegliaDim.area} cm²`);
assert(tegliaDim.doughWeight === expectedDough, "Calcolo peso impasto teglia con coeff 0.58 g/cm²", `Peso impasto: ${tegliaDim.doughWeight}g`);

// 2. Calcolo ricetta impasto diretto per teglia con lievito commerciale e alta idratazione
const tegliaRecipe = engine.calculateDirectDough({
  totalDoughWeight: tegliaDim.doughWeight,
  hydration: 75,
  saltPct: 2.5,
  fatPct: 2.5, // Olio EVO per croccantezza teglia
  sugarPct: 1.0,
  ambientTemp: 26,
  hoursRoomPuntata: 2,
  hoursFridge: 24,
  hoursRoomAppretto: 4,
  flourW: 320,
  targetTFI: 23,
  friction: engine.MIXERS.planetaria_alta.friction, // 10°C attrito
  flourTemp: 25,
  tapWaterTemp: 20
});

// Verifica conservazione massa Baker's Math
const calculatedTotal = tegliaRecipe.flour + tegliaRecipe.water + tegliaRecipe.salt + tegliaRecipe.fat + tegliaRecipe.sugar + tegliaRecipe.yeastFresh;
assert(Math.abs(calculatedTotal - tegliaDim.doughWeight) < 2.0, "Bilanciamento perfetto peso ingredienti con peso teglia target", `Totale calcolato: ${calculatedTotal.toFixed(1)}g vs Target: ${tegliaDim.doughWeight}g`);
assert(Math.round((tegliaRecipe.water / tegliaRecipe.flour) * 100) === 75, "Rapporto idratazione 75% confermato", `Acqua: ${tegliaRecipe.water}g, Farina: ${tegliaRecipe.flour}g`);

// 3. Verifica Termodinamica Critica Planetaria ad Alta Velocità
// T_acqua = 3*23 - (26 + 25 + 10) = 69 - 61 = 8°C -> Richiede acqua ghiacciata di frigo!
assert(tegliaRecipe.thermodynamics.waterTemp === 8, "Calcolo T_acqua planetaria alta velocità (8°C)", `T_acqua: ${tegliaRecipe.thermodynamics.waterTemp}°C (acqua di frigo indispensabile)`);

// Scenario canicola estiva per teglia casalinga: T_amb = 29°C, T_farina = 28°C, Attrito = 10°C
// T_acqua = 69 - (29 + 28 + 10) = 69 - 67 = 2°C -> SCATTA GHIACCIO TRITATO!
const tegliaSummerThermo = engine.calculateThermodynamics({
  targetTemp: 23,
  roomTemp: 29,
  flourTemp: 28,
  friction: 10,
  totalWater: tegliaRecipe.water,
  tapWaterTemp: 22
});

assert(tegliaSummerThermo.needsIce === true, "Avviso ghiaccio tritato scattato per planetaria con caldo estivo", `T_acqua teorica: ${tegliaSummerThermo.waterTemp}°C (< 3°C). Ghiaccio necessario: ${tegliaSummerThermo.iceGrams}g`);
assert(tegliaSummerThermo.iceGrams > 50, "Quantitativo ghiaccio realistico", `Ghiaccio tritato: ${tegliaSummerThermo.iceGrams}g su ${Math.round(tegliaRecipe.water)}g totali`);


// =============================================================================
// PARTE 3: VERIFICA MODULI AGGIUNTIVI (Blend Farine, Lievito Madre, Licoli)
// =============================================================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔬 PARTE 3: VALIDAZIONE MODULI SPECIALI (Blend Farine, Pasta Madre & Licoli)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// 1. Blend Farine triplo
const tripleBlend = engine.calculateFlourBlend([
  { name: 'Caputo Manitoba Oro', w: 380, protein: 14.5, pl: 0.65, pct: 30 },
  { name: 'Caputo Pizzeria', w: 260, protein: 12.5, pl: 0.55, pct: 50 },
  { name: 'Farina Debole Tipo 00', w: 180, protein: 10.0, pl: 0.50, pct: 20 }
]);

// W atteso = 380*0.30 + 260*0.50 + 180*0.20 = 114 + 130 + 36 = 280
// Protein attesa = 14.5*0.30 + 12.5*0.50 + 10.0*0.20 = 4.35 + 6.25 + 2.0 = 12.6%
// PL atteso = 0.65*0.30 + 0.55*0.50 + 0.50*0.20 = 0.195 + 0.275 + 0.10 = 0.57
assert(tripleBlend.w === 280, "Blend Farine: calcolo W ponderato a 3 componenti", `W calcolato: ${tripleBlend.w} (atteso: 280)`);
assert(tripleBlend.protein === 12.6, "Blend Farine: calcolo proteine ponderate", `Proteine: ${tripleBlend.protein}% (atteso: 12.6%)`);
assert(tripleBlend.pl === 0.57, "Blend Farine: calcolo P/L ponderato", `P/L: ${tripleBlend.pl} (atteso: 0.57)`);

// 2. Lievito Madre Solido (Pasta Madre al 50% idratazione)
// Sottrazione stechiometrica: 15% pasta madre su farina totale
const madreTest = engine.calculateDirectDough({
  totalDoughWeight: 1500,
  hydration: 65,
  saltPct: 2.5,
  fatPct: 0,
  ambientTemp: 22,
  hoursRoomPuntata: 3,
  hoursFridge: 24,
  hoursRoomAppretto: 5,
  yeastType: 'madre',
  sourdoughPct: 20 // 20% di pasta madre solida
});

// Verifica che i solidi e liquidi della pasta madre siano stati dedotti:
// Pasta madre solida = 2/3 farina, 1/3 acqua
const pmFlour = madreTest.pastaMadreGrams * (2 / 3);
const pmWater = madreTest.pastaMadreGrams * (1 / 3);
const totalFlourSum = madreTest.flour + pmFlour;
const totalWaterSum = madreTest.water + pmWater;

assert(Math.abs(totalFlourSum - madreTest.totalFlourEquivalent) < 0.2, "Sottrazione stechiometrica farina per pasta madre solida", `Farina netta: ${madreTest.flour}g + Farina da PM: ${pmFlour.toFixed(1)}g = ${totalFlourSum.toFixed(1)}g`);
assert(Math.abs(totalWaterSum - madreTest.totalWaterEquivalent) < 0.2, "Sottrazione stechiometrica acqua per pasta madre solida", `Acqua netta: ${madreTest.water}g + Acqua da PM: ${pmWater.toFixed(1)}g = ${totalWaterSum.toFixed(1)}g`);
assert(Math.abs(totalWaterSum / totalFlourSum - 0.65) < 0.001, "Idratazione effettiva globale 65% preservata al 100% con pasta madre", `Idratazione globale: ${(totalWaterSum / totalFlourSum * 100).toFixed(2)}%`);

// 3. Licoli (Lievito Madre Liquido al 100% idratazione = 50% farina, 50% acqua)
const licoliTest = engine.calculateDirectDough({
  totalDoughWeight: 1500,
  hydration: 70,
  saltPct: 2.5,
  fatPct: 0,
  ambientTemp: 22,
  hoursRoomPuntata: 3,
  hoursFridge: 24,
  hoursRoomAppretto: 5,
  yeastType: 'licoli',
  sourdoughPct: 15 // 15% licoli
});

const licoliFlour = licoliTest.licoliGrams / 2;
const licoliWater = licoliTest.licoliGrams / 2;
const licoliTotalFlour = licoliTest.flour + licoliFlour;
const licoliTotalWater = licoliTest.water + licoliWater;

assert(Math.abs(licoliTotalFlour - licoliTest.totalFlourEquivalent) < 0.2, "Sottrazione stechiometrica farina per Li.Co.Li", `Farina netta: ${licoliTest.flour}g + Farina da Licoli: ${licoliFlour.toFixed(1)}g = ${licoliTotalFlour.toFixed(1)}g`);
assert(Math.abs(licoliTotalWater - licoliTest.totalWaterEquivalent) < 0.2, "Sottrazione stechiometrica acqua per Li.Co.Li", `Acqua netta: ${licoliTest.water}g + Acqua da Licoli: ${licoliWater.toFixed(1)}g = ${licoliTotalWater.toFixed(1)}g`);
assert(Math.abs(licoliTotalWater / licoliTotalFlour - 0.70) < 0.001, "Idratazione effettiva globale 70% preservata al 100% con Licoli", `Idratazione globale: ${(licoliTotalWater / licoliTotalFlour * 100).toFixed(2)}%`);

// 4. Metodo Indiretto Poolish
const poolishTest = engine.calculatePrefermentPoolish({
  totalFlour: 1000,
  totalHydration: 68,
  totalSaltPct: 2.5,
  poolishFlourPct: 30, // 30% poolish
  poolishHours: 8      // 8h fermentazione a 20°C (0.5% LBF)
});

assert(poolishTest.poolish.flour === 300, "Poolish: 30% della farina totale", `Farina poolish: ${poolishTest.poolish.flour}g`);
assert(poolishTest.poolish.water === 300, "Poolish: idratazione rigorosamente al 100%", `Acqua poolish: ${poolishTest.poolish.water}g`);
assert(poolishTest.poolish.yeastFresh === 1.5, "Poolish: lievito tarato per 8h (0.5% su farina poolish = 1.5g)", `LBF poolish: ${poolishTest.poolish.yeastFresh}g`);
assert(poolishTest.refreshment.flour === 700, "Rinfresco Poolish: restante 70% farina", `Farina rinfresco: ${poolishTest.refreshment.flour}g`);
assert(poolishTest.refreshment.water === 380, "Rinfresco Poolish: restante acqua (680 - 300 = 380g)", `Acqua rinfresco: ${poolishTest.refreshment.water}g`);

console.log("\n===============================================================================");
console.log(`🎯 AUDIT COMPLETATO CON SUCCESSO! Totale test superati: ${passCount} / ${passCount + failCount}`);
console.log("===============================================================================\n");
