import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getInvoicesAPI } from "../services/api";
import {
  FlexBox, FlexBoxWrap,
  Card, CardHeader, AnalyticalCardHeader,
  Input, SegmentedButton, SegmentedButtonItem,
  Title, BusyIndicator, Button, Tag,
} from "@ui5/webcomponents-react";

const statusColor = { Paid: "8", Unpaid: "1", Pending: "6" };

export default function AdminDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getInvoicesAPI().then(setInvoices).finally(() => setLoading(false));
  }, []);

  const filtered = invoices
    .filter(i => filter === "All" || i.status === filter)
    .filter(i =>
      i.vendor.toLowerCase().includes(search.toLowerCase()) ||
      i.id.includes(search)
    );

  const paid    = invoices.filter(i => i.status === "Paid").length;
  const unpaid  = invoices.filter(i => i.status === "Unpaid").length;
  const pending = invoices.filter(i => i.status === "Pending").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f7" }}>
      <Navbar />
      <div style={{ padding: "24px 32px", maxWidth: "1300px", margin: "0 auto" }}>

        <Title level="H3" style={{ marginBottom: "24px", color: "#1a2e5a" }}>
          Tableau de bord Administrateur
        </Title>

        {/* KPI Cards */}
        <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: "16px", marginBottom: "24px" }}>
          <Card header={<AnalyticalCardHeader titleText="Total"      value={String(invoices.length)} />} style={{ flex: 1, minWidth: "160px" }} />
          <Card header={<AnalyticalCardHeader titleText="Payées"     value={String(paid)}    />}         style={{ flex: 1, minWidth: "160px" }} />
          <Card header={<AnalyticalCardHeader titleText="Impayées"   value={String(unpaid)}  />}         style={{ flex: 1, minWidth: "160px" }} />
          <Card header={<AnalyticalCardHeader titleText="En attente" value={String(pending)} />}         style={{ flex: 1, minWidth: "160px" }} />
        </FlexBox>

        {/* Tableau avec filtres */}
        <Card header={<CardHeader titleText="Toutes les Factures" />}>

          {/* Barre de filtres */}
          <FlexBox style={{ gap: "16px", padding: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <Input
              placeholder="🔍 Rechercher par fournisseur ou ID..."
              value={search}
              onInput={e => setSearch(e.target.value)}
              showClearIcon
              style={{ flex: 1, minWidth: "250px" }}
            />
            <SegmentedButton
              onSelectionChange={e => setFilter(e.detail.selectedItem.dataset.key)}
            >
              <SegmentedButtonItem data-key="All"     selected={filter === "All"}>Toutes</SegmentedButtonItem>
              <SegmentedButtonItem data-key="Paid"    selected={filter === "Paid"}>Payées</SegmentedButtonItem>
              <SegmentedButtonItem data-key="Unpaid"  selected={filter === "Unpaid"}>Impayées</SegmentedButtonItem>
              <SegmentedButtonItem data-key="Pending" selected={filter === "Pending"}>En attente</SegmentedButtonItem>
            </SegmentedButton>
          </FlexBox>

          {loading ? (
            <BusyIndicator active style={{ margin: "40px auto", display: "block" }} />
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  {["ID", "Fournisseur", "Description", "Montant", "Date", "Statut", "Détail"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={inv.id} style={{ ...styles.tr, background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                    <td style={styles.td}><strong>{inv.id}</strong></td>
                    <td style={styles.td}>{inv.vendor}</td>
                    <td style={styles.td}>{inv.description}</td>
                    <td style={styles.td}>{inv.amount.toLocaleString()} {inv.currency}</td>
                    <td style={styles.td}>{inv.date}</td>
                    <td style={styles.td}>
                      <Tag colorScheme={statusColor[inv.status]}>{inv.status}</Tag>
                    </td>
                    <td style={styles.td}>
                      <Button design="Transparent" onClick={() => navigate(`/invoice/${inv.id}`)}>
                        Voir détail
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
};