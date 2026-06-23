import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import { getInvoicesAPI, getLogsAPI, getHistAPI, getRoutinesAPI } from "../services/api";
import {
  FlexBox, FlexBoxDirection, FlexBoxJustifyContent, FlexBoxAlignItems,
  Title, Button, BusyIndicator, Input, Select, Option, Icon,
  Table, TableHeaderRow, TableHeaderCell, TableRow, TableCell,
  ObjectStatus, Text, Card, CardHeader,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/refresh.js";
import "@ui5/webcomponents-icons/dist/excel-attachment.js";
import "@ui5/webcomponents-icons/dist/line-chart.js";
import "@ui5/webcomponents-icons/dist/cart.js";
import "@ui5/webcomponents-icons/dist/lead.js";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/complete.js";
import "@ui5/webcomponents-icons/dist/alert.js";
import "@ui5/webcomponents-icons/dist/trend-up.js";
import "@ui5/webcomponents-icons/dist/trend-down.js";
import "@ui5/webcomponents-icons/dist/manager.js";
import "@ui5/webcomponents-icons/dist/calendar.js";
import "@ui5/webcomponents-icons/dist/log.js";
import "@ui5/webcomponents-icons/dist/history.js";
import "@ui5/webcomponents-icons/dist/search.js";
import "@ui5/webcomponents-icons/dist/action-settings.js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

const statusState = { Paid: "Positive", Unpaid: "Negative", Pending: "Critical" };

// Construit la clé "YYYY-MM" utilisée pour trier et filtrer par mois
function monthKeyOf(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function EmptyState({ icon, title, subtitle }) {
  const { palette } = useTheme();
  return (
    <FlexBox direction={FlexBoxDirection.Column} alignItems={FlexBoxAlignItems.Center} style={{ padding: "40px 20px", textAlign: "center" }}>
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

export default function AdminDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [logs, setLogs]         = useState([]);
  const [hist, setHist]         = useState([]);
  const [routines, setRoutines] = useState([]);
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [periodFrom, setPeriodFrom] = useState("All");
  const [periodTo, setPeriodTo]     = useState("All");
  const { token } = useAuth();
  const navigate  = useNavigate();
  const { isDark, palette } = useTheme();

  useEffect(() => {
    Promise.all([
      getInvoicesAPI(token),
      getLogsAPI(token),
      getHistAPI(token),
      getRoutinesAPI(token),
    ]).then(([inv, lg, hs, rt]) => {
      setInvoices(inv);
      setLogs(lg);
      setHist(hs);
      setRoutines(rt);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  // Liste des mois disponibles dans les données, pour peupler le filtre de période
  const availableMonths = useMemo(() => {
    const map = new Map();
    invoices.forEach(inv => {
      const key = monthKeyOf(inv.date);
      if (!map.has(key)) {
        map.set(key, new Date(inv.date).toLocaleString("fr-FR", { month: "long", year: "numeric" }));
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, label]) => ({ key, label }));
  }, [invoices]);

  // Toutes les données affichées (KPI, graphiques, tableau) découlent de cette liste filtrée par période
  const periodInvoices = useMemo(() => {
    if (periodFrom === "All" && periodTo === "All") return invoices;
    return invoices.filter(inv => {
      const key = monthKeyOf(inv.date);
      if (periodFrom !== "All" && key < periodFrom) return false;
      if (periodTo !== "All" && key > periodTo) return false;
      return true;
    });
  }, [invoices, periodFrom, periodTo]);

  const resetPeriod = () => { setPeriodFrom("All"); setPeriodTo("All"); };

  const stats = useMemo(() => {
    const totalAmount  = periodInvoices.reduce((s, i) => s + (i.amount || 0), 0);
    const paidAmount   = periodInvoices.filter(i => i.status === "Paid").reduce((s, i) => s + (i.amount || 0), 0);
    const unpaidAmount = periodInvoices.filter(i => i.status === "Unpaid").reduce((s, i) => s + (i.amount || 0), 0);
    const countByStatus = {
      Paid:    periodInvoices.filter(i => i.status === "Paid").length,
      Unpaid:  periodInvoices.filter(i => i.status === "Unpaid").length,
      Pending: periodInvoices.filter(i => i.status === "Pending").length,
    };
    return { totalAmount, paidAmount, unpaidAmount, countByStatus };
  }, [periodInvoices]);

  const topSuppliers = useMemo(() => {
    const vendorMap = new Map();
    periodInvoices.forEach(inv => {
      vendorMap.set(inv.vendor, (vendorMap.get(inv.vendor) || 0) + (inv.amount || 0));
    });
    return Array.from(vendorMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [periodInvoices]);

  // Données mensuelles triées chronologiquement (nécessaire pour un graphique d'évolution fiable
  // et pour calculer les tendances mois vs mois précédent)
  const monthlyData = useMemo(() => {
    const monthMap = new Map();
    periodInvoices.forEach(inv => {
      const monthKey  = monthKeyOf(inv.date);
      const monthName = new Date(inv.date).toLocaleString("fr-FR", { month: "short", year: "numeric" });
      const current   = monthMap.get(monthKey) || { monthKey, month: monthName, total: 0, paid: 0, unpaid: 0 };
      current.total  += (inv.amount || 0);
      if (inv.status === "Paid")   current.paid   += (inv.amount || 0);
      if (inv.status === "Unpaid") current.unpaid += (inv.amount || 0);
      monthMap.set(monthKey, current);
    });
    return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [periodInvoices]);

  // Variation par rapport au mois précédent, pour les indicateurs de tendance des cartes KPI
  const trends = useMemo(() => {
    if (monthlyData.length < 2) return { total: null, paid: null, unpaid: null, rate: null };
    const curr = monthlyData[monthlyData.length - 1];
    const prev = monthlyData[monthlyData.length - 2];
    const pctChange = (c, p) => (p === 0 ? null : ((c - p) / p) * 100);
    const currRate = curr.total > 0 ? (curr.paid / curr.total) * 100 : 0;
    const prevRate = prev.total > 0 ? (prev.paid / prev.total) * 100 : 0;
    return {
      total: pctChange(curr.total, prev.total),
      paid: pctChange(curr.paid, prev.paid),
      unpaid: pctChange(curr.unpaid, prev.unpaid),
      rate: currRate - prevRate,
    };
  }, [monthlyData]);

  const pieData = [
    { name: "Payées",     value: stats.countByStatus.Paid,    color: "#2e7d32" },
    { name: "Non payées", value: stats.countByStatus.Unpaid,  color: "#c62828" },
    { name: "En attente", value: stats.countByStatus.Pending, color: "#e65100" },
  ].filter(d => d.value > 0);

  const filtered = periodInvoices
    .filter(i => filter === "All" || i.status === filter)
    .filter(i =>
      (i.vendor?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (i.id?.toLowerCase() || "").includes(search.toLowerCase())
    );

  const payRate = stats.totalAmount > 0
    ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="avaxia-dashboard" style={{ minHeight: "100vh", background: palette.pageBg }}>
      <style>{`
        [data-theme="dark"] .avaxia-dashboard .recharts-text,
        [data-theme="dark"] .avaxia-dashboard .recharts-cartesian-axis-tick-value,
        [data-theme="dark"] .avaxia-dashboard .recharts-legend-item-text,
        [data-theme="dark"] .avaxia-dashboard .recharts-pie-label-text {
          fill: #9aa0a8 !important;
        }
        [data-theme="dark"] .avaxia-dashboard .recharts-cartesian-axis-line,
        [data-theme="dark"] .avaxia-dashboard .recharts-cartesian-axis-tick-line {
          stroke: #3a3f48 !important;
        }
      `}</style>
      <Navbar />
      <div style={{ padding: "16px 24px" }}>

        <FlexBox justifyContent={FlexBoxJustifyContent.SpaceBetween} alignItems={FlexBoxAlignItems.Center} style={{ marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: "12px" }}>
            <Title level="H2" style={{ color: palette.textPrimary }}>
              Plateforme d'Intégration et de Gestion des Factures SAP
            </Title>
            <RoleBadge />
          </FlexBox>
          <FlexBox style={{ gap: "8px" }}>
            <Button icon="refresh" design="Transparent" onClick={() => window.location.reload()}>Actualiser</Button>
            <Button icon="excel-attachment" design="Default">Exporter</Button>
          </FlexBox>
        </FlexBox>

        {/* Filtre de période global : s'applique aux KPI, graphiques et tableau */}
        <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: "6px" }}>
            <Icon name="calendar" style={{ color: palette.textSecondary, width: "16px", height: "16px" }} />
            <Text style={{ fontSize: "13px", color: palette.textSecondary, fontWeight: "600" }}>Période :</Text>
          </FlexBox>
          <Select onChange={e => setPeriodFrom(e.detail.selectedOption.value)} style={{ width: "180px" }}>
            <Option value="All" selected={periodFrom === "All"}>Depuis le début</Option>
            {availableMonths.map(m => (
              <Option key={m.key} value={m.key} selected={periodFrom === m.key}>{m.label}</Option>
            ))}
          </Select>
          <Text style={{ fontSize: "13px", color: palette.textSecondary }}>à</Text>
          <Select onChange={e => setPeriodTo(e.detail.selectedOption.value)} style={{ width: "180px" }}>
            <Option value="All" selected={periodTo === "All"}>Jusqu'à aujourd'hui</Option>
            {availableMonths.map(m => (
              <Option key={m.key} value={m.key} selected={periodTo === m.key}>{m.label}</Option>
            ))}
          </Select>
          {(periodFrom !== "All" || periodTo !== "All") && (
            <Button design="Transparent" onClick={resetPeriod}>Réinitialiser</Button>
          )}
        </FlexBox>

        <FlexBox style={{ gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <KpiCard
            title="Montant total facturé"
            value={`${stats.totalAmount.toLocaleString()} TND`}
            color="#0064d9"
            icon="money-bills"
            trendValue={trends.total}
          />
          <KpiCard
            title="Factures payées"
            value={`${stats.paidAmount.toLocaleString()} TND`}
            color="#2e7d32"
            icon="complete"
            trendValue={trends.paid}
          />
          <KpiCard
            title="Factures impayées"
            value={`${stats.unpaidAmount.toLocaleString()} TND`}
            color="#c62828"
            icon="alert"
            trendValue={trends.unpaid}
            trendInvert
          />
          <KpiCard
            title="Taux de paiement"
            value={`${payRate}%`}
            color="#1b70b9"
            icon="line-chart"
            trendValue={trends.rate}
            trendSuffix=" pts"
          />
        </FlexBox>

        <FlexBox style={{ gap: "24px", marginBottom: "32px", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: "300px", background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: "12px", padding: "16px" }}>
            <Title level="H4" style={{ marginBottom: "16px" }}>Top 5 fournisseurs</Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSuppliers}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fill: palette.chartAxis, fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v / 1000}K`} tick={{ fill: palette.chartAxis, fontSize: 12 }} />
                <Tooltip
                  formatter={v => `${v.toLocaleString()} TND`}
                  contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}` }}
                  labelStyle={{ color: palette.textPrimary }}
                  itemStyle={{ color: palette.textPrimary }}
                />
                <Legend wrapperStyle={{ color: palette.textSecondary }} />
                <Bar dataKey="revenue" fill="#0a6ed1" name="Montant (TND)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, minWidth: "260px", background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: "12px", padding: "16px" }}>
            <Title level="H4" style={{ marginBottom: "16px" }}>Répartition par statut</Title>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: palette.chartGrid }}
                  dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}` }} labelStyle={{ color: palette.textPrimary }} itemStyle={{ color: palette.textPrimary }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 2, minWidth: "300px", background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: "12px", padding: "16px" }}>
            <Title level="H4" style={{ marginBottom: "16px" }}>Évolution mensuelle</Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} />
                <XAxis dataKey="month" tick={{ fill: palette.chartAxis, fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v / 1000}K`} tick={{ fill: palette.chartAxis, fontSize: 12 }} />
                <Tooltip
                  formatter={v => `${v.toLocaleString()} TND`}
                  contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}` }}
                  labelStyle={{ color: palette.textPrimary }}
                  itemStyle={{ color: palette.textPrimary }}
                />
                <Legend wrapperStyle={{ color: palette.textSecondary }} />
                <Line type="monotone" dataKey="total"  stroke="#0064d9" name="Total"  strokeWidth={2} />
                <Line type="monotone" dataKey="paid"   stroke="#2e7d32" name="Payé"   strokeWidth={2} />
                <Line type="monotone" dataKey="unpaid" stroke="#c62828" name="Impayé" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </FlexBox>

        {/* Tableau Factures */}
        <Card header={<CardHeader titleText="Toutes les factures" subtitleText="Gestion détaillée" />}>
          <div style={{ padding: "16px" }}>
            <FlexBox style={{ gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <Input placeholder="Rechercher par ID ou fournisseur..." value={search}
                  onInput={e => setSearch(e.target.value)} showClearIcon style={{ width: "100%" }} />
              </div>
              <Select onChange={e => setFilter(e.detail.selectedOption.value)} style={{ width: "200px" }}>
                <Option value="All">Tous les statuts</Option>
                <Option value="Paid">Payées</Option>
                <Option value="Unpaid">Non payées</Option>
                <Option value="Pending">En attente</Option>
              </Select>
            </FlexBox>
            {loading ? (
              <BusyIndicator active style={{ margin: "40px auto" }} />
            ) : filtered.length === 0 ? (
              <EmptyState icon="search" title="Aucune facture trouvée" subtitle="Essayez de modifier votre recherche ou vos filtres." />
            ) : (
              <Table headerRow={
                <TableHeaderRow sticky>
                  <TableHeaderCell style={{ width: "180px" }}>Facture</TableHeaderCell>
                  <TableHeaderCell style={{ width: "200px" }}>Fournisseur</TableHeaderCell>
                  <TableHeaderCell style={{ width: "250px" }}>Description</TableHeaderCell>
                  <TableHeaderCell style={{ width: "150px" }}>Montant</TableHeaderCell>
                  <TableHeaderCell style={{ width: "120px" }}>Date</TableHeaderCell>
                  <TableHeaderCell style={{ width: "130px" }}>Statut</TableHeaderCell>
                  <TableHeaderCell style={{ width: "130px" }}>Action</TableHeaderCell>
                </TableHeaderRow>
              }>
                {filtered.map(inv => (
                  <TableRow key={inv.id} navigated onClick={() => navigate(`/invoice/${inv.id}`)} style={{ cursor: "pointer" }}>
                    <TableCell><Text style={{ fontWeight: "700" }}>{inv.id}</Text></TableCell>
                    <TableCell><Text>{inv.vendor}</Text></TableCell>
                    <TableCell><Text>{inv.description}</Text></TableCell>
                    <TableCell><Text style={{ fontWeight: "700" }}>{(inv.amount || 0).toLocaleString()} {inv.currency}</Text></TableCell>
                    <TableCell><Text>{inv.date}</Text></TableCell>
                    <TableCell>
                      <ObjectStatus state={statusState[inv.status] || "None"} inverted>{statusLabel(inv.status)}</ObjectStatus>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Button design="Transparent" onClick={() => navigate(`/invoice/${inv.id}`)}>Détail</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </div>
        </Card>

        {/* Tableau Log */}
        <Card header={<CardHeader titleText="Journal des actions (Log)" subtitleText="Traçabilité complète" />}
              style={{ marginTop: "24px" }}>
          <div style={{ padding: "16px" }}>
            {logs.length === 0 ? (
              <EmptyState
                icon="log"
                title="Aucun appel enregistré pour le moment"
                subtitle="Les appels aux interfaces Pay, Get et Check apparaîtront ici avec leur résultat, dès qu'ils seront exécutés."
              />
            ) : (
              <Table headerRow={
                <TableHeaderRow sticky>
                  <TableHeaderCell style={{ width: "200px" }}>Action</TableHeaderCell>
                  <TableHeaderCell style={{ width: "200px" }}>Facture</TableHeaderCell>
                  <TableHeaderCell style={{ width: "200px" }}>Utilisateur</TableHeaderCell>
                  <TableHeaderCell style={{ width: "200px" }}>Date</TableHeaderCell>
                  <TableHeaderCell style={{ width: "150px" }}>Résultat</TableHeaderCell>
                </TableHeaderRow>
              }>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell><ObjectStatus state="Information" inverted>{log.action}</ObjectStatus></TableCell>
                    <TableCell><Text style={{ fontWeight: "700" }}>{log.invoiceId}</Text></TableCell>
                    <TableCell><Text>{log.userId}</Text></TableCell>
                    <TableCell><Text style={{ color: palette.textSecondary }}>{new Date(log.timestamp).toLocaleString('fr-FR')}</Text></TableCell>
                    <TableCell>
                      <ObjectStatus state={log.result === "SUCCESS" ? "Positive" : "Negative"} inverted>
                        {log.result}
                      </ObjectStatus>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </div>
        </Card>

        {/* Tableau Hist */}
        <Card header={<CardHeader titleText="Historique des factures (Hist)" subtitleText="Cycle de vie des factures" />}
              style={{ marginTop: "24px" }}>
          <div style={{ padding: "16px" }}>
            {hist.length === 0 ? (
              <EmptyState
                icon="history"
                title="Aucun historique pour le moment"
                subtitle="Les changements de statut des factures (création, mise à jour, paiement) seront tracés ici."
              />
            ) : (
              <Table headerRow={
                <TableHeaderRow sticky>
                  <TableHeaderCell style={{ width: "200px" }}>Facture</TableHeaderCell>
                  <TableHeaderCell style={{ width: "150px" }}>Ancien statut</TableHeaderCell>
                  <TableHeaderCell style={{ width: "150px" }}>Nouveau statut</TableHeaderCell>
                  <TableHeaderCell style={{ width: "200px" }}>Modifié par</TableHeaderCell>
                  <TableHeaderCell style={{ width: "200px" }}>Date</TableHeaderCell>
                </TableHeaderRow>
              }>
                {hist.map(h => (
                  <TableRow key={h.id}>
                    <TableCell><Text style={{ fontWeight: "700" }}>{h.invoiceId}</Text></TableCell>
                    <TableCell><ObjectStatus state={statusState[h.oldStatus] || "None"} inverted>{statusLabel(h.oldStatus)}</ObjectStatus></TableCell>
                    <TableCell><ObjectStatus state={statusState[h.newStatus] || "None"} inverted>{statusLabel(h.newStatus)}</ObjectStatus></TableCell>
                    <TableCell><Text>{h.changedBy}</Text></TableCell>
                    <TableCell><Text style={{ color: palette.textSecondary }}>{new Date(h.changedAt).toLocaleString('fr-FR')}</Text></TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </div>
        </Card>

        {/* Tableau Routine */}
        <Card header={<CardHeader titleText="Routines planifiées (Routine)" subtitleText="Planification et configuration opérationnelle" />}
              style={{ marginTop: "24px" }}>
          <div style={{ padding: "16px" }}>
            {routines.length === 0 ? (
              <EmptyState
                icon="action-settings"
                title="Aucune routine configurée"
                subtitle="Les tâches planifiées et configurations de facturation récurrente apparaîtront ici une fois définies."
              />
            ) : (
              <Table headerRow={
                <TableHeaderRow sticky>
                  <TableHeaderCell style={{ width: "200px" }}>Nom</TableHeaderCell>
                  <TableHeaderCell style={{ width: "220px" }}>Planification</TableHeaderCell>
                  <TableHeaderCell style={{ width: "130px" }}>Statut</TableHeaderCell>
                  <TableHeaderCell style={{ width: "200px" }}>Dernière exécution</TableHeaderCell>
                </TableHeaderRow>
              }>
                {routines.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><Text style={{ fontWeight: "700" }}>{r.name}</Text></TableCell>
                    <TableCell><Text>{r.schedule}</Text></TableCell>
                    <TableCell>
                      <ObjectStatus state={r.active ? "Positive" : "Negative"} inverted>
                        {r.active ? "Actif" : "Inactif"}
                      </ObjectStatus>
                    </TableCell>
                    <TableCell><Text style={{ color: palette.textSecondary }}>{r.lastRun ? new Date(r.lastRun).toLocaleString('fr-FR') : "—"}</Text></TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}

// Traduit les statuts internes (anglais, côté API) en libellés affichés en français,
// pour que l'interface reste cohérente de bout en bout.
function statusLabel(status) {
  const labels = { Paid: "Payée", Unpaid: "Non payée", Pending: "En attente" };
  return labels[status] || status;
}

function RoleBadge() {
  const { palette } = useTheme();
  return (
    <FlexBox alignItems={FlexBoxAlignItems.Center} style={{
      gap: "6px", background: palette.badgeBg, color: palette.badgeText, fontSize: "12px", fontWeight: "700",
      padding: "4px 12px", borderRadius: "999px", letterSpacing: "0.4px", textTransform: "uppercase",
    }}>
      <Icon name="manager" style={{ width: "13px", height: "13px" }} />
      Rôle administrateur
    </FlexBox>
  );
}

function TrendIndicator({ value, suffix = "%", invert = false }) {
  const { palette } = useTheme();
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <Text style={{ fontSize: "12px", color: palette.textTertiary, marginTop: "4px", display: "block" }}>Pas de mois précédent</Text>;
  }
  const isFlat = Math.abs(value) < 0.05;
  const isGood = invert ? value < 0 : value > 0;
  const color = isFlat ? palette.textSecondary : (isGood ? "#2e7d32" : "#c62828");
  const icon = isFlat ? null : (value > 0 ? "trend-up" : "trend-down");
  return (
    <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: "4px", marginTop: "6px" }}>
      {icon && <Icon name={icon} style={{ color, width: "13px", height: "13px" }} />}
      <Text style={{ fontSize: "12px", color, fontWeight: "600" }}>
        {value > 0 ? "+" : ""}{value.toFixed(1)}{suffix} vs mois précédent
      </Text>
    </FlexBox>
  );
}

function KpiCard({ title, value, color, icon, trendValue, trendSuffix, trendInvert }) {
  const { palette } = useTheme();
  return (
    <Card style={{ flex: 1, minWidth: "220px" }}>
      <div style={{ padding: "16px" }}>
        <FlexBox justifyContent={FlexBoxJustifyContent.SpaceBetween} alignItems={FlexBoxAlignItems.Center}>
          <Text style={{ fontSize: "13px", color: palette.textSecondary, fontWeight: "600" }}>{title}</Text>
          {icon && (
            <div style={{
              width: "30px", height: "30px", borderRadius: "8px", background: `${color}1A`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon name={icon} style={{ color, width: "16px", height: "16px" }} />
            </div>
          )}
        </FlexBox>
        <Text style={{ fontSize: "28px", fontWeight: "700", color: color || palette.textPrimary, marginTop: "8px", display: "block" }}>
          {value}
        </Text>
        <TrendIndicator value={trendValue} suffix={trendSuffix} invert={trendInvert} />
      </div>
    </Card>
  );
}
