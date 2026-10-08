// api.js - thin wrapper around fetch for the /api/quotes endpoints

const BASE = "/api/quotes";

async function handle(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.details = data.details || [];
    throw err;
  }
  return data;
}

export const api = {
  list: (customerName) => {
    const url = customerName
      ? `${BASE}?customer_name=${encodeURIComponent(customerName)}`
      : BASE;
    return fetch(url).then(handle);
  },
  get: (id) => fetch(`${BASE}/${id}`).then(handle),
  create: (payload) =>
    fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),
  update: (id, payload) =>
    fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),
  remove: (id) => fetch(`${BASE}/${id}`, { method: "DELETE" }).then(handle),
};
