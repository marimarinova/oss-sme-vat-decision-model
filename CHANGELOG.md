# Changelog

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
