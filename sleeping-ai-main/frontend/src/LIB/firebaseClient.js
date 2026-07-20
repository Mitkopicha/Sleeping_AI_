const KEY = "user";

export function saveUserLocally(user) {
  sessionStorage.setItem(KEY, JSON.stringify(user));
}

export function getUserLocal() {
  const raw = sessionStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearUserLocal() {
  sessionStorage.removeItem(KEY);
}

export function isLoggedInLocal() {
  return !!getUserLocal();
}
