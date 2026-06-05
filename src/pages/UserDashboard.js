import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getInvoicesAPI, payInvoiceAPI } from "../services/api";
import {
  FlexBox, FlexBoxWrap,
  Card, CardHeader, AnalyticalCardHeader,
  Title, MessageStrip, BusyIndicator,
  Button, Tag,
} from "@ui5/webcomponents-react";

const statusColor = { Paid: "8", Unpaid: "1", Pending: "6" };

export default function UserDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [message, setMessage]   = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getInvoicesAPI().then(setInvoices).finally(() => setLoading(false));
  }, []);

  const handlePay = async (id) => {
    await payInvoiceAPI(id);
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "Paid" } : inv));
    setMessage(`Facture ${id} payée avec succès !`);
    setTimeout(() => setMessage(""), 3000);
  };

  const unpaid = invoices.filter(i => i.status === "Unpaid").length;
  const paid   = invoices.filter(i => i.status === "Paid").length;
  const total  = invoices.reduce((s, i) => s + i.amount, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f7" }}>
      <Navbar />
      <div style={{ padding: "24px 32px", maxWidth: "1200px", margin: "0 auto" }}>

        <Title level="H3" style={{ marginBottom: "24px", color: "#1a2e5a" }}>
          Mes Factures
        </Title>

        {/* KPI Cards */}
        <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: "16px", marginBottom: "24px" }}>
          <Card header={<AnalyticalCardHeader titleText="Total Factures" value={String(invoices.length)} />} style={{ flex: 1, minWidth: "180px" }} />
          <Card header={<AnalyticalCardHeader titleText="Payées"         value={String(paid)}            />} style={{ flex: 1, minWidth: "180px" }} />
          <Card header={<AnalyticalCardHeader titleText="Non Payées"     value={String(unpaid)}          />} style={{ flex: 1, minWidth: "180px" }} />
          <Card header={<AnalyticalCardHeader titleText="Montant Total"  value={total.toLocaleString()} unit="TND" />} style={{ flex: 1.5, minWidth: "220px" }} />
        </FlexBox>

        {/* Message succès */}
        {message && (
          <MessageStrip design="Positive" hideCloseButton style={{ marginBottom: "16px" }}>
            {message}
          </MessageStrip>
        )}

        {/* Tableau */}
        <Card header={<CardHeader titleText="Liste des Factures" />}>
          {loading ? (
            <BusyIndicator active style={{ margin: "40px auto", display: "block" }} />
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  {["ID", "Fournisseur", "Description", "Montant", "Date", "Statut", "Action"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id} style={{ ...styles.tr, background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                    <td style={styles.td}>
                      <span style={styles.idLink} onClick={() => navigate(`/invoice/${inv.id}`)}>
                        {inv.id}
                      </span>
                    </td>
                    <td style={styles.td}>{inv.vendor}</td>
                    <td style={styles.td}>{inv.description}</td>
                    <td style={styles.td}>{inv.amount.toLocaleString()} {inv.currency}</td>
                    <td style={styles.td}>{inv.date}</td>
                    <td style={styles.td}>
                      <Tag colorScheme={statusColor[inv.status]}>{inv.status}</Tag>
                    </td>
                    <td style={styles.td}>
                      {inv.status === "Unpaid" && (
                        <Button design="Emphasized" onClick={() => handlePay(inv.id)}>
                          Payer
                        </Button>
                      )}
                      <Button design="Transparent" onClick={() => navigate(`/invoice/${inv.id}`)}>
                        Détail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

      </div>
    </div>
  );
}

const styles = {
  table:    { width: "100%", borderCollapse: "collapse" },
  theadRow: { background: "#f0f4ff" },
  th:       { padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#1a2e5a" },
  tr:       { borderBottom: "1px solid #f0f0f0" },
  td:       { padding: "12px 16px", fontSize: "14px", color: "#444" },
  idLink:   { color: "#0070f2", fontWeight: "700", cursor: "pointer", textDecoration: "underline" },
};