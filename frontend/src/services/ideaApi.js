const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const toError = (fallbackMessage) => (error) => {
  if (error instanceof Error && error.message) {
    return error;
  }
  return new Error(fallbackMessage);
};

export const fetchIdeas = async () => {
  try {
    const response = await fetch(`${API_BASE}/ideas`);
    if (!response.ok) {
      throw new Error("Failed to fetch ideas.");
    }
    return await response.json();
  } catch (error) {
    throw toError("Unexpected error while loading ideas.")(error);
  }
};

export const createIdea = async (payload) => {
  try {
    const response = await fetch(`${API_BASE}/ideas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create idea.");
    }
  } catch (error) {
    throw toError("Unexpected error while creating idea.")(error);
  }
};

export const voteIdea = async (ideaId) => {
  try {
    const response = await fetch(`${API_BASE}/ideas/${ideaId}/vote`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to vote idea.");
    }
  } catch (error) {
    throw toError("Unexpected error while voting.")(error);
  }
};
