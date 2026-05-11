# OSS-SME VAT Decision Model

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXX.svg)](https://doi.org/10.5281/zenodo.XXXXXXX)

**Mathematical optimization model for VAT regime selection: SME Scheme vs One-Stop Shop for EU micro-enterprises**

## Overview

This decision support tool helps EU-based micro-enterprises determine the optimal VAT regime when conducting cross-border B2C sales. Following the implementation of Directive (EU) 2020/285 (effective January 2025), businesses can now apply the SME VAT exemption scheme across EU borders, creating a non-trivial optimization problem.

### The Decision Problem

| Regime | VAT Collection | Input VAT Recovery | Compliance Cost |
|--------|----------------|-------------------|-----------------|
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
- $V_R$ = VAT collected under regime $R$
- $\kappa_R$ = compliance costs
- $I$ = annual input VAT (deductible business expenses)

### Break-even Theorem

The break-even input VAT $I^*$ where both regimes yield equal costs:

$$I^* = \frac{V_{OSS} - V_{SME} + \kappa_{OSS} - \kappa_{SME}}{2}$$

**Decision Rule:**
- If $I < I^*$ → Choose **SME Scheme**
- If $I \geq I^*$ → Choose **OSS**

### Threshold Forecasting

Time to exceed Union threshold (€100,000) with growth rate $g$:

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

```bash
npm install
node src/model.js
```

### Option 2: React Component

```jsx
import SMEOSSModel from './src/calculator.jsx';

function App() {
  return <SMEOSSModel />;
}
```

## Usage Example

```javascript
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

The model has been validated with:
- **10 simulated test cases** covering edge cases and boundary conditions
- **5 real-world scenarios** from e-commerce sector

| Scenario | Turnover | Input VAT | Optimal | Savings |
|----------|----------|-----------|---------|---------|
| Digital patterns | €25,300 | €350 | SME | €2,771/year |
| Handmade jewelry | €50,000 | €9,500 | OSS | €11,200/year |
| Online courses | €98,000 | €2,500 | SME | €1,724/year |

See `/tests/validation.test.js` for complete test suite.

## Scope & Limitations

### In Scope
- EU-established taxable persons
- B2C cross-border sales
- Physical goods and TBE services
- Mixed business models (platform + own shop)

### Out of Scope
- **Deemed supplier transactions (Art. 14a)** — platform assumes VAT liability
- IOSS imports ≤€150
- Non-EU sellers via marketplaces
- B2B transactions

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
- EC Explanatory Notes on SME Scheme (November 2024)

## Citation

If you use this tool in academic research, please cite:

```bibtex
@software{marinova2026ossmodel,
  author    = {Marinova, Marieta},
  title     = {OSS-SME VAT Decision Model: Mathematical Optimization 
               for EU Micro-Enterprise VAT Regime Selection},
  year      = {2026},
  publisher = {Zenodo},
  doi       = {10.5281/zenodo.XXXXXXX},
  url       = {https://github.com/username/oss-sme-vat-decision-model}
}
```

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Marieta Marinova**  
PhD Candidate, Sofia University "St. Kliment Ohridski"  
Faculty of Economics and Business Administration

## Acknowledgments

Research conducted as part of PhD dissertation on optimization of accounting processes for cross-border B2C sales under the EU OSS regime.
