# OSS-SME VAT Decision Model

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22485967.svg)](https://doi.org/10.5281/zenodo.22485967)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/badge/release-v1.3.0-blue.svg)](https://github.com/marimarinova/oss-sme-vat-decision-model/releases/tag/v1.3.0)

> **Correction notice (v1.3.0).** Versions up to v1.2.1 counted input VAT under OSS twice, which halved the break-even threshold. Optimal regimes for the illustrative profiles are unchanged, but thresholds and cost differences change. See [CHANGELOG](CHANGELOG.md).

Decision support tool that implements a closed-form mathematical model for the binary SME-versus-OSS regime selection problem faced by EU-established micro-enterprises after the entry into force of Council Directive (EU) 2020/285 on 1 January 2025.

## Overview

The tool computes:

- regime-specific total cost functions $C_{SME}(I)$ and $C_{OSS}(I)$
- the closed-form break-even threshold $I^{\ast}$
- the optimal regime $R^{\ast} \in \{SME, OSS\}$ given operating parameters
- the time-to-threshold $t^{\ast}$ under an auxiliary growth model

## Scope of Applicability

This tool applies to EU-established micro-enterprises engaged in cross-border B2C sales of physical or digital goods. Specifically, the implementation assumes the operating context where:

- the enterprise is established in a single Member State
- inventory is maintained in at most one Member State for cross-border operations
- sales are not routed through electronic interfaces acting as deemed suppliers under Article 9a of Council Implementing Regulation (EU) 282/2011
- the enterprise has a full right to deduct input VAT under the applicable domestic VAT rules

The following configurations fall outside the scope of this tool and require independent VAT analysis beyond the binary SME-OSS choice modelled here:

| Configuration | Why excluded |
|---|---|
| Amazon Pan-EU FBA / multi-Member-State inventory storage | Each intra-EU transfer of own goods triggers an intra-community acquisition that requires local VAT registration regardless of SME status (EC Explanatory Notes, October 2024, Section 6.1) |
| Non-EU-established sellers using EU electronic interfaces | Article 14a(2) of Directive 2006/112/EC renders the platform the deemed supplier |
| Electronically supplied services through platform marketplaces (Etsy digital downloads, App Store, Steam, Google Play) | Article 9a of Implementing Regulation 282/2011 transfers VAT liability to the platform; CJEU confirmed in *Fenix International* (C-695/20, 28 February 2023) |
| Micro-enterprises whose intra-Union distance sales and cross-border electronic services do not exceed EUR 10,000 | Article 59c derogation applies unless the supplier opts for destination taxation; origin-Member-State VAT rules are used |
| Partial deductibility or exempt activities | The full-recovery assumption for OSS input VAT does not hold; the net-refund case would misstate cost |

The Transfer of Own Goods (TOOG) scheme under Council Directive (EU) 2025/516 (ViDA package), effective 1 July 2028, addresses the multi-local inventory case for non-exempt taxable persons. TOOG does not extend to SME-exempt suppliers due to the input VAT deduction prerequisite (Article 369xa(1) of Directive 2006/112/EC as amended). Extension of this tool to TOOG-eligible scenarios is reserved for future development.

## Mathematical Model

The model formalises the choice between the SME exemption scheme under Council Directive (EU) 2020/285 and the OSS Union scheme under Council Directives (EU) 2017/2455 and 2019/1995.

### Cost functions

Both regimes are measured on a common base: the economic burden borne by the seller. The pass-through coefficient $p \in [0,1]$ is the share of output VAT passed on to customers; $p = 0$ (full absorption) is the default and a boundary case.

Under the SME exemption, input VAT is paid to suppliers and cannot be deducted (Article 289 of Council Directive 2006/112/EC, as amended):

$$C_{SME}(I,p) = (1-p)\,V_{SME} + \kappa_{SME} + I$$

Under the OSS Union scheme, input VAT is paid to suppliers ($+I$) and fully recovered through the applicable domestic VAT-return or VAT-refund procedure ($-I$); its net economic effect is zero:

$$C_{OSS}(I,p) = (1-p)\,V_{OSS} + \kappa_{OSS}$$

The VAT cash-flow position under OSS, $V_{OSS} - I$, is reported separately (`netVATPayableOSS`, `refundPositionOSS`) and does not enter the regime-choice objective. Versions up to v1.2.1 used $C_{OSS} = V_{OSS} - I + \kappa_{OSS}$, which combined this cash-flow measure with the economic-burden measure used for SME and counted the input-VAT advantage of OSS twice; see CHANGELOG v1.3.0. Full input-VAT deductibility under OSS is assumed; partial deductibility, exempt activities and the timing or liquidity effects of the refund procedure are outside the model scope. The recovery route depends on whether input VAT was incurred in the Member State of establishment (domestic VAT return) or in another Member State (Directive 2008/9/EC refund).

### Break-even threshold

Setting $C_{SME}(I) = C_{OSS}(I)$ and solving for $I$ yields the closed-form break-even threshold:

$$I^{\ast}(p) = (1-p)\,(V_{OSS} - V_{SME}) + (\kappa_{OSS} - \kappa_{SME})$$

The signed cost difference is linear with unit slope in $I$:

$$C_{SME}(I,p) - C_{OSS}(I,p) = I - I^{\ast}(p)$$

Since $V_{OSS} \geq V_{SME}$ and $\kappa_{OSS} > \kappa_{SME}$, $I^{\ast}(p) > 0$ for every $p \in [0,1]$, with $I^{\ast}(1) = \kappa_{OSS} - \kappa_{SME}$. For a given $I$, the pass-through switch point is

$$p^{\ast} = 1 - \frac{I - (\kappa_{OSS} - \kappa_{SME})}{V_{OSS} - V_{SME}}$$

Sanity check: with $V_{SME} = 0$, $V_{OSS} = 5000$, $I = 1000$ and equal compliance costs, SME saves $5000 - 1000 = 4000$, so $I^{\ast} = 5000$ (validation test S1).

### Decision rule

$$R^{\ast} = \text{SME} \quad \text{when} \quad I < I^{\ast}(p)$$

$$R^{\ast} = \text{OSS} \quad \text{when} \quad I \geq I^{\ast}(p)$$

### Feasibility constraint

The SME exemption is available only when Union-wide turnover $T$ does not exceed $\theta = $ EUR 100,000, and when turnover in each Member State where the exemption is sought remains below that State's national threshold. Above the Union threshold the cross-border exemption is unavailable and the covered supplies are taxed in the Member States of consumption; the OSS is an optional simplification for declaring that VAT (Article 369b), and it is the declaration route modelled here.

### Auxiliary growth model

For an enterprise with initial turnover $T_0$ and constant annual growth rate $g$, the time to cross the Union threshold is:

$$t^{\ast} = \frac{\log(\theta / T_0)}{\log(1 + g)}$$

## Project Status and Roadmap

v1.3.0 implements the corrected binary model. Work in progress for the next release extends it to a jurisdiction-level model:

- the decision is exemption or taxation in each Member State of consumption, together with the registration status in the Member State of establishment;
- two registration families: without a domestic deduction right (no registration, or OSS-only registration) and with full domestic registration, where mixed-use input VAT is deducted pro rata;
- establishment-state deduction rules as parameters, with Bulgaria as the first verified configuration;
- analytical results on when the country-by-country decision separates and when exemptions become complements through the deduction pro rata.

These extensions are not yet part of the released code.

## Repository Structure

```
oss-sme-vat-decision-model/
├── README.md                       # this file
├── CHANGELOG.md                    # version history
├── LICENSE                         # MIT
├── src/
│   ├── model.js                    # calculator logic
│   └── calculator.jsx              # React UI component
├── data/
│   └── eu-vat-rates-2025.json      # VAT rates and SME implementation status, 27 Member States
└── tests/
    └── validation.test.js          # 21-test validation suite
```

## Installation

```bash
git clone https://github.com/marimarinova/oss-sme-vat-decision-model.git
cd oss-sme-vat-decision-model
npm install
```

## Usage

```javascript
const { calculateRegimeCosts, calculateBreakeven } = require('./src/model.js');

const result = calculateRegimeCosts(
  { DE: 8500, FR: 4200, IT: 3100 },  // turnover by Member State
  'BG',                               // Member State of establishment
  350,                                // annual input VAT in EUR
  0                                   // optional pass-through p in [0,1], default 0
);
const be = calculateBreakeven(result.vatSME, result.vatOSS);

console.log(result.vatSME, result.vatOSS, result.optimalRegime, be.breakeven);
```

## Validation

The repository includes a 21-test validation suite covering edge cases, parametric sensitivity, four illustrative micro-enterprise scenarios, the separation of the OSS refund position from economic cost, and five economic-consistency tests (S1 to S5) whose expected values are computed by hand, independently of the implemented break-even function, so that a mis-specified cost function is detected and not only a mis-implemented one. All 21 validation tests pass at numerical tolerance $\varepsilon \leq$ EUR 1. The tests verify the implemented formulas, boundary conditions and illustrative scenarios; they do not establish legal advice or empirical representativeness.

```bash
npm test
```

## Illustrative Profiles and Audit Results

Values are computed from unrounded inputs; displayed rounded to the nearest euro. VAT amounts follow from each profile's turnover distribution and the standard rates in `data/eu-vat-rates-2025.json`. SME exemption is applied only in Member States that have implemented the cross-border scheme and where turnover is below the national threshold. France is coded as implementing the cross-border SME scheme from 1 January 2025, based on French administrative guidance (BOFiP ACTU-2025-00144) and the Finance Act for 2024.

| Profile | T | I | $V_{SME}$ | $V_{OSS}$ | $C_{SME}$ | $C_{OSS}$ | $I^{\ast}$ | $R^{\ast}$ | $\Delta C$ |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|
| A. Low-I, single-category digital | 25,300 | 350 | 417 | 4,287 | 967 | 4,787 | 4,171 | SME | 3,821 |
| B. High-I, physical goods | 50,000 | 9,500 | 0 | 8,379 | 9,700 | 8,879 | 8,679 | OSS | 821 |
| C. Mid-I, digital services near $\theta$ | 98,000 | 2,500 | 6,553 | 16,644 | 9,253 | 17,144 | 10,390 | SME | 7,890 |
| D. Mid-I, diversified geographic | 80,000 | 3,000 | 12,129 | 13,932 | 15,329 | 14,432 | 2,103 | OSS | 897 |

Values at $p = 0$ (v1.3.0). Optimal regimes are unchanged relative to v1.2.1; cost differences change because v1.2.1 double-counted input VAT under OSS. Profile B has a VAT refund position of EUR 1,121 under OSS in cash-flow terms, which is not an economic cost saving. Pass-through switch points: Profile A at $p^{\ast} \approx 0.987$, Profile C at $p^{\ast} \approx 0.782$; Profiles B and D remain OSS for every $p \in [0,1]$.

## Citation

```bibtex
@software{marinova2026code,
  author    = {Marinova, Marieta},
  title     = {{OSS-SME VAT Decision Model}},
  version   = {v1.3.0},
  year      = {2026},
  doi       = {10.5281/zenodo.22485967},
  url       = {https://github.com/marimarinova/oss-sme-vat-decision-model}
}
```

Cite the version DOI of v1.3.0 (shown on its Zenodo record) in publications; the concept DOI above resolves to the latest version. Versions v1.2.1 and earlier contain the specification error corrected in v1.3.0 and should not be used for results.

## Legal References

- Council Directive 2006/112/EC of 28 November 2006 on the common system of value added tax - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2006/112/oj)
- Council Directive (EU) 2017/2455 of 5 December 2017 - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2017/2455/oj)
- Council Directive (EU) 2019/1995 of 21 November 2019 - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2019/1995/oj)
- Council Directive (EU) 2020/285 of 18 February 2020 (SME scheme) - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2020/285/oj)
- Council Directive (EU) 2025/516 of 11 March 2025 (ViDA package) - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2025/516/oj)
- Council Implementing Regulation (EU) No 282/2011 - [EUR-Lex](https://eur-lex.europa.eu/eli/reg_impl/2011/282/oj)
- Council Directive 2008/9/EC (cross-border VAT refund procedure) - [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2008/9/oj)
- EC Explanatory Notes on the SME scheme (DG TAXUD, October 2024) - [EC SME portal](https://sme-vat-rules.ec.europa.eu/system/files/2024-10/sme-explanatory-notes_en.pdf)
- CJEU, *Fenix International* (Case C-695/20, 28 February 2023)
- Bulgaria transposition: ZID ZDDS, State Gazette No. 115 of 30 December 2025, in force from 1 January 2026 (Article 96(1) and Chapter 21b, Articles 168d-168f ZDDS)

## License

MIT License. See [LICENSE](LICENSE).

## Author

**Marieta Marinova**
PhD candidate, Faculty of Economics and Business Administration
Department of Finance and Accounting
Sofia University "St. Kliment Ohridski", Sofia, Bulgaria
ORCID: [0009-0006-9145-4199](https://orcid.org/0009-0006-9145-4199)
Email: marietaim@uni-sofia.bg
