import { useNavigate } from "react-router-dom";
import QuoteFormFields from "../components/QuoteFormFields";
import { api } from "../api";
import { useUser } from "../UserContext";

export default function QuoteNew() {
  const navigate = useNavigate();
  const { userName } = useUser();

  async function handleCreate(form) {
    const created = await api.create(form);
    navigate(`/quotes/${created.id}`);
  }

  return (
    <div>
      <h2>New Quote</h2>
      <QuoteFormFields
        initialValues={{ customer_name: userName }}
        onSubmit={handleCreate}
        submitLabel="Create Quote"
      />
    </div>
  );
}
