import { Link, Route, Routes } from "react-router-dom";
import { UserProvider, useUser } from "./UserContext";
import QuoteList from "./pages/QuoteList";
import QuoteNew from "./pages/QuoteNew";
import QuoteDetail from "./pages/QuoteDetail";
import QuoteEdit from "./pages/QuoteEdit";
import Login from "./pages/Login";

function AuthenticatedApp() {
  const { userName, logout } = useUser();

  if (!userName) return <Login />;

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          HealthCoverSim
        </Link>
        <div className="header-user">
          <span className="header-user-name">{userName}</span>
          <button className="header-logout" onClick={logout}>
            Log out
          </button>
        </div>
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

export default function App() {
  return (
    <UserProvider>
      <AuthenticatedApp />
    </UserProvider>
  );
}
