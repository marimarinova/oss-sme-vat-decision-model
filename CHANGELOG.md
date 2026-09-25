# Changelog

## v1.3.0 — 2026-09-20

### Model (correction)
- Corrected the OSS economic cost function from `V_OSS - I + kappa_OSS` to
  `V_OSS + kappa_OSS`. Under full deductibility, input VAT is paid (+I) and
  recovered (-I) under OSS, so its net economic effect is zero. The v1.2.x form
  combined a net-remittance measure (OSS) with an economic-burden measure (SME)
  and counted the input-VAT advantage of OSS twice (2I instead of I).
- Corrected the break-even threshold from `(dV + dKappa) / 2` to `dV + dKappa`.
- Corrected the break-even interpretation strings, which in v1.2.x stated the
  opposite regime for non-positive and very high thresholds.
- Added optional pass-through coefficient p in [0,1] to `calculateRegimeCosts`
  and `calculateBreakeven`, and `calculateSwitchPoint` for p*.
- The OSS VAT cash-flow position is now reported separately
  (`netVATPayableOSS`, `refundPositionOSS`) and is not part of the objective.

### Results
- Optimal regimes for Profiles A-D are unchanged.
- Cost differences: A 3,471 -> 3,821; B 10,321 -> 821; C 5,390 -> 7,890;
  D 3,897 -> 897 (EUR, p = 0).
- Break-even thresholds double: A 4,171; B 8,679; C 10,390; D 2,103.
- Profile C pass-through switch point: 0.534 -> 0.782. With p in {0, 0.3, 0.7}
  no profile changes regime.

### Validation
- Replaced test 10b (which asserted the erroneous negative C_OSS) with a test
  separating the refund position from economic cost.
- Added tests S1-S5 with hand-computed expectations. Run against v1.2.1, S1, S3
  and S4 fail, confirming that the new tests detect the specification error.
  15 of the 16 v1.2.1 tests pass under both versions and could not detect it.
- Suite size: 21 tests, 21 passed.

## v1.2.1 — 2026-09-04

### Data
- Corrected France implementation status to `implemented: true` for the
  cross-border SME scheme, applicable from 1 January 2025 (Finance Act 2024;
  BOFiP ACTU-2025-00144). Previous value `false` was incorrect for the model's
  definition of the field.
- Recalculated Profiles A, B, C (V_SME changes; optimal regimes unchanged).
- Updated Table 3, the pass-through sensitivity table, and Figure 1.
- Updated validation test 6 to use confirmed non-implementing states (DK, GR, PT)
  instead of FR.

## v1.2.0 — 2026-09-04

### Model
- Replaced the OSS cost function `max(0, V_OSS - I) + kappa_OSS` with the linear
  form `V_OSS - I + kappa_OSS`, under the full-input-VAT-recovery assumption.
  A negative C_OSS now denotes a net VAT-refund position after the modeled
  compliance cost.
- Removed the input-heavy break-even branch (former Eq. 8 in the manuscript);
  the single closed-form threshold now applies for all non-negative input VAT.
- Consolidated the duplicated feasibility constraint.

### Validation
- Replaced test T-05 (former input-heavy branch verification) with a net-refund
  test (test 10b) verifying I > V_OSS and C_OSS < kappa_OSS for a physical-goods
  profile. Suite size is 16 tests.
- Re-ran the complete validation suite: 16 passed, 0 failed (tolerance eps <= 1 EUR).

### Documentation
- Rewrote README to describe the linear model.
- Corrected Profile B break-even threshold in README from an erroneous 3,900 to
  the code-derived value (3,339 in v1.2.0; 4,339 after the France correction in v1.2.1).
- Corrected Profile B annual cost difference from 11,200 to 12,321 (v1.2.0); further updated to 10,321 after the France correction (v1.2.1).
- Added the full-deductibility assumption and the refund-route note.
- Recalculated and published the audit table for Profiles A-D from unrounded inputs.

### Notes
- V_SME and V_OSS are computed from each profile's turnover distribution and the
  standard rates in data/eu-vat-rates-2025.json. Earlier manuscript values
  (V_SME = 1,000, V_OSS = 4,172 for Profile A) originated from a prior rate table
  and are superseded by the code-derived values.
- SME implementation status per Member State (field `implemented` in the rate
  table) is a snapshot as of January 2025 and should be cited against the EC SME
  portal in the manuscript.
