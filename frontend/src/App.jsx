import { Link, Route, Routes } from "react-router-dom";
import QuoteList from "./pages/QuoteList";
import QuoteNew from "./pages/QuoteNew";
import QuoteDetail from "./pages/QuoteDetail";
import QuoteEdit from "./pages/QuoteEdit";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          HealthCoverSim
        </Link>
        <p className="tagline">Private Health Insurance Quote Simulator (learning demo only)</p>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<QuoteList />} />
          <Route path="/new" element={<QuoteNew />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/quotes/:id/edit" element={<QuoteEdit />} />
        </Routes>
      </main>
    </div>
  );
}
