import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import { getInvoicesAPI, payInvoiceAPI } from "../services/api";

import {
  FlexBox,
  FlexBoxDirection,
  FlexBoxJustifyContent,
  FlexBoxAlignItems,
  Title,
  Button,
  MessageStrip,
  BusyIndicator,
  Input,
  Select,
  Option,
  Table,
  TableHeaderRow,
  TableHeaderCell,
  TableRow,
  TableCell,
  ObjectStatus,
  Text,
  Dialog,
  Icon,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/refresh.js";
import "@ui5/webcomponents-icons/dist/payment-approval.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import "@ui5/webcomponents-icons/dist/decline.js";
import "@ui5/webcomponents-icons/dist/pending.js";
import "@ui5/webcomponents-icons/dist/search.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/line-chart.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";

const statusState = {
  Paid: "Positive",
  Unpaid: "Negative",
  Pending: "Critical",
};

// Traduit les statuts internes (anglais, côté API) en libellés affichés en français,
// pour rester cohérent avec le reste de l'application (cf. AdminDashboard).
function statusLabel(status) {
  const labels = { Paid: "Payée", Unpaid: "Non payée", Pending: "En attente" };
  return labels[status] || status;
}

export default function UserDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "Positive" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [payingId, setPayingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const { palette } = useTheme();

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInvoicesAPI(token);
      setInvoices(data);
      setMessage({ text: "", type: "Positive" });
    } catch (err) {
      setMessage({ text: err.message, type: "Negative" });
      setTimeout(() => setMessage({ text: "", type: "Positive" }), 4000);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidCount = invoices.filter((inv) => inv.status === "Paid").length;
    const unpaidCount = invoices.filter((inv) => inv.status === "Unpaid").length;
    const pendingCount = invoices.filter((inv) => inv.status === "Pending").length;
    return { totalAmount, paidCount, unpaidCount, pendingCount, totalCount: invoices.length };
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => filter === "All" || inv.status === filter)
      .filter(
        (inv) =>
          inv.vendor?.toLowerCase().includes(search.toLowerCase()) ||
          inv.id?.toLowerCase().includes(search.toLowerCase())
      );
  }, [invoices, filter, search]);

  const handlePayClick = (invoice) => {
    setSelectedInvoice(invoice);
    setConfirmOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedInvoice) return;
    setConfirmOpen(false);
    setPayingId(selectedInvoice.id);
    try {
      await payInvoiceAPI(token, selectedInvoice.id);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoice.id ? { ...inv, status: "Paid" } : inv
        )
      );
      setMessage({ text: `Facture ${selectedInvoice.id} payée avec succès`, type: "Positive" });
      setTimeout(() => setMessage({ text: "", type: "Positive" }), 4000);
    } catch (err) {
      setMessage({ text: err.message, type: "Negative" });
      setTimeout(() => setMessage({ text: "", type: "Positive" }), 4000);
    } finally {
      setPayingId(null);
      setSelectedInvoice(null);
    }
  };

  const cancelPayment = () => {
    setConfirmOpen(false);
    setSelectedInvoice(null);
  };

  const groups = ["Unpaid", "Pending", "Paid"];
  const groupLabels = {
    Unpaid: "Non payées",
    Pending: "En attente",
    Paid: "Payées",
  };

  return (
    <div style={{ minHeight: "100vh", background: palette.pageBg }}>
      <Navbar />
      <div style={{ padding: "16px 24px" }}>

        <FlexBox justifyContent={FlexBoxJustifyContent.SpaceBetween} alignItems={FlexBoxAlignItems.Center} style={{ marginBottom: "8px", flexWrap: "wrap", gap: "12px" }}>
          <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: "12px" }}>
            <Title level="H2" style={{ color: "#0064d9" }}>
              Mes factures ({filtered.length})
            </Title>
            <RoleBadge />
          </FlexBox>
          <FlexBox style={{ gap: "8px" }}>
            <Button icon="refresh" design="Transparent" onClick={loadInvoices}>Actualiser</Button>
            <Button icon="payment-approval" design="Transparent">Aide</Button>
          </FlexBox>
        </FlexBox>
        <Text style={{ color: palette.textSecondary, fontSize: "13px", display: "block", marginBottom: "20px" }}>
          Consultez, filtrez et payez vos factures en ligne
        </Text>

        {/* KPI */}
        <FlexBox style={{ gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <UserKpiCard label="Total" value={stats.totalCount} icon="line-chart" color={palette.textPrimary} />
          <UserKpiCard label="Payées" value={stats.paidCount} icon="accept" color="#2e7d32" />
          <UserKpiCard label="Non payées" value={stats.unpaidCount} icon="decline" color="#c62828" />
          <UserKpiCard
            label="Montant total"
            value={`${stats.totalAmount.toLocaleString()} TND`}
            icon="money-bills"
            color="#0064d9"
          />
        </FlexBox>

        {/* Filtres */}
        <FlexBox style={{ gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
          <FlexBox style={{ flexDirection: "column", gap: "4px" }}>
            <Text style={{ fontSize: "12px", color: palette.textSecondary }}>Recherche</Text>
            <Input
              placeholder="ID facture ou fournisseur"
              value={search}
              onInput={(e) => setSearch(e.target.value)}
              showClearIcon
              style={{ width: "250px" }}
            />
          </FlexBox>

          <FlexBox style={{ flexDirection: "column", gap: "4px" }}>
            <Text style={{ fontSize: "12px", color: palette.textSecondary }}>Statut</Text>
            <Select
              onChange={(e) => setFilter(e.detail.selectedOption.value)}
              style={{ width: "180px" }}
            >
              <Option value="All" selected={filter === "All"}>Tous les statuts</Option>
              <Option value="Paid" selected={filter === "Paid"}>Payées</Option>
              <Option value="Unpaid" selected={filter === "Unpaid"}>Non payées</Option>
              <Option value="Pending" selected={filter === "Pending"}>En attente</Option>
            </Select>
          </FlexBox>
        </FlexBox>

        {message.text && (
          <MessageStrip design={message.type} hideCloseButton style={{ marginBottom: "16px" }}>
            {message.text}
          </MessageStrip>
        )}

        {loading ? (
          <BusyIndicator active style={{ margin: "60px auto", display: "block" }} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="Aucune facture ne correspond à vos critères"
            subtitle="Essayez de modifier votre recherche ou le filtre de statut."
          />
        ) : (
          groups.map((group) => {
            const items = filtered.filter((inv) => inv.status === group);
            if (items.length === 0) return null;
            return (
              <div key={group} style={{ marginBottom: "24px" }}>
                <Table
                  headerRow={
                    <TableHeaderRow sticky>
                      <TableHeaderCell style={{ width: "180px" }}>
                        {groupLabels[group]} ({items.length})
                      </TableHeaderCell>
                      <TableHeaderCell style={{ width: "200px" }}>Fournisseur</TableHeaderCell>
                      <TableHeaderCell style={{ width: "250px" }}>Description</TableHeaderCell>
                      <TableHeaderCell style={{ width: "150px" }}>Montant</TableHeaderCell>
                      <TableHeaderCell style={{ width: "120px" }}>Date</TableHeaderCell>
                      <TableHeaderCell style={{ width: "130px" }}>Statut</TableHeaderCell>
                      <TableHeaderCell style={{ width: "150px" }}>Action</TableHeaderCell>
                    </TableHeaderRow>
                  }
                >
                  {items.map((inv) => (
                    <TableRow
                      key={inv.id}
                      navigated
                      onClick={() => navigate(`/invoice/${inv.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <FlexBox style={{ flexDirection: "column" }}>
                          <Text style={{ fontWeight: "700", fontSize: "14px" }}>{inv.id}</Text>
                          <Text style={{ color: palette.textSecondary, fontSize: "12px" }}>{inv.vendor}</Text>
                        </FlexBox>
                      </TableCell>
                      <TableCell>{inv.vendor}</TableCell>
                      <TableCell>{inv.description}</TableCell>
                      <TableCell>
                        <Text style={{ fontWeight: "700" }}>
                          {(inv.amount || 0).toLocaleString()} {inv.currency}
                        </Text>
                      </TableCell>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell>
                        <ObjectStatus state={statusState[inv.status] || "None"} inverted>
                          {inv.status === "Paid" && <Icon name="accept" slot="icon" />}
                          {inv.status === "Unpaid" && <Icon name="decline" slot="icon" />}
                          {inv.status === "Pending" && <Icon name="pending" slot="icon" />}
                          {statusLabel(inv.status)}
                        </ObjectStatus>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {inv.status === "Unpaid" ? (
                          <Button
                            design="Emphasized"
                            onClick={() => handlePayClick(inv)}
                            disabled={payingId === inv.id}
                            style={{ minWidth: "100px" }}
                          >
                            {payingId === inv.id ? "Paiement..." : "Payer"}
                          </Button>
                        ) : (
                          <Button design="Transparent" onClick={() => navigate(`/invoice/${inv.id}`)}>
                            Détail
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              </div>
            );
          })
        )}
      </div>

      <Dialog
        open={confirmOpen}
        onClose={cancelPayment}
        headerText="Confirmation de paiement"
        style={{ width: "400px" }}
      >
        <div style={{ padding: "16px" }}>
          <Text>
            Voulez-vous vraiment payer la facture{" "}
            <strong>{selectedInvoice?.id}</strong> d'un montant de{" "}
            <strong>
              {selectedInvoice?.amount?.toLocaleString()} {selectedInvoice?.currency}
            </strong>
            ?
          </Text>
          <FlexBox style={{ justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
            <Button design="Transparent" onClick={cancelPayment}>Annuler</Button>
            <Button design="Emphasized" onClick={confirmPayment}>Confirmer</Button>
          </FlexBox>
        </div>
      </Dialog>
    </div>
  );
}

function RoleBadge() {
  const { palette } = useTheme();
  return (
    <FlexBox alignItems={FlexBoxAlignItems.Center} style={{
      gap: "6px", background: palette.badgeBg, color: palette.badgeText, fontSize: "12px", fontWeight: "700",
      padding: "4px 12px", borderRadius: "999px", letterSpacing: "0.4px", textTransform: "uppercase",
    }}>
      <Icon name="employee" style={{ width: "13px", height: "13px" }} />
      Rôle utilisateur
    </FlexBox>
  );
}

function EmptyState({ icon, title, subtitle }) {
  const { palette } = useTheme();
  return (
    <FlexBox direction={FlexBoxDirection.Column} alignItems={FlexBoxAlignItems.Center} style={{ padding: "60px 20px", textAlign: "center" }}>
      <div style={{
        width: "56px", height: "56px", borderRadius: "50%", background: palette.badgeBg,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
      }}>
        <Icon name={icon} style={{ width: "26px", height: "26px", color: palette.badgeText }} />
      </div>
      <Text style={{ fontWeight: "600", color: palette.textPrimary, marginBottom: "4px" }}>{title}</Text>
      <Text style={{ fontSize: "13px", color: palette.textSecondary, maxWidth: "360px" }}>{subtitle}</Text>
    </FlexBox>
  );
}

function UserKpiCard({ label, value, color = "#32363a", icon }) {
  const { palette } = useTheme();
  return (
    <div style={{
      flex: 1, minWidth: "200px", background: palette.cardBg, border: `1px solid ${palette.border}`,
      borderRadius: "12px", padding: "16px",
    }}>
      <FlexBox justifyContent={FlexBoxJustifyContent.SpaceBetween} alignItems={FlexBoxAlignItems.Center}>
        <Text style={{ fontSize: "13px", color: palette.textSecondary, fontWeight: "600" }}>{label}</Text>
        {icon && (
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px", background: `${color}1A`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name={icon} style={{ color, width: "16px", height: "16px" }} />
          </div>
        )}
      </FlexBox>
      <Text style={{ fontSize: "24px", fontWeight: "700", color, marginTop: "8px", display: "block" }}>
        {value}
      </Text>
    </div>
  );
}
