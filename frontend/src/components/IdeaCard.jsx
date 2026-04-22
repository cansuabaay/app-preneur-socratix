function IdeaCard({ idea, onVote }) {
  return (
    <article className="card idea-card">
      <h3>{idea.title}</h3>
      <p>{idea.description}</p>
      <div className="idea-footer">
        <span className="idea-status">{idea.status}</span>
        <span>Oy: {idea.votes}</span>
        <button type="button" onClick={() => onVote(idea.id)}>
          Oy Ver
        </button>
      </div>
    </article>
  );
}

export default IdeaCard;

