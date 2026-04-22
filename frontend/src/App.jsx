import { useEffect, useState } from "react";
import IdeaForm from "./components/IdeaForm";
import IdeaList from "./components/IdeaList";
import { createIdea, fetchIdeas, voteIdea } from "./services/ideaApi";

function App() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadIdeas = async () => {
    try {
      setError("");
      const data = await fetchIdeas();
      setIdeas(data);
    } catch (err) {
      setError(err.message || "Unexpected error.");
    }
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const handleSubmit = async (payload) => {
    setError("");

    if (!payload.title.trim() || !payload.description.trim()) {
      setError("Title and description are required.");
      return false;
    }

    setLoading(true);
    try {
      await createIdea(payload);
      await loadIdeas();
      return true;
    } catch (err) {
      setError(err.message || "Unexpected error.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (ideaId) => {
    setError("");
    try {
      await voteIdea(ideaId);
      await loadIdeas();
    } catch (err) {
      setError(err.message || "Unexpected error.");
    }
  };

  return (
    <main className="container">
      <header className="page-header">
        <h1>Socratix</h1>
        <p>Share and vote on ideas quickly.</p>
      </header>

      <IdeaForm onSubmit={handleSubmit} loading={loading} />

      {error && <p className="error">{error}</p>}

      <IdeaList ideas={ideas} onVote={handleVote} />
    </main>
  );
}

export default App;
