import { useState } from "react";

const HOSPITAL_OPTIONS = ["None", "Basic", "Bronze", "Silver", "Gold"];
const EXTRAS_OPTIONS = ["None", "Basic", "Standard", "Premium"];
const HISTORY_OPTIONS = ["Yes", "No", "Not sure"];

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
 */
function validate(form) {
  const errors = [];
  if (!form.customer_name.trim()) errors.push("Customer name is required.");

  const age1 = Number(form.applicant1_age);
  if (!form.applicant1_age || Number.isNaN(age1) || age1 < 18 || age1 > 100) {
    errors.push("Applicant 1 age must be between 18 and 100.");
  }
  if (!form.applicant1_cover_history) {
    errors.push("Applicant 1 hospital cover history is required.");
  }

  const needsApplicant2 = form.cover_type === "Couple" || form.cover_type === "Family";
  if (needsApplicant2) {
    const age2 = Number(form.applicant2_age);
    if (!form.applicant2_age || Number.isNaN(age2) || age2 < 18 || age2 > 100) {
      errors.push("Applicant 2 age must be between 18 and 100.");
    }
    if (!form.applicant2_cover_history) {
      errors.push("Applicant 2 hospital cover history is required.");
    }
  }

  if (form.payment_frequency === "Yearly") {
    const d = Number(form.annual_discount);
    if (form.annual_discount === "" || Number.isNaN(d) || d < 0 || d > 10) {
      errors.push("Annual discount must be between 0 and 10 (%) for yearly payment.");
    }
  }

  return errors;
}

export default function QuoteFormFields({ initialValues, onSubmit, submitLabel = "Save Quote" }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const needsApplicant2 = form.cover_type === "Couple" || form.cover_type === "Family";
  const isYearly = form.payment_frequency === "Yearly";

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (clientErrors.length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      // Backend validation failure (defence in depth)
      setErrors(err.details && err.details.length ? err.details : [err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="quote-form" onSubmit={handleSubmit} noValidate>
      {errors.length > 0 && (
        <div className="error-box">
          <strong>Please fix the following:</strong>
          <ul>
            {errors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <fieldset>
        <legend>Customer</legend>
        <label>
          Customer name
          <input
            type="text"
            value={form.customer_name}
            onChange={(e) => update("customer_name", e.target.value)}
            required
          />
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
            value={form.applicant1_age}
            onChange={(e) => update("applicant1_age", e.target.value)}
            required
          />
        </label>
        <label>
          Hospital cover history
          <select
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
              value={form.applicant2_age}
              onChange={(e) => update("applicant2_age", e.target.value)}
              required
            />
          </label>
          <label>
            Hospital cover history
            <select
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
          </label>
        </fieldset>
      )}

      <fieldset>
        <legend>Cover selection</legend>
        <label>
          Hospital cover level
          <select
            value={form.hospital_cover}
            onChange={(e) => update("hospital_cover", e.target.value)}
          >
            {HOSPITAL_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          Extras cover level
          <select
            value={form.extras_cover}
            onChange={(e) => update("extras_cover", e.target.value)}
          >
            {EXTRAS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
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
              value={form.annual_discount}
              onChange={(e) => update("annual_discount", e.target.value)}
              required
            />
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
  );
}
