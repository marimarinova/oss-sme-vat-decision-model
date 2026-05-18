# OSS-SME VAT Decision Model

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20204620.svg)](https://doi.org/10.5281/zenodo.20204620)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/badge/release-v1.1.0-blue.svg)](https://github.com/marimarinova/oss-sme-vat-decision-model/releases/tag/v1.1.0)

Decision support tool that implements a closed-form mathematical optimization model for the binary SME-versus-OSS regime selection problem faced by EU-established micro-enterprises after the entry into force of Council Directive (EU) 2020/285 on 1 January 2025.

## Overview

The tool computes:

- regime-specific compliance cost functions $C_{SME}(I)$ and $C_{OSS}(I)$
- the closed-form break-even threshold $I^{\ast}$
- the optimal regime $R^{\ast} \in \{SME, OSS\}$ given operating parameters
- the time-to-threshold $t^{\ast}$ under an auxiliary growth model

## Scope of Applicability

This tool applies to EU-established micro-enterprises engaged in cross-border B2C sales of physical or digital goods. Specifically, the implementation assumes the operating context where:

- the enterprise is established in a single Member State
- inventory is maintained in at most one Member State for cross-border operations
- sales are not routed through electronic interfaces acting as deemed suppliers under Article 9a of Council Implementing Regulation (EU) 282/2011

The following configurations fall outside the scope of this tool and require independent VAT analysis beyond the binary SME-OSS choice modelled here:

| Configuration | Why excluded |
|---|---|
| Amazon Pan-EU FBA / multi-Member-State inventory storage | Each intra-EU transfer of own goods triggers an intra-community acquisition that requires local VAT registration regardless of SME status (EC Explanatory Notes, October 2024, Section 6.1) |
| Non-EU-established sellers using EU electronic interfaces | Article 14a(2) of Directive 2006/112/EC renders the platform the deemed supplier |
| Electronically supplied services through platform marketplaces (Etsy digital downloads, App Store, Steam, Google Play) | Article 9a of Implementing Regulation 282/2011 transfers VAT liability to the platform; CJEU confirmed in *Fenix International* (C-695/20, 28 February 2023) |
| Micro-enterprises with EU-wide turnover below €10,000 | Article 59c micro-business derogation applies; origin-Member-State VAT rate is used |

The Transfer of Own Goods (TOOG) scheme under Council Directive (EU) 2025/516 (ViDA package), effective 1 July 2028, addresses the multi-local inventory case for non-exempt taxable persons. TOOG does not extend to SME-exempt suppliers due to the input VAT deduction prerequisite. Extension of this tool to TOOG-eligible scenarios is reserved for future development.

## Mathematical Model

The model formalises the choice between the SME exemption scheme under Council Directive (EU) 2020/285 and the OSS Union scheme under Council Directives (EU) 2017/2455 and 2019/1995.

### Cost functions

Under the SME exemption, input VAT becomes a sunk cost per Article 289 of Council Directive 2006/112/EC (as amended):

$$C_{SME}(I) = V_{SME} + \kappa_{SME} + I$$

Under the OSS Union scheme, input VAT offsets output VAT liability:

$$C_{OSS}(I) = \max(0, V_{OSS} - I) + \kappa_{OSS}$$

### Break-even threshold

Setting $C_{SME}(I) = C_{OSS}(I)$ and solving for $I$ yields the closed-form break-even threshold:

$$I^{\ast} = \frac{V_{OSS} - V_{SME} + \kappa_{OSS} - \kappa_{SME}}{2}$$

The factor of 2 reflects the asymmetric incidence of input VAT under the two regimes: $I$ is a sunk cost under SME and a recoverable credit under OSS.

### Decision rule

The optimal regime is determined by comparing the actual input VAT to the break-even threshold:

$$R^{\ast} = \text{SME} \quad \text{when} \quad I < I^{\ast}$$

$$R^{\ast} = \text{OSS} \quad \text{when} \quad I \geq I^{\ast}$$

### Feasibility constraint

The SME exemption is available only when Union-wide turnover $T$ does not exceed $\theta = €100{,}000$.

### Auxiliary growth model

For an enterprise with initial turnover $T_0$ and constant annual growth rate $g$, the time to cross the Union threshold is:

$$t^{\ast} = \frac{\log(\theta / T_0)}{\log(1 + g)}$$

## Repository Structure

```
oss-sme-vat-decision-model/
├── README.md                       # this file
├── LICENSE                         # MIT
├── src/
│   ├── model.js                    # calculator logic
│   └── calculator.jsx              # React UI component
├── data/
│   └── eu-vat-rates-2025.json      # VAT rates for 27 EU Member States
└── tests/
    └── validation.test.js          # 15-test validation suite
```

## Installation

```bash
git clone https://github.com/marimarinova/oss-sme-vat-decision-model.git
cd oss-sme-vat-decision-model
npm install
```

## Usage

```javascript
import { computeOptimalRegime } from './src/model.js';

const result = computeOptimalRegime({
  T: 25300,        // Union-wide turnover in EUR
  I: 350,          // annual input VAT in EUR
  V_SME: 1000,     // opportunity cost of absorbed destination VAT
  V_OSS: 4172,     // gross destination output VAT liability
  kappa_SME: 200,  // SME compliance cost
  kappa_OSS: 500   // OSS compliance cost
});

console.log(result);
// { regime: 'SME', I_star: 1736, delta_C: 2771 }
```

## Validation

The repository includes a 15-test validation suite covering edge cases, parametric sensitivity, four representative micro-enterprise profiles, and reproducibility of the closed-form break-even formula. All tests pass at numerical tolerance $\varepsilon \leq €1$.

```bash
npm test
```

## Representative Profiles

The validation suite includes four canonical EU micro-enterprise profiles:

| Profile | T (EUR) | I (EUR) | $I^{\ast}$ (EUR) | $R^{\ast}$ | $\Delta C$ (EUR) |
|---|---|---|---|---|---|
| A. Low-I, single-category digital | 25,300 | 350 | 1,736 | SME | 2,771 |
| B. High-I, physical goods | 50,000 | 9,500 | 3,900 | OSS | 11,200 |
| C. Mid-I, digital services near $\theta$ | 98,000 | 2,500 | 3,362 | SME | 1,724 |
| D. Mid-I, diversified geographic | 80,000 | 3,000 | 1,052 | OSS | 3,897 |

## Citation

If you use this tool, please cite the software via its Zenodo DOI:

```bibtex
@software{marinova2026code,
  author    = {Marinova, Marieta},
  title     = {{OSS-SME VAT Decision Model}},
  version   = {v1.1.0},
  year      = {2026},
  doi       = {10.5281/zenodo.20204620},
  url       = {https://github.com/marimarinova/oss-sme-vat-decision-model}
}
```

## Legal References

- Council Directive 2006/112/EC of 28 November 2006 on the common system of value added tax - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2006/112/oj)
- Council Directive (EU) 2017/2455 of 5 December 2017 - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2017/2455/oj)
- Council Directive (EU) 2019/1995 of 21 November 2019 - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2019/1995/oj)
- Council Directive (EU) 2020/285 of 18 February 2020 (SME scheme) - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2020/285/oj)
- Council Directive (EU) 2025/516 of 11 March 2025 (ViDA package) - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2025/516/oj)
- Council Implementing Regulation (EU) No 282/2011 - [EUR-Lex](https://eur-lex.europa.eu/eli/reg_impl/2011/282/oj)
- EC Explanatory Notes on the SME scheme (DG TAXUD, October 2024) - [EC SME portal](https://sme-vat-rules.ec.europa.eu/system/files/2024-10/sme-explanatory-notes_en.pdf)
- CJEU, *Fenix International* (Case C-695/20, 28 February 2023)
- Bulgaria transposition: ZID ZDDS, State Gazette No. 115 of 30 December 2025, in force from 1 January 2026

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

**Marieta Marinova**
PhD candidate, Faculty of Economics and Business Administration
Department of Finance and Accounting
Sofia University "St. Kliment Ohridski", Sofia, Bulgaria
ORCID: [0009-0006-9145-4199](https://orcid.org/0009-0006-9145-4199)
Email: marietaim@uni-sofia.bg
