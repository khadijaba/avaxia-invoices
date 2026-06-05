import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginAPI } from "../services/api";
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

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { token, user } = await loginAPI(username, password);
      login(token, user);
      navigate(user.role === "ADMIN" ? "/admin" : "/dashboard");
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
            subtitleText="Plateforme de Gestion des Factures SAP"
          />
        }
        style={{ width: "400px", padding: "16px" }}
      >
        <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "16px", padding: "16px" }}>

          <Title level="H4">Connexion</Title>

          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "6px" }}>
            <Label required>Nom d'utilisateur</Label>
            <Input
              placeholder="admin ou user"
              value={username}
              onInput={(e) => setUsername(e.target.value)}
              style={{ width: "100%" }}
            />
          </FlexBox>

          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "6px" }}>
            <Label required>Mot de passe</Label>
            <Input
              type="Password"
              placeholder="••••••••"
              value={password}
              onInput={(e) => setPassword(e.target.value)}
              style={{ width: "100%" }}
            />
          </FlexBox>

          {error && (
            <MessageStrip design="Negative" hideCloseButton>
              {error}
            </MessageStrip>
          )}

          <Button
            design="Emphasized"
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </Button>

          <MessageStrip design="Information" hideCloseButton>
            Admin : admin / admin123 | User : user / user123
          </MessageStrip>

        </FlexBox>
      </Card>
    </FlexBox>
  );
}

export default Login;