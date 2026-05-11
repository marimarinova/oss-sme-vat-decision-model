/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OSS-SME VAT Decision Model - Validation Test Suite
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This test suite validates the mathematical model with:
 * - 10 simulated test cases (edge cases, boundary conditions)
 * - 5 real-world scenarios from e-commerce sector
 * 
 * Run: node tests/validation.test.js
 */

'use strict';

const {
  calculateVAT,
  checkSMEEligibility,
  calculateRegimeCosts,
  calculateBreakeven,
  forecastGrowth,
  EU_MEMBER_STATES,
  UNION_THRESHOLD
} = require('../src/model.js');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  console.log(`\n┌─ TEST: ${name}`);
  console.log('├' + '─'.repeat(70));
  try {
    const result = fn();
    if (result.success) {
      console.log(`└─ ✅ PASSED: ${result.message}`);
      passed++;
    } else {
      console.log(`└─ ❌ FAILED: ${result.message}`);
      failed++;
    }
  } catch (e) {
    console.log(`└─ ❌ ERROR: ${e.message}`);
    failed++;
  }
}

function assertApprox(actual, expected, tolerance = 0.01) {
  return Math.abs(actual - expected) <= tolerance;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 1: SIMULATED TEST CASES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(75));
console.log('  SIMULATED TEST CASES');
console.log('═'.repeat(75));

test('1. Micro Digital Seller (PDF patterns, low expenses)', () => {
  const turnover = { DE: 15000, FR: 8000, IT: 5000 };
  const inputVAT = 500;
  const result = calculateRegimeCosts(turnover, 'BG', inputVAT);
  
  console.log(`│ Turnover: €${result.totalTurnover}, Input VAT: €${inputVAT}`);
  console.log(`│ C_SME: €${result.costSME.toFixed(2)}, C_OSS: €${result.costOSS.toFixed(2)}`);
  console.log(`│ Optimal: ${result.optimalRegime}`);
  
  // Expected: SME optimal for low-expense digital seller
  return {
    success: result.optimalRegime === 'SME' && result.smeEligible,
    message: `SME optimal for low-expense digital seller (saves €${result.savings.toFixed(0)}/year)`
  };
});

test('2. Physical Goods Seller (handmade jewelry, high expenses)', () => {
  const turnover = { DE: 25000, FR: 15000, NL: 10000 };
  const inputVAT = 12000;
  const result = calculateRegimeCosts(turnover, 'BG', inputVAT);
  const breakeven = calculateBreakeven(result.vatSME, result.vatOSS);
  
  console.log(`│ Turnover: €${result.totalTurnover}, Input VAT: €${inputVAT}`);
  console.log(`│ Break-even I*: €${breakeven.breakeven.toFixed(2)}`);
  console.log(`│ I=${inputVAT} ${inputVAT > breakeven.breakeven ? '>' : '<'} I*`);
  
  // Expected: OSS optimal when input VAT > break-even
  const expectedOptimal = inputVAT > breakeven.breakeven ? 'OSS' : 'SME';
  return {
    success: result.optimalRegime === expectedOptimal,
    message: `High input VAT (€${inputVAT}) exceeds break-even → OSS optimal`
  };
});

test('3. Growing Business Exceeds €100K Union Threshold', () => {
  const turnover = { DE: 40000, FR: 35000, IT: 30000 };
  const result = calculateRegimeCosts(turnover, 'BG', 5000);
  
  console.log(`│ Total: €${result.totalTurnover} (> €100K threshold)`);
  console.log(`│ SME Eligible: ${result.smeEligible ? 'Yes' : 'No'}`);
  
  // Expected: SME NOT eligible
  return {
    success: !result.smeEligible && result.optimalRegime === 'OSS',
    message: `T > €100K → SME ineligible → OSS is only option`
  };
});

test('4. Exceeds National Threshold (DE €25K)', () => {
  const turnover = { DE: 30000, IT: 10000 };
  const result = calculateRegimeCosts(turnover, 'BG', 2000);
  
  const deDetail = result.details.find(d => d.code === 'DE');
  const itDetail = result.details.find(d => d.code === 'IT');
  
  console.log(`│ DE: €30K (threshold €25K) → ${deDetail.smeEligible ? 'exempt' : 'VAT collected'}`);
  console.log(`│ IT: €10K (threshold €85K) → ${itDetail.smeEligible ? 'exempt' : 'VAT collected'}`);
  
  // Expected: DE not eligible, IT eligible
  return {
    success: !deDetail.smeEligible && itDetail.smeEligible,
    message: `DE exceeds national threshold → partial SME eligibility`
  };
});

test('5. Break-even Mathematical Validation', () => {
  const turnover = { DE: 20000, IT: 15000, NL: 10000 };
  const result = calculateRegimeCosts(turnover, 'BG', 0);
  const breakeven = calculateBreakeven(result.vatSME, result.vatOSS);
  
  // Test at break-even point
  const atBreakeven = calculateRegimeCosts(turnover, 'BG', breakeven.breakeven);
  const difference = Math.abs(atBreakeven.costSME - atBreakeven.costOSS);
  
  console.log(`│ I* = €${breakeven.breakeven.toFixed(2)}`);
  console.log(`│ At I*: C_SME = €${atBreakeven.costSME.toFixed(2)}, C_OSS = €${atBreakeven.costOSS.toFixed(2)}`);
  console.log(`│ Difference: €${difference.toFixed(2)}`);
  
  // Below and above break-even
  const below = calculateRegimeCosts(turnover, 'BG', breakeven.breakeven - 1000);
  const above = calculateRegimeCosts(turnover, 'BG', breakeven.breakeven + 1000);
  
  return {
    success: difference < 1 && below.optimalRegime === 'SME' && above.optimalRegime === 'OSS',
    message: `Break-even verified: SME < I* < OSS, diff at I* = €${difference.toFixed(2)}`
  };
});

test('6. Sales Only in Non-Implemented MS (FR, ES, GR)', () => {
  const turnover = { FR: 15000, ES: 10000, GR: 8000 };
  const result = calculateRegimeCosts(turnover, 'BG', 1000);
  
  const vatDiff = Math.abs(result.vatSME - result.vatOSS);
  
  console.log(`│ All MS: non-implemented (FR, ES, GR)`);
  console.log(`│ V_SME = €${result.vatSME.toFixed(2)}, V_OSS = €${result.vatOSS.toFixed(2)}`);
  
  // Expected: V_SME = V_OSS (no exemptions available)
  return {
    success: vatDiff < 0.01,
    message: `No SME exemptions available → V_SME = V_OSS`
  };
});

test('7. Edge Case: Exactly at €100K Union Threshold', () => {
  const turnover = { DE: 50000, IT: 50000 };
  const result = calculateRegimeCosts(turnover, 'BG', 3000);
  
  console.log(`│ T = €${result.totalTurnover} (exactly €100K)`);
  console.log(`│ SME Eligible: ${result.smeEligible ? 'Yes (≤)' : 'No (>)'}`);
  
  // Expected: Still eligible (≤ not <)
  return {
    success: result.smeEligible === true,
    message: `T = €100K: boundary condition (≤) → SME eligible`
  };
});

test('8. Zero Input VAT (pure digital, no expenses)', () => {
  const turnover = { DE: 20000, IT: 15000 };
  const result = calculateRegimeCosts(turnover, 'BG', 0);
  
  console.log(`│ Input VAT: €0`);
  console.log(`│ C_SME: €${result.costSME.toFixed(2)}, C_OSS: €${result.costOSS.toFixed(2)}`);
  
  // Expected: SME always optimal when I=0
  return {
    success: result.optimalRegime === 'SME',
    message: `I = 0 → SME optimal (no OSS deduction benefit)`
  };
});

test('9. VAT Calculation Accuracy (DE 19%)', () => {
  const gross = 11900;
  const rate = 0.19;
  const vat = calculateVAT(gross, rate);
  const expectedVAT = 1900;
  
  console.log(`│ Gross: €${gross}, Rate: ${rate * 100}%`);
  console.log(`│ VAT: €${vat.toFixed(2)} (expected: €${expectedVAT})`);
  
  return {
    success: assertApprox(vat, expectedVAT),
    message: `VAT(€${gross}, ${rate * 100}%) = €${vat.toFixed(2)} ✓`
  };
});

test('10. Hungary Highest VAT Rate (27%)', () => {
  const gross = 12700;
  const rate = 0.27;
  const vat = calculateVAT(gross, rate);
  const expectedVAT = 2700;
  
  console.log(`│ HU Gross: €${gross}, Rate: ${rate * 100}%`);
  console.log(`│ VAT: €${vat.toFixed(2)} (expected: €${expectedVAT})`);
  
  return {
    success: assertApprox(vat, expectedVAT, 1),
    message: `HU 27% VAT calculated correctly`
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST GROUP 2: REAL-WORLD SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(75));
console.log('  REAL-WORLD SCENARIOS (E-COMMERCE)');
console.log('═'.repeat(75));

test('Scenario A: Etsy Digital Pattern Seller', () => {
  const turnover = {
    DE: 8500, FR: 4200, IT: 3100, NL: 2800, 
    ES: 2400, BE: 1500, AT: 1200, PL: 900, SE: 700
  };
  const inputVAT = 350;
  const result = calculateRegimeCosts(turnover, 'BG', inputVAT);
  
  console.log(`│ Profile: Digital patterns, low expenses`);
  console.log(`│ Total: €${result.totalTurnover}, Input VAT: €${inputVAT}`);
  console.log(`│ Optimal: ${result.optimalRegime}, Savings: €${result.savings.toFixed(0)}/year`);
  
  return {
    success: result.optimalRegime === 'SME',
    message: `Digital seller → SME optimal (saves €${result.savings.toFixed(0)}/year)`
  };
});

test('Scenario B: Handmade Jewelry Seller', () => {
  const turnover = { DE: 18000, FR: 12000, IT: 8000, NL: 5000, BE: 4000, AT: 3000 };
  const inputVAT = 9500;
  const result = calculateRegimeCosts(turnover, 'BG', inputVAT);
  const breakeven = calculateBreakeven(result.vatSME, result.vatOSS);
  
  console.log(`│ Profile: Silver/gemstones, high material costs`);
  console.log(`│ Total: €${result.totalTurnover}, Input VAT: €${inputVAT}`);
  console.log(`│ Break-even: €${breakeven.breakeven.toFixed(0)}, I > I* → OSS`);
  
  return {
    success: result.optimalRegime === 'OSS' && inputVAT > breakeven.breakeven,
    message: `High expenses → OSS optimal (saves €${result.savings.toFixed(0)}/year)`
  };
});

test('Scenario C: Online Course Creator (near €100K)', () => {
  const turnover = { DE: 28000, FR: 22000, IT: 18000, ES: 12000, NL: 8000, BE: 6000, PL: 4000 };
  const inputVAT = 2500;
  const result = calculateRegimeCosts(turnover, 'BG', inputVAT);
  const forecast = forecastGrowth(result.totalTurnover, 20, 5);
  
  console.log(`│ Profile: Online courses, approaching threshold`);
  console.log(`│ Total: €${result.totalTurnover} (€${UNION_THRESHOLD - result.totalTurnover} to threshold)`);
  console.log(`│ At 20% growth: exceeds €100K in ${forecast.unionThresholdYear?.toFixed(2) || 'N/A'} years`);
  
  return {
    success: result.smeEligible && forecast.willExceedThreshold,
    message: `Near threshold → SME now, but prepare for OSS transition`
  };
});

test('Scenario D: Multi-country Exceeds National Thresholds', () => {
  const turnover = { DE: 30000, NL: 25000, SE: 15000, IT: 10000 };
  const result = calculateRegimeCosts(turnover, 'BG', 3000);
  
  const de = result.details.find(d => d.code === 'DE');
  const nl = result.details.find(d => d.code === 'NL');
  const se = result.details.find(d => d.code === 'SE');
  const it = result.details.find(d => d.code === 'IT');
  
  console.log(`│ DE: €30K > €25K threshold → ${de.smeEligible ? '✓' : '✗'}`);
  console.log(`│ NL: €25K > €20K threshold → ${nl.smeEligible ? '✓' : '✗'}`);
  console.log(`│ SE: €15K > €11.5K threshold → ${se.smeEligible ? '✓' : '✗'}`);
  console.log(`│ IT: €10K < €85K threshold → ${it.smeEligible ? '✓' : '✗'}`);
  
  return {
    success: !de.smeEligible && !nl.smeEligible && !se.smeEligible && it.smeEligible,
    message: `Multiple national thresholds exceeded → partial SME, OSS optimal`
  };
});

test('Scenario E: Sensitivity Analysis at Break-even', () => {
  const turnover = { DE: 15000, IT: 12000, FR: 8000 };
  const result0 = calculateRegimeCosts(turnover, 'BG', 0);
  const breakeven = calculateBreakeven(result0.vatSME, result0.vatOSS);
  
  const below = calculateRegimeCosts(turnover, 'BG', breakeven.breakeven - 500);
  const at = calculateRegimeCosts(turnover, 'BG', breakeven.breakeven);
  const above = calculateRegimeCosts(turnover, 'BG', breakeven.breakeven + 500);
  
  console.log(`│ I* = €${breakeven.breakeven.toFixed(0)}`);
  console.log(`│ At I*-500: ${below.optimalRegime}, At I*: diff=${Math.abs(at.costSME - at.costOSS).toFixed(0)}, At I*+500: ${above.optimalRegime}`);
  
  return {
    success: below.optimalRegime === 'SME' && above.optimalRegime === 'OSS',
    message: `€500 change around I* flips optimal regime`
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(75));
console.log(`  TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(75));

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED - Model is mathematically validated!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️ ${failed} test(s) need attention\n`);
  process.exit(1);
}
