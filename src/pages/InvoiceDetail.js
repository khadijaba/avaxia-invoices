import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getInvoicesAPI, payInvoiceAPI } from "../services/api";
import {
  Card, CardHeader,
  FlexBox, FlexBoxDirection, FlexBoxWrap,
  Title, Button, Tag,
  MessageStrip, BusyIndicator,
} from "@ui5/webcomponents-react";

const statusColor = { Paid: "8", Unpaid: "1", Pending: "6" };

export default function InvoiceDetail() {
  const { id }              = useParams();
  const navigate            = useNavigate();
  const [inv, setInv]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [paying, setPaying]   = useState(false);

  useEffect(() => {
    getInvoicesAPI().then(data => {
      setInv(data.find(i => i.id === id) || null);
    }).finally(() => setLoading(false));
  }, [id]);

  const handlePay = async () => {
    setPaying(true);
    await payInvoiceAPI(inv.id);
    setInv(prev => ({ ...prev, status: "Paid" }));
    setMessage("Facture payée avec succès !");
    setPaying(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f5f6f7" }}>
      <Navbar />
      <BusyIndicator active style={{ margin: "80px auto", display: "block" }} />
    </div>
  );

  if (!inv) return (
    <div style={{ minHeight: "100vh", background: "#f5f6f7" }}>
      <Navbar />
      <MessageStrip design="Negative" style={{ margin: "32px" }}>
        Facture introuvable.
      </MessageStrip>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f7" }}>
      <Navbar />
      <div style={{ padding: "24px 32px", maxWidth: "800px", margin: "0 auto" }}>

        {/* Bouton retour */}
        <Button design="Transparent" onClick={() => navigate(-1)} style={{ marginBottom: "16px" }}>
          ← Retour
        </Button>

        <Title level="H3" style={{ marginBottom: "20px", color: "#1a2e5a" }}>
          Détail Facture — {inv.id}
        </Title>

        {/* Message succès */}
        {message && (
          <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: "16px" }}>
            {message}
          </MessageStrip>
        )}

        {/* Infos principales */}
        <Card header={<CardHeader titleText="Informations de la Facture" subtitleText={inv.vendor} />}
              style={{ marginBottom: "16px" }}>
          <FlexBox wrap={FlexBoxWrap.Wrap} style={{ padding: "20px", gap: "24px" }}>
            <InfoItem label="Référence"    value={inv.id} />
            <InfoItem label="Fournisseur"  value={inv.vendor} />
            <InfoItem label="Description"  value={inv.description} />
            <InfoItem label="Montant"      value={`${inv.amount.toLocaleString()} ${inv.currency}`} bold />
            <InfoItem label="Date"         value={inv.date} />
            <InfoItem label="Statut"       value={<Tag colorScheme={statusColor[inv.status]}>{inv.status}</Tag>} />
          </FlexBox>
        </Card>

        {/* Historique */}
        <Card header={<CardHeader titleText="Historique de la Facture" />}
              style={{ marginBottom: "16px" }}>
          <FlexBox direction={FlexBoxDirection.Column} style={{ padding: "20px", gap: "16px" }}>
            <TimelineItem label="Facture créée"     date={inv.date} done />
            <TimelineItem label="En cours de traitement" date="—"  done={inv.status !== "Unpaid"} />
            <TimelineItem label="Paiement effectué" date={inv.status === "Paid" ? "Aujourd'hui" : "—"} done={inv.status === "Paid"} />
          </FlexBox>
        </Card>

        {/* Actions */}
        <Card>
          <FlexBox style={{ padding: "16px", gap: "12px" }}>
            <Button design="Default" onClick={() => navigate(-1)}>
              Retour à la liste
            </Button>
            {inv.status === "Unpaid" && (
              <Button design="Emphasized" onClick={handlePay} disabled={paying}>
                {paying ? "Paiement en cours..." : "💳 Payer cette facture"}
              </Button>
            )}
          </FlexBox>
        </Card>

      </div>
    </div>
  );
}

function InfoItem({ label, value, bold }) {
  return (
    <FlexBox direction={FlexBoxDirection.Column} style={{ minWidth: "200px", flex: 1 }}>
      <span style={{ fontSize: "12px", color: "#888", fontWeight: "600", marginBottom: "4px" }}>{label}</span>
      <span style={{ fontSize: "15px", color: "#1a2e5a", fontWeight: bold ? "700" : "400" }}>{value}</span>
    </FlexBox>
  );
}

function TimelineItem({ label, date, done }) {
  return (
    <FlexBox style={{ alignItems: "center", gap: "16px" }}>
      <div style={{
        width: "14px", height: "14px", borderRadius: "50%",
        background: done ? "#1a2e5a" : "#ddd",
        border: `2px solid ${done ? "#1a2e5a" : "#ccc"}`,
        flexShrink: 0,
      }} />
      <FlexBox direction={FlexBoxDirection.Column}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: done ? "#333" : "#aaa" }}>{label}</span>
        <span style={{ fontSize: "12px", color: "#888" }}>{date}</span>
      </FlexBox>
    </FlexBox>
  );
}