function getErrorMessage(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    Array.isArray(body.message)
  ) {
    return body.message
      .filter((message) => typeof message === "string")
      .join(", ");
  }

  return "The request could not be completed.";
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
