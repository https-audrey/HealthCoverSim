import { useState, useRef, useCallback, useMemo } from "react";

const HOSPITAL_OPTIONS = ["None", "Basic", "Bronze", "Silver", "Gold"];
const EXTRAS_OPTIONS = ["None", "Basic", "Standard", "Premium"];
const HISTORY_OPTIONS = ["Yes", "No", "Not sure"];

// Per-person monthly base prices – must stay in sync with backend/calculations.js
const HOSPITAL_PRICES = { None: 0, Basic: 90, Bronze: 120, Silver: 160, Gold: 220 };
const EXTRAS_PRICES = { None: 0, Basic: 25, Standard: 45, Premium: 70 };

function formatPrice(amount) {
  return amount === 0 ? "Free" : `$${amount}/mo`;
}

/** Mirrors backend/calculations.js calcLoading */
function calcLoading(age, coverHistory, hospitalCover) {
  if (hospitalCover === "None") return 0;
  if (coverHistory === "Yes") return 0;
  if (coverHistory === "Not sure") return 0;
  if (coverHistory === "No") {
    return age > 30 ? (age - 30) * 0.02 : 0;
  }
  return 0;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

const emptyForm = {
  customer_name: "",
  cover_type: "Single",
  applicant1_age: "",
  applicant1_cover_history: "",
  applicant2_age: "",
  applicant2_cover_history: "",
  hospital_cover: "None",
  extras_cover: "None",
  payment_frequency: "Monthly",
  annual_discount: "",
  notes: "",
};

/**
 * Client-side validation. Mirrors backend/calculations.js validateQuoteInput
 * so users get instant feedback, but the backend re-validates independently -
 * the frontend check is a convenience, not the source of truth.
 *
 * Returns a keyed object where each key is a field name and the value is
 * the error message string. An empty object means no errors.
 */
function validate(form) {
  const errors = {};
  if (!form.customer_name.trim()) {
    errors.customer_name = "Customer name is required.";
  }

  const age1 = Number(form.applicant1_age);
  if (!form.applicant1_age || Number.isNaN(age1) || age1 < 18 || age1 > 100) {
    errors.applicant1_age = "Age must be between 18 and 100.";
  }
  if (!form.applicant1_cover_history) {
    errors.applicant1_cover_history = "Hospital cover history is required.";
  }

  const needsApplicant2 = form.cover_type === "Couple" || form.cover_type === "Family";
  if (needsApplicant2) {
    const age2 = Number(form.applicant2_age);
    if (!form.applicant2_age || Number.isNaN(age2) || age2 < 18 || age2 > 100) {
      errors.applicant2_age = "Age must be between 18 and 100.";
    }
    if (!form.applicant2_cover_history) {
      errors.applicant2_cover_history = "Hospital cover history is required.";
    }
  }

  if (form.payment_frequency === "Yearly") {
    const d = Number(form.annual_discount);
    if (form.annual_discount === "" || Number.isNaN(d) || d < 0 || d > 10) {
      errors.annual_discount = "Discount must be between 0 and 10%.";
    }
  }

  return errors;
}

/** Small inline error message shown below a field */
function FieldError({ message }) {
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}

/**
 * Live cost estimate panel – mirrors the backend calculateQuote() logic
 * so the user sees pricing update in real-time as they fill the form.
 */
function CostEstimate({ form }) {
  const estimate = useMemo(() => {
    const hospitalTierPrice = HOSPITAL_PRICES[form.hospital_cover] || 0;
    const extrasTierPrice = EXTRAS_PRICES[form.extras_cover] || 0;
    const adultCount = form.cover_type === "Single" ? 1 : 2;
    const needsApplicant2 = form.cover_type === "Couple" || form.cover_type === "Family";

    // Applicant 1
    const age1 = Number(form.applicant1_age) || 0;
    const loading1 = calcLoading(age1, form.applicant1_cover_history, form.hospital_cover);
    const hospital1 = round2(hospitalTierPrice * (1 + loading1));

    // Applicant 2
    let hospital2 = 0;
    let loading2 = 0;
    if (needsApplicant2) {
      const age2 = Number(form.applicant2_age) || 0;
      loading2 = calcLoading(age2, form.applicant2_cover_history, form.hospital_cover);
      hospital2 = round2(hospitalTierPrice * (1 + loading2));
    }

    const hospitalTotal = round2(hospital1 + hospital2);
    const extrasTotal = round2(extrasTierPrice * adultCount);
    const familyFee = form.cover_type === "Family" ? 30 : 0;
    const monthlyPremium = round2(hospitalTotal + extrasTotal + familyFee);
    const yearlyBeforeDiscount = round2(monthlyPremium * 12);

    const isYearly = form.payment_frequency === "Yearly";
    const discountPercent = isYearly ? (Number(form.annual_discount) || 0) : 0;
    const yearlyAfterDiscount = isYearly
      ? round2(yearlyBeforeDiscount * (1 - discountPercent / 100))
      : null;

    return {
      hospital1,
      loading1,
      hospital2,
      loading2,
      hospitalTotal,
      extrasTotal,
      familyFee,
      monthlyPremium,
      yearlyBeforeDiscount,
      yearlyAfterDiscount,
      discountPercent,
      isYearly,
      needsApplicant2,
      adultCount,
      hospitalCover: form.hospital_cover,
      extrasCover: form.extras_cover,
    };
  }, [form]);

  const noCover = estimate.hospitalCover === "None" && estimate.extrasCover === "None";

  return (
    <aside className="cost-estimate">
      <div className="cost-estimate-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span>Cost Estimate</span>
      </div>

      {noCover ? (
        <p className="cost-estimate-empty">Select a cover level to see pricing.</p>
      ) : (
        <>
          {/* Line items */}
          <div className="cost-estimate-items">
            {estimate.hospitalCover !== "None" && (
              <>
                <div className="cost-item">
                  <span>Hospital ({estimate.hospitalCover}) — Applicant 1</span>
                  <span>${estimate.hospital1.toFixed(2)}</span>
                </div>
                {estimate.loading1 > 0 && (
                  <div className="cost-item cost-item-note">
                    <span>↳ incl. LHC loading {round2(estimate.loading1 * 100)}%</span>
                    <span></span>
                  </div>
                )}
                {estimate.needsApplicant2 && (
                  <>
                    <div className="cost-item">
                      <span>Hospital ({estimate.hospitalCover}) — Applicant 2</span>
                      <span>${estimate.hospital2.toFixed(2)}</span>
                    </div>
                    {estimate.loading2 > 0 && (
                      <div className="cost-item cost-item-note">
                        <span>↳ incl. LHC loading {round2(estimate.loading2 * 100)}%</span>
                        <span></span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {estimate.extrasCover !== "None" && (
              <div className="cost-item">
                <span>Extras ({estimate.extrasCover}) × {estimate.adultCount}</span>
                <span>${estimate.extrasTotal.toFixed(2)}</span>
              </div>
            )}

            {estimate.familyFee > 0 && (
              <div className="cost-item">
                <span>Family loading</span>
                <span>${estimate.familyFee.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="cost-estimate-totals">
            <div className="cost-total-row">
              <span>Monthly</span>
              <span className="cost-total-amount">${estimate.monthlyPremium.toFixed(2)}</span>
            </div>

            {estimate.isYearly ? (
              <>
                {estimate.discountPercent > 0 && (
                  <div className="cost-total-row cost-total-sub">
                    <span>Yearly (before discount)</span>
                    <span>${estimate.yearlyBeforeDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="cost-total-row cost-total-highlight">
                  <span>
                    Yearly total
                    {estimate.discountPercent > 0 && ` (−${estimate.discountPercent}%)`}
                  </span>
                  <span className="cost-total-amount">${estimate.yearlyAfterDiscount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="cost-total-row cost-total-sub">
                <span>Yearly (est.)</span>
                <span>${estimate.yearlyBeforeDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <p className="cost-estimate-disclaimer">
            * Estimate only. Final price is calculated on submission.
          </p>
        </>
      )}
    </aside>
  );
}

export default function QuoteFormFields({ initialValues, onSubmit, submitLabel = "Save Quote" }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  const needsApplicant2 = form.cover_type === "Couple" || form.cover_type === "Family";
  const isYearly = form.payment_frequency === "Yearly";

  /** Scroll to the first visible error element inside the form */
  const scrollToFirstError = useCallback(() => {
    // Use a short timeout so React has time to render the error classes / error-box
    setTimeout(() => {
      if (!formRef.current) return;
      const firstError =
        formRef.current.querySelector(".error-box") ||
        formRef.current.querySelector(".input-error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        // If it's a focusable input/select, also focus it for accessibility
        if (typeof firstError.focus === "function" && firstError.tagName !== "DIV") {
          firstError.focus({ preventScroll: true });
        }
      }
    }, 50);
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear the error for this field as the user types
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      scrollToFirstError();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      // Backend validation failure (defence in depth) – show as a general error
      setErrors({ _general: err.details && err.details.length ? err.details.join(" ") : err.message });
      scrollToFirstError();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="quote-form-layout">
      <form className="quote-form" onSubmit={handleSubmit} ref={formRef} noValidate>
        {errors._general && (
          <div className="error-box">
            <strong>{errors._general}</strong>
          </div>
        )}

        <fieldset>
          <legend>Customer</legend>
          <label>
            Customer name
            <input
              type="text"
              className={errors.customer_name ? "input-error" : ""}
              value={form.customer_name}
              onChange={(e) => update("customer_name", e.target.value)}
              required
            />
            <FieldError message={errors.customer_name} />
          </label>

          <label>
            Cover type
            <select
              value={form.cover_type}
              onChange={(e) => update("cover_type", e.target.value)}
            >
              <option value="Single">Single</option>
              <option value="Couple">Couple</option>
              <option value="Family">Family</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Applicant 1</legend>
          <label>
            Age (18-100)
            <input
              type="number"
              min="18"
              max="100"
              className={errors.applicant1_age ? "input-error" : ""}
              value={form.applicant1_age}
              onChange={(e) => update("applicant1_age", e.target.value)}
              required
            />
            <FieldError message={errors.applicant1_age} />
          </label>
          <label>
            Hospital cover history
            <select
              className={errors.applicant1_cover_history ? "input-error" : ""}
              value={form.applicant1_cover_history}
              onChange={(e) => update("applicant1_cover_history", e.target.value)}
            >
              <option value="">Select...</option>
              {HISTORY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <FieldError message={errors.applicant1_cover_history} />
          </label>
        </fieldset>

        {/* Applicant 2 fields only render for Couple / Family - React conditional rendering */}
        {needsApplicant2 && (
          <fieldset>
            <legend>Applicant 2</legend>
            <label>
              Age (18-100)
              <input
                type="number"
                min="18"
                max="100"
                className={errors.applicant2_age ? "input-error" : ""}
                value={form.applicant2_age}
                onChange={(e) => update("applicant2_age", e.target.value)}
                required
              />
              <FieldError message={errors.applicant2_age} />
            </label>
            <label>
              Hospital cover history
              <select
                className={errors.applicant2_cover_history ? "input-error" : ""}
                value={form.applicant2_cover_history}
                onChange={(e) => update("applicant2_cover_history", e.target.value)}
              >
                <option value="">Select...</option>
                {HISTORY_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <FieldError message={errors.applicant2_cover_history} />
            </label>
          </fieldset>
        )}

        <fieldset>
          <legend>Cover selection</legend>

          <div className="cover-picker-group">
            <span className="cover-picker-label">Hospital cover level</span>
            <div className="cover-picker">
              {HOSPITAL_OPTIONS.map((o) => (
                <label
                  key={o}
                  className={`cover-card${form.hospital_cover === o ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="hospital_cover"
                    value={o}
                    checked={form.hospital_cover === o}
                    onChange={(e) => update("hospital_cover", e.target.value)}
                  />
                  <span className="cover-card-name">{o}</span>
                  <span className="cover-card-price">{formatPrice(HOSPITAL_PRICES[o])}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="cover-picker-group">
            <span className="cover-picker-label">Extras cover level</span>
            <div className="cover-picker">
              {EXTRAS_OPTIONS.map((o) => (
                <label
                  key={o}
                  className={`cover-card${form.extras_cover === o ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="extras_cover"
                    value={o}
                    checked={form.extras_cover === o}
                    onChange={(e) => update("extras_cover", e.target.value)}
                  />
                  <span className="cover-card-name">{o}</span>
                  <span className="cover-card-price">{formatPrice(EXTRAS_PRICES[o])}</span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Payment</legend>
          <label>
            Payment frequency
            <select
              value={form.payment_frequency}
              onChange={(e) => update("payment_frequency", e.target.value)}
            >
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </label>

          {/* Discount field only relevant/shown for Yearly */}
          {isYearly && (
            <label>
              Annual-payment discount % (0-10)
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                className={errors.annual_discount ? "input-error" : ""}
                value={form.annual_discount}
                onChange={(e) => update("annual_discount", e.target.value)}
                required
              />
              <FieldError message={errors.annual_discount} />
            </label>
          )}
        </fieldset>

        <fieldset>
          <legend>Notes</legend>
          <label>
            Notes (optional)
            <textarea
              value={form.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
            />
          </label>
        </fieldset>

        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </form>

      <CostEstimate form={form} />
    </div>
  );
}
