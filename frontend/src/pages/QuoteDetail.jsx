import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import ExplanationSheet from "../components/ExplanationSheet";

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(id).then(setQuote).catch((e) => setError(e.message));
  }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete the quote for ${quote.customer_name}? This cannot be undone.`)) return;
    await api.remove(id);
    navigate("/");
  }

  if (error) return <p className="error-box">{error}</p>;
  if (!quote) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Quote for {quote.customer_name}</h2>
        <div className="button-row">
          <Link to={`/quotes/${id}/edit`} className="button-link">
            Edit
          </Link>
          <button onClick={handleDelete} className="danger">
            Delete
          </button>
        </div>
      </div>

      <p className="meta">
        {quote.cover_type} cover · {quote.payment_frequency} payment · created {quote.created_at}
      </p>
      {quote.notes && <p className="notes">Notes: {quote.notes}</p>}

      <ExplanationSheet breakdown={quote.breakdown} />

      <p>
        <Link to="/">&larr; Back to all quotes</Link>
      </p>
    </div>
  );
}
