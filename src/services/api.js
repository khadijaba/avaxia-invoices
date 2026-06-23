const BASE_URL = 'http://localhost:4004';

// ── LOGIN ──
export async function loginAPI(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Identifiants incorrects');
  return { token: data.token, user: { role: data.role, name: data.name } };
}

// ── REGISTER ──
export async function registerAPI({ name, username, password }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'inscription');
  return { success: true, message: data.success };
}

// ── GET INVOICES ──
export async function getInvoicesAPI(token) {
  const res = await fetch(`${BASE_URL}/api/Invoices`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  return data.value || [];
}

// ── PAY INVOICE ──
export async function payInvoiceAPI(token, invoiceId) {
  const res = await fetch(`${BASE_URL}/api/Pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ invoiceId }),
  });
  return res.json();
}

// ── CHECK INVOICE ──
export async function checkInvoiceAPI(token, invoiceId) {
  const res = await fetch(`${BASE_URL}/api/Check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ invoiceId }),
  });
  return res.json();
}

// ── FORGOT PASSWORD ──
export async function forgotPasswordAPI(identifier) {
  return { success: true, message: "Si un compte existe, un lien de réinitialisation vous a été envoyé." };
}

export async function getLogsAPI(token) {
  const res = await fetch(`http://localhost:4004/api/Log`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  return data.value || [];
}

export async function getHistAPI(token) {
  const res = await fetch(`http://localhost:4004/api/Hist`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  return data.value || [];
}



// ── GET ROUTINES ──
export async function getRoutinesAPI(token) {
  const res = await fetch(`${BASE_URL}/api/Routine`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  return data.value || [];
}
