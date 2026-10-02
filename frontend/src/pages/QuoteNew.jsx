import { useNavigate } from "react-router-dom";
import QuoteFormFields from "../components/QuoteFormFields";
import { api } from "../api";

export default function QuoteNew() {
  const navigate = useNavigate();

  async function handleCreate(form) {
    const created = await api.create(form);
    navigate(`/quotes/${created.id}`);
  }

  return (
    <div>
      <h2>New Quote</h2>
      <QuoteFormFields onSubmit={handleCreate} submitLabel="Create Quote" />
    </div>
  );
}
