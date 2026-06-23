import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAPI } from "../services/api";
import {
  FlexBox,
  FlexBoxDirection,
  Input,
  Button,
  Label,
  MessageStrip,
} from "@ui5/webcomponents-react";

function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Full name is required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await registerAPI({ name, username, password });
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  const handleForgotPassword = () => {
    alert("Please contact your administrator to reset your password.");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* En-tête identique à la page de connexion SAP Sales Cloud */}
        <div style={styles.cardHeader}>
          <div style={styles.logoArea}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg"
              alt="SAP Logo"
              style={styles.sapLogo}
            />
            <span style={styles.salesCloudText}>Gestion des Factures SAP</span>
          </div>
          <div style={styles.languageSelector}>
            <span style={styles.languageText}>🌐 English</span>
          </div>
        </div>

        {/* Corps du formulaire d'inscription */}
        <div style={styles.formBody}>
          {/* Champ Nom complet */}
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "8px" }}>
            <Label required style={styles.fieldLabel}>
              Full Name
            </Label>
            <Input
              placeholder="Enter your full name"
              value={name}
              onInput={(e) => setName(e.target.value)}
              onKeyDown={handleKey}
              style={styles.inputField}
            />
          </FlexBox>

          {/* Champ Nom d'utilisateur */}
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "8px" }}>
            <Label required style={styles.fieldLabel}>
              User ID
            </Label>
            <Input
              placeholder="Choose a user ID"
              value={username}
              onInput={(e) => setUsername(e.target.value)}
              onKeyDown={handleKey}
              style={styles.inputField}
            />
          </FlexBox>

          {/* Champ Mot de passe */}
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "8px" }}>
            <Label required style={styles.fieldLabel}>
              Password
            </Label>
            <Input
              type="Password"
              placeholder="At least 6 characters"
              value={password}
              onInput={(e) => setPassword(e.target.value)}
              onKeyDown={handleKey}
              style={styles.inputField}
            />
          </FlexBox>

          {/* Champ Confirmation mot de passe */}
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "8px" }}>
            <Label required style={styles.fieldLabel}>
              Confirm Password
            </Label>
            <Input
              type="Password"
              placeholder="Re-enter your password"
              value={confirm}
              onInput={(e) => setConfirm(e.target.value)}
              onKeyDown={handleKey}
              style={styles.inputField}
            />
          </FlexBox>

          {/* Messages d'erreur / succès */}
          {error && (
            <MessageStrip design="Negative" hideCloseButton>
              {error}
            </MessageStrip>
          )}
          {success && (
            <MessageStrip design="Positive" hideCloseButton>
              {success}
            </MessageStrip>
          )}

          {/* Bouton de création de compte */}
          <Button
            design="Emphasized"
            onClick={handleRegister}
            disabled={loading}
            style={styles.signInButton}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>

          {/* Liens d'action : retour connexion + mot de passe oublié */}
          <div style={styles.actionLinks}>
            <button onClick={() => navigate("/login")} style={styles.linkButton}>
              Already have an account? Sign In
            </button>
            <span style={styles.divider}>|</span>
            <button onClick={handleForgotPassword} style={styles.linkButton}>
              Forgot Password?
            </button>
          </div>

          {/* Indication pour les tests (optionnel) */}
          <div style={styles.testHint}>
            <strong>Demo:</strong> Create any account (min 6 char password) or use login: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "sans-serif",
    padding: "16px",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 28px 12px 28px",
    borderBottom: "1px solid #e4e6ea",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sapLogo: {
    height: "32px",
    width: "auto",
  },
  salesCloudText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0a6ed1",
    letterSpacing: "0.5px",
  },
  languageSelector: {
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "20px",
    backgroundColor: "#f5f6f8",
    fontSize: "13px",
    color: "#1e2a3e",
  },
  languageText: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  formBody: {
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },
  fieldLabel: {
    color: "#1e2a3e",
    fontWeight: "600",
    fontSize: "13px",
  },
  inputField: {
    width: "100%",
  },
  signInButton: {
    width: "100%",
    backgroundColor: "#0070f2",
    border: "none",
    marginTop: "8px",
  },
  actionLinks: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    fontSize: "13px",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#0a6ed1",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    padding: "4px 0",
    transition: "color 0.2s",
  },
  divider: {
    color: "#b0b8c5",
  },
  testHint: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "12px",
    color: "#4a5b6e",
    textAlign: "center",
    border: "1px solid #e9ecef",
    marginTop: "8px",
  },
};

// Ajout d'un effet hover pour les liens
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  button:hover {
    text-decoration: underline;
  }
`;
document.head.appendChild(styleSheet);

export default Register;