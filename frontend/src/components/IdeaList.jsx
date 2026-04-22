import IdeaCard from "./IdeaCard";

function IdeaList({ ideas, onVote }) {
  return (
    <section className="ideas">
      <h2>Ideas</h2>
      {ideas.length === 0 ? (
        <p className="card">No ideas yet. Be the first one to add one.</p>
      ) : (
        ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} onVote={onVote} />)
      )}
    </section>
  );
}

export default IdeaList;
