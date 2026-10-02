// calculations.js
//
// This file is the ONLY place quote pricing logic lives (Section 10 of the
// spec recommends storing raw inputs and calculating on display, so the
// logic exists in exactly one place). Both the "create" and "detail"
// endpoints call calculateQuote() on the stored row.

const HOSPITAL_PRICES = {
  None: 0,
  Basic: 90,
  Bronze: 120,
  Silver: 160,
  Gold: 220,
};

const EXTRAS_PRICES = {
  None: 0,
  Basic: 25,
  Standard: 45,
  Premium: 70,
};

const LHC_STATEMENT =
  "Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.";

/**
 * Validates the raw quote input. Returns { valid: boolean, errors: string[] }.
 * This mirrors the frontend validation so the backend never trusts the
 * client (Section 9 / Section C robustness marks).
 */
function validateQuoteInput(input) {
  const errors = [];
  const {
    customer_name,
    cover_type,
    applicant1_age,
    applicant1_cover_history,
    applicant2_age,
    applicant2_cover_history,
    hospital_cover,
    extras_cover,
    payment_frequency,
    annual_discount,
  } = input;

  if (!customer_name || !String(customer_name).trim()) {
    errors.push("Customer name is required.");
  }

  if (!["Single", "Couple", "Family"].includes(cover_type)) {
    errors.push("Cover type must be Single, Couple or Family.");
  }

  if (!isValidAge(applicant1_age)) {
    errors.push("Applicant 1 age must be a number between 18 and 100.");
  }
  if (!["Yes", "No", "Not sure"].includes(applicant1_cover_history)) {
    errors.push("Applicant 1 hospital cover history is required.");
  }

  const needsApplicant2 = cover_type === "Couple" || cover_type === "Family";
  if (needsApplicant2) {
    if (!isValidAge(applicant2_age)) {
      errors.push(
        "Applicant 2 age is required (18-100) for Couple or Family cover."
      );
    }
    if (!["Yes", "No", "Not sure"].includes(applicant2_cover_history)) {
      errors.push(
        "Applicant 2 hospital cover history is required for Couple or Family cover."
      );
    }
  }

  if (!Object.prototype.hasOwnProperty.call(HOSPITAL_PRICES, hospital_cover)) {
    errors.push("Hospital cover level is invalid.");
  }
  if (!Object.prototype.hasOwnProperty.call(EXTRAS_PRICES, extras_cover)) {
    errors.push("Extras cover level is invalid.");
  }

  if (!["Monthly", "Yearly"].includes(payment_frequency)) {
    errors.push("Payment frequency must be Monthly or Yearly.");
  }

  if (payment_frequency === "Yearly") {
    const d = Number(annual_discount);
    if (Number.isNaN(d) || d < 0 || d > 10) {
      errors.push("Annual discount must be a number between 0 and 10 (%).");
    }
  }

  return { valid: errors.length === 0, errors };
}

function isValidAge(age) {
  const n = Number(age);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 18 && n <= 100;
}

/**
 * Computes a single applicant's LHC loading (as a decimal, e.g. 0.2 = 20%).
 * Rules (Section 6):
 *  - hospital_cover === 'None' -> 0 (nothing to load)
 *  - cover_history === 'Yes'   -> 0
 *  - cover_history === 'Not sure' -> 0, but caller should show a warning
 *  - cover_history === 'No'   -> age > 30 ? (age-30)*2% : 0
 */
function calcLoading(age, coverHistory, hospitalCover) {
  if (hospitalCover === "None") return 0;
  if (coverHistory === "Yes") return 0;
  if (coverHistory === "Not sure") return 0;
  if (coverHistory === "No") {
    return age > 30 ? (age - 30) * 0.02 : 0;
  }
  return 0;
}

/**
 * Builds the full explanation-sheet breakdown for a (validated) quote row.
 * Does NOT re-validate - call validateQuoteInput() first.
 */
function calculateQuote(input) {
  const {
    cover_type,
    applicant1_age,
    applicant1_cover_history,
    applicant2_age,
    applicant2_cover_history,
    hospital_cover,
    extras_cover,
    payment_frequency,
    annual_discount,
  } = input;

  const adultCount = cover_type === "Single" ? 1 : 2;
  const hospitalTierPrice = HOSPITAL_PRICES[hospital_cover];
  const extrasTierPrice = EXTRAS_PRICES[extras_cover];

  const applicants = [
    {
      label: "Applicant 1",
      age: Number(applicant1_age),
      history: applicant1_cover_history,
    },
  ];
  if (adultCount === 2) {
    applicants.push({
      label: "Applicant 2",
      age: Number(applicant2_age),
      history: applicant2_cover_history,
    });
  }

  const warnings = [];
  let hospitalTotal = 0;
  const applicantBreakdown = applicants.map((a) => {
    const loading = calcLoading(a.age, a.history, hospital_cover);
    const applicantHospitalCost = hospitalTierPrice * (1 + loading);
    hospitalTotal += applicantHospitalCost;

    if (a.history === "Not sure" && hospital_cover !== "None") {
      warnings.push(
        `${a.label}: Cover history is unknown — LHC loading has not been applied. This quote may be inaccurate.`
      );
    }

    return {
      label: a.label,
      age: a.age,
      coverHistory: a.history,
      loadingPercent: round2(loading * 100),
      hospitalCost: round2(applicantHospitalCost),
    };
  });

  const extrasTotal = extrasTierPrice * adultCount;
  const familyFee = cover_type === "Family" ? 30 : 0;

  const monthlyPremium = hospitalTotal + extrasTotal + familyFee;
  const yearlyBeforeDiscount = monthlyPremium * 12;

  const isYearly = payment_frequency === "Yearly";
  const discountPercent = isYearly ? Number(annual_discount) : 0;
  const yearlyAfterDiscount = isYearly
    ? yearlyBeforeDiscount * (1 - discountPercent / 100)
    : null;

  return {
    coverType: cover_type,
    adultCount,
    hospitalCoverLevel: hospital_cover,
    extrasCoverLevel: extras_cover,
    applicants: applicantBreakdown,
    hospitalTotal: round2(hospitalTotal),
    extrasTotal: round2(extrasTotal),
    familyFee,
    monthlyPremium: round2(monthlyPremium),
    yearlyBeforeDiscount: round2(yearlyBeforeDiscount),
    paymentFrequency: payment_frequency,
    discountPercent: isYearly ? discountPercent : null,
    yearlyAfterDiscount: isYearly ? round2(yearlyAfterDiscount) : null,
    warnings,
    lhcStatement: LHC_STATEMENT,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  HOSPITAL_PRICES,
  EXTRAS_PRICES,
  LHC_STATEMENT,
  validateQuoteInput,
  calculateQuote,
  calcLoading,
};
