# OSS-SME VAT Decision Model

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20117159.svg)](https://doi.org/10.5281/zenodo.20117159)

**Mathematical optimization model for VAT regime selection: SME Scheme vs One-Stop Shop for EU micro-enterprises**

## Overview

This decision support tool helps EU-based micro-enterprises determine the optimal VAT regime when conducting cross-border B2C sales. Following the implementation of Directive (EU) 2020/285 (effective January 2025), businesses can now apply the SME VAT exemption scheme across EU borders, creating a non-trivial optimization problem.

### The Decision Problem

| Regime | VAT Collection | Input VAT Recovery | Compliance Cost |
| --- | --- | --- | --- |
| **SME Scheme** | Exempt (in eligible MS) | ❌ Not deductible (Art. 289) | Lower (~€200/year) |
| **OSS Union** | Destination rates | ✅ Fully deductible | Higher (~€500/year) |

**When is SME better?** Low business expenses → minimal input VAT to recover
**When is OSS better?** High material/shipping costs → significant input VAT recovery

## Mathematical Model

### Cost Functions

The total annual cost under each regime:

$$C_{SME}(I) = V_{SME} + \kappa_{SME} + I$$

$$C_{OSS}(I) = \max(0, V_{OSS} - I) + \kappa_{OSS}$$

Where:

- $V_{OSS}$ = gross destination output VAT liability under the OSS regime before input recovery
- $V_{SME}$ = opportunity cost of absorbed destination VAT under the SME exemption (under full-absorption assumption $p = 0$; not a legal VAT charge, which is zero per Art. 289 of Directive 2006/112/EC, but the margin reduction required to match the prices of OSS-registered competitors who embed destination VAT in their consumer prices)
- $\kappa_R$ = annual compliance cost under regime $R$
- $I$ = annual input VAT (deductible only under OSS)

### Break-even Theorem

The break-even input VAT $I^*$ where both regimes yield equal costs:

$$I^* = \frac{V_{OSS} - V_{SME} + \kappa_{OSS} - \kappa_{SME}}{2}$$

**Decision Rule:**

- If $I < I^*$ → Choose **SME Scheme**
- If $I \geq I^*$ → Choose **OSS**

The factor of 2 arises from the asymmetric incidence of input VAT across regimes: $I$ is a sunk cost under SME (non-deductible per Art. 289) and offsets output VAT under OSS.

### Threshold Forecasting

Time to exceed Union threshold (€100,000) with constant annual growth rate $g$:

$$t^* = \frac{\log(\theta_U / T_0)}{\log(1 + g)}$$

## Features

- ✅ All 27 EU Member States with current VAT rates (January 2025)
- ✅ SME national thresholds and implementation status
- ✅ Break-even analysis with closed-form solution
- ✅ Growth forecasting with threshold crossing prediction
- ✅ Multi-country turnover distribution support
- ✅ Sensitivity analysis around break-even point

## Installation

### Option 1: Use the JavaScript Module

```
npm install
node src/model.js
```

### Option 2: React Component

```
import SMEOSSModel from './src/calculator.jsx';

function App() {
  return <SMEOSSModel />;
}
```

## Usage Example

```
const { calculateRegimeCosts, calculateBreakeven } = require('./src/model.js');

// Example: Bulgarian seller with cross-border sales
const turnover = {
  DE: 15000,  // Germany
  FR: 8000,   // France
  IT: 5000    // Italy
};

const inputVAT = 2000;  // Annual deductible expenses
const msEstablishment = 'BG';

const result = calculateRegimeCosts(turnover, msEstablishment, inputVAT);
const breakeven = calculateBreakeven(result.V_SME, result.V_OSS);

console.log(`Optimal regime: ${result.optimalRegime}`);
console.log(`Annual savings: €${result.savings.toFixed(2)}`);
console.log(`Break-even point: €${breakeven.I_star.toFixed(2)}`);
```

## Validation

The model has been validated with a 15-test suite covering edge cases (5 tests), parametric scenarios (5 tests), four representative profiles (4 tests), and reproducibility (1 cross-check against the closed-form formula). All 15 tests passed at numerical tolerance $\epsilon \leq €1$.

| Profile | Turnover ($T$) | Input VAT ($I$) | $I^*$ | Optimal | Annual savings ($\Delta C$) |
| --- | --- | --- | --- | --- | --- |
| A. Low-$I$, single-category digital | €25,300 | €350 | €1,736 | SME | €2,771 |
| B. High-$I$, physical goods | €50,000 | €9,500 | €3,900 | OSS | €11,200 |
| C. Mid-$I$, digital services near $\theta$ | €98,000 | €2,500 | €3,362 | SME | €1,724 |
| D. Mid-$I$, diversified geographic | €80,000 | €3,000 | €1,052 | OSS | €3,897 |

The four canonical profiles span the parameter space of typical cross-border EU operations and are used in the companion academic paper to test propositions P1 (low-$I$ favours SME) and P2 (high-$I$ favours OSS).

See `/tests/validation.test.js` for the complete test suite.

## Scope & Limitations

### In Scope

- EU-established taxable persons
- B2C cross-border sales
- Physical goods and TBE services
- Mixed business models (platform + own shop)
- Full-absorption assumption ($p = 0$): firm absorbs destination VAT from margin rather than passing through to consumers

### Out of Scope

- **Deemed supplier transactions (Art. 14a)** — platform assumes VAT liability
- IOSS imports ≤€150
- Non-EU sellers via marketplaces
- B2B transactions
- Partial pass-through ($p > 0$): acknowledged as a generalisation (Model B) for future research

## Legal Framework

- Council Directive 2006/112/EC (VAT Directive)
- Council Directive (EU) 2020/285 (SME Scheme reform)
- Council Directive (EU) 2017/2455 (OSS introduction)
- Art. 59c — €10,000 threshold
- Art. 282-292 — SME provisions
- Art. 289 — No input VAT deduction under SME

## Data Sources

- VAT rates: [EC TEDB](https://ec.europa.eu/taxation_customs/tedb/)
- SME thresholds: [sme-vat-rules.ec.europa.eu](https://sme-vat-rules.ec.europa.eu/)
- EC Explanatory Notes on SME Scheme (24 October 2024)

## Citation

If you use this tool in academic research, please cite:

```
@software{marinova2026ossmodel,
  author    = {Marinova, Marieta},
  title     = {OSS-SME VAT Decision Model: Mathematical Optimization
               for EU Micro-Enterprise VAT Regime Selection},
  year      = {2026},
  publisher = {Zenodo},
  version   = {1.1.0},
  doi       = {10.5281/zenodo.20117159},
  url       = {https://github.com/marimarinova/oss-sme-vat-decision-model}
}
```

Note: After publishing v1.1.0 on Zenodo, replace the DOI above with the new version-specific DOI provided by Zenodo. The DOI shown at the top of this README is the concept DOI; the version-specific DOI of v1.0.0 was the first release.

## License

MIT License — see [LICENSE](https://github.com/marimarinova/oss-sme-vat-decision-model/blob/main/LICENSE) for details.

## Author

**Marieta Marinova**
ORCID: 0009-0006-9145-4199
PhD Candidate, Sofia University "St. Kliment Ohridski"
Faculty of Economics and Business Administration, Department of Finance and Accounting

## Acknowledgments

Research conducted as part of PhD dissertation on optimization of accounting processes for cross-border B2C sales under the EU OSS regime. Companion academic paper accepted at the 52nd International Conference on Applications of Mathematics in Engineering and Economics (AMEE 2026), Sozopol, Bulgaria, 6–12 June 2026.
