export const examples = {
  included: {
    quote: "Replace the kitchen tap. The price includes a new chrome tap, installation, and two new flexible supply hoses.",
    extra: "Charge separately for replacing the two flexible supply hoses during installation.",
    expected: "INCLUDED",
  },
  approval: {
    quote: "Replace the kitchen tap and reconnect it to the existing supply lines. Pipework inside the wall is explicitly excluded.",
    extra: "Open the wall and replace the damaged copper supply pipe inside it.",
    expected: "APPROVAL_REQUIRED",
  },
  unclear: {
    quote: "Kitchen sink repairs and associated plumbing as needed. Total: $250.",
    extra: "Replace the shutoff valve under the sink at an additional charge.",
    expected: "UNCLEAR",
  },
};

export const labels = {
  INCLUDED: "Included",
  APPROVAL_REQUIRED: "Approval required",
  UNCLEAR: "Unclear",
};

export function parseVerdict(raw) {
  const value = JSON.parse(raw);
  if (!value || !Object.hasOwn(labels, value.verdict) || typeof value.quote_excerpt !== "string" ||
      typeof value.explanation !== "string" || !value.explanation.trim()) {
    throw new Error("Invalid on-chain verdict.");
  }
  return value;
}

export function validateInput(quote, extra) {
  const quoteLength = [...quote.trim()].length;
  const extraLength = [...extra.trim()].length;
  return quoteLength >= 10 && quoteLength <= 2200 && extraLength >= 5 && extraLength <= 1000;
}
