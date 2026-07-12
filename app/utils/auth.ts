export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`,
      {
        method: "POST",
        credentials: "include", // 🔴 required (cookie)
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("chatAppToken", data.token);
      return data.token;
    }

    return null;
  } catch (err) {
    console.error("Refresh token failed", err);
    return null;
  }
}
