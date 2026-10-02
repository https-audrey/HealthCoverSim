import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QuoteFormFields from "../components/QuoteFormFields";
import { api } from "../api";

export default function QuoteEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(id).then(setQuote).catch((e) => setError(e.message));
  }, [id]);

  async function handleUpdate(form) {
    await api.update(id, form);
    navigate(`/quotes/${id}`);
  }

  if (error) return <p className="error-box">{error}</p>;
  if (!quote) return <p>Loading...</p>;

  // Coerce nulls to "" so controlled inputs don't warn, and stringify numbers
  const initialValues = {
    customer_name: quote.customer_name,
    cover_type: quote.cover_type,
    applicant1_age: String(quote.applicant1_age ?? ""),
    applicant1_cover_history: quote.applicant1_cover_history,
    applicant2_age: quote.applicant2_age != null ? String(quote.applicant2_age) : "",
    applicant2_cover_history: quote.applicant2_cover_history || "",
    hospital_cover: quote.hospital_cover,
    extras_cover: quote.extras_cover,
    payment_frequency: quote.payment_frequency,
    annual_discount: quote.annual_discount != null ? String(quote.annual_discount) : "",
    notes: quote.notes || "",
  };

  return (
    <div>
      <h2>Edit Quote for {quote.customer_name}</h2>
      <QuoteFormFields
        initialValues={initialValues}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
      />
    </div>
  );
}
