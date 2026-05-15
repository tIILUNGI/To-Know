type ApiFetchOptions = RequestInit & {
  noAuth?: boolean;
};

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  return envUrl?.trim() ? envUrl.trim().replace(/\/$/, "") : "/api";
};

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
};

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = getApiBaseUrl();
  return path.startsWith("/") ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { noAuth, headers, ...fetchOptions } = options;
  const authToken = !noAuth ? getAuthToken() : null;

  const response = await fetch(buildUrl(path), {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const errorMessage = body ? `${response.status} ${response.statusText}: ${body}` : `${response.status} ${response.statusText}`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return (response.text() as unknown) as T;
}

export async function login(username: string, password: string) {
  return apiFetch<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    noAuth: true,
  });
}

export async function getCurrentUser() {
  return apiFetch<any>("/auth/me");
}

export async function updateProfile(data: Record<string, any>) {
  return apiFetch<any>("/auth/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<any>("/auth/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
