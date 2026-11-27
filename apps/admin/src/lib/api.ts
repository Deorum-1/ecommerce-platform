export function getErrorMessage(
  body: unknown,
  fallback = "The request could not be completed.",
): string {
  let message: string | undefined;
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    message = body.message;
  } else if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    Array.isArray(body.message)
  ) {
    message = body.message
      .filter((message) => typeof message === "string")
      .join(", ");
  }

  if (message?.includes("An active Clerk organization is required")) {
    return "Select or create a company workspace, then try again.";
  }

  return message || fallback;
}

export async function postWithClerkToken(
  path: string,
  token: string,
  body: Record<string, string>,
): Promise<unknown> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const result: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(result));
  }

  return result;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
