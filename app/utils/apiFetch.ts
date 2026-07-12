import { refreshAccessToken } from "./auth";

interface ApiFetchOptions extends RequestInit {
  retry?: boolean;
}

export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
) {
  const token = localStorage.getItem("chatAppToken");

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
  });

  if (res.ok) return res;

  let data: any = null;
  try {
    data = await res.clone().json();
  } catch {}

  // 🔁 token expired → refresh once
  if (data?.code === "TOKEN_EXPIRED" && !options.retry) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      logout();
      throw new Error("Session expired");
    }

    return apiFetch(url, { ...options, retry: true });
  }

  return res;
}

function logout() {
  localStorage.removeItem("chatAppToken");
  window.location.href = "/pages/login";
}
