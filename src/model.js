/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OSS-SME VAT Decision Model
 * Mathematical Optimization for EU Micro-Enterprise VAT Regime Selection
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @author Marieta Marinova
 * @institution Sofia University "St. Kliment Ohridski"
 * @version 1.3.0
 * @license MIT
 * 
 * Legal Framework:
 * - Council Directive 2006/112/EC (VAT Directive)
 * - Council Directive (EU) 2020/285 (SME Scheme reform, effective Jan 2025)
 * - Art. 59c - €10,000 threshold for OSS obligation
 * - Art. 282-292 - SME Scheme provisions
 * - Art. 289 - No input VAT deduction under SME Scheme
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Union threshold for SME Scheme eligibility (Directive 2020/285)
 * Total EU turnover must not exceed this amount
 */
const UNION_THRESHOLD = 100000; // €100,000

/**
 * OSS obligation threshold (Art. 59c)
 * Cross-border sales exceeding this require destination VAT
 */
const OSS_THRESHOLD = 10000; // €10,000

/**
 * Estimated annual compliance costs by regime
 * Based on industry analysis and EC impact assessments
 */
const COMPLIANCE_COSTS = {
  SME: 200,   // Quarterly reports, simpler requirements
  OSS: 500    // Quarterly OSS returns, more complex reporting
};

// ═══════════════════════════════════════════════════════════════════════════════
// EU 27 MEMBER STATES DATA (January 2025)
// Sources: EC TEDB, sme-vat-rules.ec.europa.eu
// ═══════════════════════════════════════════════════════════════════════════════

const EU_MEMBER_STATES = {
  AT: { name: 'Austria', rate: 0.20, threshold: 42000, implemented: true },
  BE: { name: 'Belgium', rate: 0.21, threshold: 25000, implemented: true },
  BG: { name: 'Bulgaria', rate: 0.20, threshold: 50000, implemented: false },
  HR: { name: 'Croatia', rate: 0.25, threshold: 50000, implemented: true },
  CY: { name: 'Cyprus', rate: 0.19, threshold: 15600, implemented: true },
  CZ: { name: 'Czechia', rate: 0.21, threshold: 80000, implemented: true },
  DK: { name: 'Denmark', rate: 0.25, threshold: 6700, implemented: false },
  EE: { name: 'Estonia', rate: 0.24, threshold: 40000, implemented: true },
  FI: { name: 'Finland', rate: 0.255, threshold: 20000, implemented: true },
  FR: { name: 'France', rate: 0.20, threshold: 85000, implemented: true },
  DE: { name: 'Germany', rate: 0.19, threshold: 25000, implemented: true },
  GR: { name: 'Greece', rate: 0.24, threshold: 10000, implemented: false },
  HU: { name: 'Hungary', rate: 0.27, threshold: 45000, implemented: true },
  IE: { name: 'Ireland', rate: 0.23, threshold: 85000, implemented: true },
  IT: { name: 'Italy', rate: 0.22, threshold: 85000, implemented: true },
  LV: { name: 'Latvia', rate: 0.21, threshold: 50000, implemented: true },
  LT: { name: 'Lithuania', rate: 0.21, threshold: 55000, implemented: true },
  LU: { name: 'Luxembourg', rate: 0.17, threshold: 50000, implemented: true },
  MT: { name: 'Malta', rate: 0.18, threshold: 35000, implemented: true },
  NL: { name: 'Netherlands', rate: 0.21, threshold: 20000, implemented: true },
  PL: { name: 'Poland', rate: 0.23, threshold: 46500, implemented: true },
  PT: { name: 'Portugal', rate: 0.23, threshold: 15000, implemented: false },
  RO: { name: 'Romania', rate: 0.19, threshold: 17000, implemented: true },
  SK: { name: 'Slovakia', rate: 0.23, threshold: 62500, implemented: true },
  SI: { name: 'Slovenia', rate: 0.22, threshold: 60000, implemented: true },
  ES: { name: 'Spain', rate: 0.21, threshold: 0, implemented: false },
  SE: { name: 'Sweden', rate: 0.25, threshold: 11500, implemented: true }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE MATHEMATICAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate VAT amount from gross price
 * 
 * Formula: VAT = Gross × τ / (1 + τ)
 * 
 * @param {number} gross - Gross price including VAT
 * @param {number} rate - VAT rate as decimal (e.g., 0.20 for 20%)
 * @returns {number} VAT amount
 */
function calculateVAT(gross, rate) {
  if (gross <= 0 || rate <= 0) return 0;
  return gross * rate / (1 + rate);
}

/**
 * SME Eligibility Function E_SME(turnover, msData, totalTurnover)
 * 
 * Determines if SME exemption is available in a given Member State
 * 
 * Conditions for eligibility (all must be true):
 * 1. Total EU turnover ≤ Union threshold (€100,000)
 * 2. Turnover in MS ≤ National threshold
 * 3. MS has implemented cross-border SME scheme
 * 
 * @param {number} turnover - Turnover in specific MS
 * @param {object} msData - Member State data (threshold, implemented)
 * @param {number} totalTurnover - Total EU turnover
 * @returns {number} 1 if eligible, 0 if not
 */
function checkSMEEligibility(turnover, msData, totalTurnover) {
  if (totalTurnover > UNION_THRESHOLD) return 0;
  if (!msData.implemented) return 0;
  if (turnover > msData.threshold) return 0;
  return 1;
}

/**
 * Calculate total costs under SME and OSS regimes
 * 
 * Economic cost functions (common measurement base: the seller's economic burden):
 *   C_SME = (1 - p)·V_SME + κ_SME + I   (input VAT paid and not recoverable, Art. 289)
 *   C_OSS = (1 - p)·V_OSS + κ_OSS       (input VAT paid, +I, and recovered, -I: net zero)
 *
 * v1.3.0 correction: v1.2.x used C_OSS = V_OSS - I + κ_OSS, which mixed a net-remittance
 * measure (OSS) with an economic-burden measure (SME) and counted the input-VAT
 * advantage of OSS twice (2I instead of I). The VAT cash-flow position is now
 * reported separately (netVATPayableOSS, refundPositionOSS) and does not enter
 * the regime-choice objective.
 * 
 * @param {object} turnoverByMS - Object with MS codes as keys and turnover as values
 * @param {string} msEstablishment - MS code where business is established
 * @param {number} inputVAT - Annual input VAT from business expenses
 * @param {number} [passThrough=0] - Share p ∈ [0,1] of output VAT passed on to customers
 * @returns {object} Calculation results including costs, VAT amounts, and recommendation
 */
function calculateRegimeCosts(turnoverByMS, msEstablishment, inputVAT, passThrough = 0) {
  if (passThrough < 0 || passThrough > 1) {
    throw new RangeError('passThrough must lie in [0, 1]');
  }
  // Calculate total and cross-border turnover
  const totalTurnover = Object.values(turnoverByMS).reduce((sum, t) => sum + (t || 0), 0);
  const domesticTurnover = turnoverByMS[msEstablishment] || 0;
  const crossBorderTurnover = totalTurnover - domesticTurnover;
  
  let vatSME = 0;  // VAT collected under SME regime
  let vatOSS = 0;  // VAT collected under OSS regime
  const details = [];
  
  // Calculate VAT for each Member State
  Object.entries(turnoverByMS).forEach(([code, turnover]) => {
    if (!turnover || turnover <= 0) return;
    
    const msData = EU_MEMBER_STATES[code];
    if (!msData) {
      console.warn(`Unknown Member State code: ${code}`);
      return;
    }
    
    const vat = calculateVAT(turnover, msData.rate);
    
    // OSS: always collect destination VAT
    vatOSS += vat;
    
    // SME: exempt if eligible in that MS
    const eligible = checkSMEEligibility(turnover, msData, totalTurnover);
    if (!eligible) {
      vatSME += vat;
    }
    
    details.push({
      code,
      name: msData.name,
      turnover,
      vat: vat,
      smeEligible: eligible === 1,
      reason: eligible === 0 
        ? (!msData.implemented ? 'not implemented' : 
           turnover > msData.threshold ? 'exceeds national threshold' : 
           'exceeds Union threshold')
        : 'eligible for exemption'
    });
  });
  
  // Economic cost functions on a common base
  const burden = 1 - passThrough;
  // C_SME = (1-p)·V_SME + κ_SME + I  (input VAT is a sunk, non-recoverable cost)
  const costSME = burden * vatSME + COMPLIANCE_COSTS.SME + inputVAT;
  // C_OSS = (1-p)·V_OSS + κ_OSS  (input VAT paid and fully recovered: net zero)
  const costOSS = burden * vatOSS + COMPLIANCE_COSTS.OSS;

  // VAT cash-flow position under OSS (reporting only, NOT part of the objective)
  const netVATPayableOSS = vatOSS - inputVAT;
  const refundPositionOSS = Math.max(0, inputVAT - vatOSS);
  
  // Determine eligibility
  const smeEligible = totalTurnover <= UNION_THRESHOLD;
  const ossRequired = crossBorderTurnover > OSS_THRESHOLD;
  
  // Determine optimal regime
  const optimalRegime = (smeEligible && costSME < costOSS) ? 'SME' : 'OSS';
  const savings = Math.abs(costSME - costOSS);
  
  return {
    // Turnover breakdown
    totalTurnover,
    domesticTurnover,
    crossBorderTurnover,
    
    // VAT amounts
    vatSME,
    vatOSS,
    
    // Total costs
    costSME,
    costOSS,
    passThrough,

    // VAT cash-flow position under OSS (not an economic cost)
    netVATPayableOSS,
    refundPositionOSS,
    
    // Eligibility flags
    smeEligible,
    ossRequired,
    
    // Recommendation
    optimalRegime,
    savings,
    
    // Details by MS
    details
  };
}

/**
 * Calculate break-even input VAT
 * 
 * Break-even Theorem:
 * Find I* where C_SME(I*) = C_OSS(I*)
 * 
 * Derivation:
 *   (1-p)V_SME + κ_SME + I = (1-p)V_OSS + κ_OSS
 *   I* = (1-p)(V_OSS - V_SME) + (κ_OSS - κ_SME)
 * Decision rule: SME optimal iff I < I*, OSS optimal iff I > I*.
 * (v1.2.x divided by 2 as a consequence of the double-counting error.)
 * 
 * @param {number} vatSME - VAT collected under SME regime
 * @param {number} vatOSS - VAT collected under OSS regime
 * @param {number} [passThrough=0] - Share p ∈ [0,1] of output VAT passed on
 * @returns {object} Break-even analysis results
 */
function calculateBreakeven(vatSME, vatOSS, passThrough = 0) {
  const kappaDiff = COMPLIANCE_COSTS.OSS - COMPLIANCE_COSTS.SME;
  
  // I* = (1-p)(V_OSS - V_SME) + (κ_OSS - κ_SME)
  const breakeven = (1 - passThrough) * (vatOSS - vatSME) + kappaDiff;
  
  return {
    // Closed-form threshold, unclipped (may be negative for some parameter sets)
    breakeven,
    // Business-facing clipped value for display only
    breakevenDisplay: Math.max(0, breakeven),
    
    // Interpretation
    interpretation: breakeven <= 0
      ? 'OSS is optimal for every non-negative input VAT (non-positive break-even)'
      : `At I = €${Math.round(breakeven)}, both regimes equal`,
    
    // Decision rule
    decisionRule: {
      smeOptimalWhen: `Input VAT < €${Math.round(Math.max(0, breakeven))}`,
      ossOptimalWhen: `Input VAT ≥ €${Math.round(Math.max(0, breakeven))}`
    }
  };
}

/**
 * Pass-through switch point p* for a given input VAT
 * Solves C_SME(p) = C_OSS(p):  p* = 1 - (I - Δκ) / (V_OSS - V_SME)
 * Returns null when ΔV = 0 (p has no effect on the choice).
 */
function calculateSwitchPoint(vatSME, vatOSS, inputVAT) {
  const deltaV = vatOSS - vatSME;
  if (deltaV === 0) return null;
  const kappaDiff = COMPLIANCE_COSTS.OSS - COMPLIANCE_COSTS.SME;
  return 1 - (inputVAT - kappaDiff) / deltaV;
}

/**
 * Forecast growth and threshold crossing
 * 
 * Growth Model: T(t) = T₀ × (1 + g)^t
 * 
 * Threshold Crossing: t* = log(θ / T₀) / log(1 + g)
 * 
 * @param {number} currentTurnover - Current annual turnover (T₀)
 * @param {number} growthRate - Annual growth rate as percentage (e.g., 15 for 15%)
 * @param {number} years - Forecast horizon in years
 * @returns {object} Forecast results including threshold crossing predictions
 */
function forecastGrowth(currentTurnover, growthRate, years = 5) {
  const g = growthRate / 100;
  const forecast = [];
  
  // Calculate threshold crossing time
  let unionThresholdYear = null;
  if (currentTurnover < UNION_THRESHOLD && g > 0) {
    unionThresholdYear = Math.log(UNION_THRESHOLD / currentTurnover) / Math.log(1 + g);
  }
  
  // Generate yearly forecast
  for (let t = 0; t <= years; t++) {
    const projectedTurnover = currentTurnover * Math.pow(1 + g, t);
    forecast.push({
      year: t,
      turnover: projectedTurnover,
      smeEligible: projectedTurnover <= UNION_THRESHOLD,
      growthFactor: Math.pow(1 + g, t)
    });
  }
  
  return {
    currentTurnover,
    growthRate: g,
    forecast,
    unionThresholdYear,
    willExceedThreshold: unionThresholdYear !== null && unionThresholdYear <= years
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Constants
  UNION_THRESHOLD,
  OSS_THRESHOLD,
  COMPLIANCE_COSTS,
  EU_MEMBER_STATES,
  
  // Core functions
  calculateVAT,
  checkSMEEligibility,
  calculateRegimeCosts,
  calculateBreakeven,
  calculateSwitchPoint,
  forecastGrowth
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE USAGE (when run directly)
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  OSS-SME VAT Decision Model - Example');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  // Example: Bulgarian digital product seller
  const turnover = {
    DE: 15000,
    FR: 8000,
    IT: 5000
  };
  const inputVAT = 2000;
  const msEstablishment = 'BG';
  
  console.log('Input:');
  console.log(`  Turnover: DE €15K, FR €8K, IT €5K`);
  console.log(`  Input VAT: €${inputVAT}`);
  console.log(`  Establishment: ${msEstablishment}\n`);
  
  const result = calculateRegimeCosts(turnover, msEstablishment, inputVAT);
  const breakeven = calculateBreakeven(result.vatSME, result.vatOSS);
  const forecast = forecastGrowth(result.totalTurnover, 20, 5);
  
  console.log('Results:');
  console.log(`  Total turnover: €${result.totalTurnover.toLocaleString()}`);
  console.log(`  SME eligible: ${result.smeEligible ? 'Yes' : 'No'}`);
  console.log(`  V_SME: €${result.vatSME.toFixed(2)}`);
  console.log(`  V_OSS: €${result.vatOSS.toFixed(2)}`);
  console.log(`  C_SME: €${result.costSME.toFixed(2)}`);
  console.log(`  C_OSS: €${result.costOSS.toFixed(2)}`);
  console.log(`  Break-even I*: €${breakeven.breakeven.toFixed(2)}`);
  console.log(`\n  ═══ OPTIMAL REGIME: ${result.optimalRegime} ═══`);
  console.log(`  Annual savings: €${result.savings.toFixed(2)}`);
  
  if (forecast.willExceedThreshold) {
    console.log(`\n  ⚠️  Warning: At ${forecast.growthRate * 100}% growth, will exceed €100K in ${forecast.unionThresholdYear.toFixed(1)} years`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
}
