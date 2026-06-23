import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordAPI } from "../services/api";
import {
  FlexBox,
  FlexBoxDirection,
  Input,
  Button,
  Label,
  MessageStrip,
} from "@ui5/webcomponents-react";

function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!identifier.trim()) {
      setError("Please enter your User ID or email address");
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordAPI(identifier.trim());
      setSuccess(
        "If an account exists with this User ID / email, you will receive a password reset link shortly."
      );
      // Redirection après 5 secondes
      setTimeout(() => navigate("/login"), 5000);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* En-tête SAP Sales Cloud */}
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

        {/* Formulaire de réinitialisation */}
        <div style={styles.formBody}>
          <div style={styles.headerText}>
            <h2 style={styles.title}>Reset your password</h2>
            <p style={styles.subtitle}>
              Enter your User ID or email address and we'll send you a link to reset your password.
            </p>
          </div>

          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "8px" }}>
            <Label required style={styles.fieldLabel}>
              User ID or Email
            </Label>
            <Input
              placeholder="e.g., john.doe@company.com or johndoe"
              value={identifier}
              onInput={(e) => setIdentifier(e.target.value)}
              onKeyDown={handleKey}
              style={styles.inputField}
            />
          </FlexBox>

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

          <Button
            design="Emphasized"
            onClick={handleSubmit}
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>

          <div style={styles.actionLinks}>
            <button onClick={() => navigate("/login")} style={styles.linkButton}>
              Back to Sign In
            </button>
            <span style={styles.divider}>|</span>
            <button onClick={() => navigate("/register")} style={styles.linkButton}>
              Create an account
            </button>
          </div>

          <div style={styles.contactHint}>
            If you continue to experience issues, please contact your system administrator.
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
  headerText: {
    textAlign: "center",
    marginBottom: "8px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#1e2a3e",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "13px",
    color: "#5f6c80",
    margin: 0,
    lineHeight: 1.5,
  },
  fieldLabel: {
    color: "#1e2a3e",
    fontWeight: "600",
    fontSize: "13px",
  },
  inputField: {
    width: "100%",
  },
  submitButton: {
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
  contactHint: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "11px",
    color: "#7a879b",
    textAlign: "center",
    border: "1px solid #e9ecef",
    marginTop: "8px",
  },
};

// Hover CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  button:hover {
    text-decoration: underline;
  }
`;
document.head.appendChild(styleSheet);

export default ForgotPassword;