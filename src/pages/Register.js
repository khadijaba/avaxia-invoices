import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerAPI } from "../services/api";
import {
  FlexBox,
  FlexBoxDirection,
  FlexBoxJustifyContent,
  FlexBoxAlignItems,
  Card,
  CardHeader,
  Input,
  Button,
  Label,
  MessageStrip,
  Title,
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

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await registerAPI({ name, username, password });
      setSuccess("Compte créé avec succès ! Redirection vers la connexion...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlexBox
      direction={FlexBoxDirection.Column}
      justifyContent={FlexBoxJustifyContent.Center}
      alignItems={FlexBoxAlignItems.Center}
      style={{ minHeight: "100vh", background: "#f5f6f7" }}
    >
      <Card
        header={
          <CardHeader
            titleText="AVAXIA Group"
            subtitleText="Créer un nouveau compte"
          />
        }
        style={{ width: "400px", padding: "16px" }}
      >
        <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "16px", padding: "16px" }}>

          <Title level="H4">Inscription</Title>

          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "6px" }}>
            <Label required>Nom complet</Label>
            <Input
              placeholder="Votre nom"
              value={name}
              onInput={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
            />
          </FlexBox>

          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "6px" }}>
            <Label required>Nom d'utilisateur</Label>
            <Input
              placeholder="Choisissez un identifiant"
              value={username}
              onInput={(e) => setUsername(e.target.value)}
              style={{ width: "100%" }}
            />
          </FlexBox>

          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "6px" }}>
            <Label required>Mot de passe</Label>
            <Input
              type="Password"
              placeholder="Au moins 6 caractères"
              value={password}
              onInput={(e) => setPassword(e.target.value)}
              style={{ width: "100%" }}
            />
          </FlexBox>

          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "6px" }}>
            <Label required>Confirmer le mot de passe</Label>
            <Input
              type="Password"
              placeholder="••••••••"
              value={confirm}
              onInput={(e) => setConfirm(e.target.value)}
              style={{ width: "100%" }}
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
            onClick={handleRegister}
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Création en cours..." : "Créer mon compte"}
          </Button>

          <Button
            design="Transparent"
            onClick={() => navigate("/login")}
            style={{ width: "100%" }}
          >
            Déjà un compte ? Se connecter
          </Button>

        </FlexBox>
      </Card>
    </FlexBox>
  );
}

export default Register;
