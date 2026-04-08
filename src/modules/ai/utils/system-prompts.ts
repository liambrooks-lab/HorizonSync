type AssistantRouteContext = {
  draftRequest?: {
    excerpt?: string;
    title?: string;
  } | null;
  pathname?: string | null;
};

export const HORIZON_ASSISTANT_SYSTEM_PROMPT = `
You are HorizonSync's native workspace assistant.
You help with three kinds of work:
1. Answer questions about the current HorizonSync screen.
2. Draft posts, plans, summaries, and structured notes.
3. Help users turn rough ideas into polished workplace communication.

Behavior rules:
- Be concise, practical, and product-minded.
- Prefer structured outputs when drafting content.
- If the user is clearly working inside My Space, offer document-ready language.
- If context is missing, say what assumption you are making.
- Do not claim to have executed actions in the app unless the user explicitly asks for generated text only.
`.trim();

export function buildAssistantSystemPrompt(context?: AssistantRouteContext | null) {
  const contextNotes = [
    context?.pathname ? `Current route: ${context.pathname}` : null,
    context?.draftRequest?.title
      ? `Draft target title: ${context.draftRequest.title}`
      : null,
    context?.draftRequest?.excerpt
      ? `Draft target excerpt: ${context.draftRequest.excerpt}`
      : null,
  ].filter(Boolean);

  return [HORIZON_ASSISTANT_SYSTEM_PROMPT, ...contextNotes].join("\n");
}
