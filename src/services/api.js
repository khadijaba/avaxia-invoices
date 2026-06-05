import { mockInvoices } from "../mock/invoices";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Comptes "built-in" (démo). Le backend réel les remplacera plus tard.
const builtInUsers = [
  { username: "admin", password: "admin123", name: "Admin AVAXIA", role: "ADMIN" },
  { username: "user", password: "user123", name: "Khadija Ben Ayed", role: "USER" },
];

const REGISTERED_USERS_KEY = "registered_users";

function getRegisteredUsers() {
  const raw = localStorage.getItem(REGISTERED_USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveRegisteredUsers(users) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

function findUser(username) {
  const u = username.toLowerCase();
  return (
    builtInUsers.find((x) => x.username.toLowerCase() === u) ||
    getRegisteredUsers().find((x) => x.username.toLowerCase() === u)
  );
}

export async function registerAPI({ name, username, password }) {
  await delay(800);

  const cleanName = (name || "").trim();
  const cleanUsername = (username || "").trim();
  const cleanPassword = (password || "").trim();

  if (!cleanName || !cleanUsername || !cleanPassword) {
    throw new Error("Tous les champs sont obligatoires");
  }
  if (cleanPassword.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères");
  }
  if (findUser(cleanUsername)) {
    throw new Error("Ce nom d'utilisateur existe déjà");
  }

  const newUser = {
    username: cleanUsername,
    password: cleanPassword,
    name: cleanName,
    role: "USER",
  };

  const users = getRegisteredUsers();
  users.push(newUser);
  saveRegisteredUsers(users);

  return { success: true, message: "Compte créé avec succès" };
}

export async function loginAPI(username, password) {
  await delay(800);

  // Nettoyer les espaces accidentels
  const u = username.trim();
  const p = password.trim();

  const account = findUser(u);

  if (account && account.password === p) {
    return {
      token: `mock-jwt-${account.role.toLowerCase()}-token`,
      user: { name: account.name, role: account.role },
    };
  }

  throw new Error("Identifiants incorrects");
}

export async function getInvoicesAPI() {
  await delay(600);
  return mockInvoices;
}

export async function payInvoiceAPI(invoiceId) {
  await delay(1000);
  return { success: true, message: `Facture ${invoiceId} payée avec succès` };
}
