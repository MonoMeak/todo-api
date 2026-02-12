const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

const email = `auth-test-${Date.now()}@example.com`;
const password = "secret123";
const name = "Auth Test";

const cookieJar = new Map();

const toHeaderCookie = () => {
  if (cookieJar.size === 0) {
    return undefined;
  }

  return Array.from(cookieJar.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
};

const storeCookies = (response) => {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) {
    return;
  }

  const [cookiePart] = setCookie.split(";");
  const separatorIndex = cookiePart.indexOf("=");
  if (separatorIndex === -1) {
    return;
  }

  const name = cookiePart.slice(0, separatorIndex).trim();
  const value = cookiePart.slice(separatorIndex + 1).trim();

  if (!name || !value) {
    return;
  }

  cookieJar.set(name, value);
};

const request = async (path, options = {}) => {
  const cookieHeader = toHeaderCookie();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  storeCookies(response);

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return { response, body };
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async () => {
  console.log(`Using API: ${API_BASE_URL}`);

  const registerResult = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });

  assert(
    registerResult.response.status === 201,
    `Register failed: ${registerResult.response.status} ${JSON.stringify(registerResult.body)}`,
  );
  assert(registerResult.body?.access_token, "Register missing access_token");
  assert(registerResult.body?.user?.email === email, "Register user payload mismatch");

  const accessToken = registerResult.body.access_token;

  const meResult = await request("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  assert(
    meResult.response.status === 200,
    `GET /auth/me failed: ${meResult.response.status} ${JSON.stringify(meResult.body)}`,
  );

  const refreshResult = await request("/auth/refresh", {
    method: "POST",
  });

  assert(
    refreshResult.response.status === 200,
    `POST /auth/refresh failed: ${refreshResult.response.status} ${JSON.stringify(refreshResult.body)}`,
  );
  assert(refreshResult.body?.access_token, "Refresh missing access_token");

  const logoutResult = await request("/auth/logout", {
    method: "POST",
  });

  assert(
    logoutResult.response.status === 200,
    `POST /auth/logout failed: ${logoutResult.response.status} ${JSON.stringify(logoutResult.body)}`,
  );

  const refreshAfterLogoutResult = await request("/auth/refresh", {
    method: "POST",
  });

  assert(
    refreshAfterLogoutResult.response.status === 401,
    `Refresh after logout should be 401 but got ${refreshAfterLogoutResult.response.status}`,
  );

  console.log("Auth smoke test passed.");
  console.log(`Registered and validated user: ${email}`);
};

run().catch((error) => {
  console.error("Auth smoke test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
