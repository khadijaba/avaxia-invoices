import { mockInvoices } from "../mock/invoices";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function loginAPI(username, password) {
  await delay(800);

  // Nettoyer les espaces accidentels
  const u = username.trim();
  const p = password.trim();

  console.log("Login tenté avec :", u, p); // pour débugger

  if (u === "admin" && p === "admin123") {
    return {
      token: "mock-jwt-admin-token",
      user: { name: "Admin AVAXIA", role: "ADMIN" }
    };
  }

  if (u === "user" && p === "user123") {
    return {
      token: "mock-jwt-user-token",
      user: { name: "Khadija Ben Ayed", role: "USER" }
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