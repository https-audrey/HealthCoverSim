import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function QuoteList() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .list()
      .then(setQuotes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  if (loading) return <p>Loading quotes...</p>;
  if (error) return <p className="error-box">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Quotes</h2>
        <Link to="/new" className="button-link">
          + New Quote
        </Link>
      </div>

      {quotes.length === 0 ? (
        <p>No quotes yet. Create your first one.</p>
      ) : (
        <table className="quote-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Cover type</th>
              <th>Hospital</th>
              <th>Extras</th>
              <th>Frequency</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td>{q.customer_name}</td>
                <td>{q.cover_type}</td>
                <td>{q.hospital_cover}</td>
                <td>{q.extras_cover}</td>
                <td>{q.payment_frequency}</td>
                <td>{q.created_at}</td>
                <td>
                  <Link to={`/quotes/${q.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
