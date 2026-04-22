import { useState } from "react";

function IdeaForm({ onSubmit, loading }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isSuccess = await onSubmit({ title, description });
    if (isSuccess) {
      setTitle("");
      setDescription("");
    }
  };

  return (
    <form className="card idea-form" onSubmit={handleSubmit}>
      <h2>Share an idea</h2>
      <input
        type="text"
        placeholder="Idea title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <textarea
        placeholder="Idea description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={4}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create idea"}
      </button>
    </form>
  );
}

export default IdeaForm;
