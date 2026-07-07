import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import { getInvoicesAPI, getLogsAPI, getHistAPI, getRoutinesAPI, getSapHealthAPI } from "../services/api";
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

// Couleurs distinctes par devise, utilisées dans les graphiques multi-devises
const CURRENCY_COLORS = { USD: "#0a6ed1", EUR: "#f0ab00", TND: "#2e7d32", GBP: "#8e44ad" };
const FALLBACK_COLORS = ["#0a6ed1", "#f0ab00", "#2e7d32", "#8e44ad", "#c0392b"];
function colorForCurrency(cur, idx) {
  return CURRENCY_COLORS[cur] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

// Construit la clé "YYYY-MM" utilisée pour trier et filtrer par mois
function monthKeyOf(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Formate un objet { USD: 3300, EUR: 45 } en "3 300 USD + 45 EUR"
function formatMultiCurrency(byCurrency, key) {
  const entries = Object.entries(byCurrency).filter(([, v]) => v[key] > 0);
  if (entries.length === 0) return "0";
  return entries.map(([cur, v]) => `${v[key].toLocaleString()} ${cur}`).join(" + ");
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
  const [sapStatus, setSapStatus] = useState({ connected: null, checkedAt: null });
  const [chartCurrency, setChartCurrency] = useState(null); // devise utilisée pour le graphique d'évolution mensuelle
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

  // Vérification périodique de la disponibilité de SAP ECC
  useEffect(() => {
    const checkHealth = () => {
      getSapHealthAPI().then(setSapStatus);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Devises réellement présentes dans les factures de la période sélectionnée
  const currencies = useMemo(() => {
    const set = new Set(periodInvoices.map(i => i.currency).filter(Boolean));
    return Array.from(set).sort();
  }, [periodInvoices]);

  // Sélectionne automatiquement une devise par défaut pour le graphique mensuel
  // dès que les devises disponibles changent (ex: changement de période)
  useEffect(() => {
    if (currencies.length > 0 && !currencies.includes(chartCurrency)) {
      setChartCurrency(currencies[0]);
    }
  }, [currencies, chartCurrency]);

  // ── Montants agrégés par devise (jamais mélangés entre eux) ──
  const statsByCurrency = useMemo(() => {
    const map = {};
    periodInvoices.forEach(inv => {
      const cur = inv.currency || "—";
      if (!map[cur]) map[cur] = { total: 0, paid: 0, unpaid: 0 };
      map[cur].total += (inv.amount || 0);
      if (inv.status === "Paid")   map[cur].paid   += (inv.amount || 0);
      if (inv.status === "Unpaid") map[cur].unpaid += (inv.amount || 0);
    });
    return map;
  }, [periodInvoices]);

  // Comptage par statut : indépendant de la devise, donc pas de risque de mélange
  const countByStatus = useMemo(() => ({
    Paid:    periodInvoices.filter(i => i.status === "Paid").length,
    Unpaid:  periodInvoices.filter(i => i.status === "Unpaid").length,
    Pending: periodInvoices.filter(i => i.status === "Pending").length,
  }), [periodInvoices]);

  // Taux de paiement : calculé sur le NOMBRE de factures (pas les montants),
  // pour rester valide même quand plusieurs devises coexistent.
  const totalCount = periodInvoices.length;
  const payRate = totalCount > 0 ? ((countByStatus.Paid / totalCount) * 100).toFixed(1) : "0.0";

  // ── Top 5 fournisseurs : classement par NOMBRE de factures (critère équitable
  // entre devises), puis répartition du montant par devise pour l'affichage empilé ──
  const topSuppliers = useMemo(() => {
    const vendorMap = new Map();
    periodInvoices.forEach(inv => {
      const key = inv.vendor || "—";
      if (!vendorMap.has(key)) vendorMap.set(key, { name: key, count: 0 });
      const entry = vendorMap.get(key);
      entry.count += 1;
      const cur = inv.currency || "—";
      entry[cur] = (entry[cur] || 0) + (inv.amount || 0);
    });
    return Array.from(vendorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [periodInvoices]);

  // ── Données mensuelles, décomposées par devise ──
  const monthlyDataAll = useMemo(() => {
    const monthMap = new Map();
    periodInvoices.forEach(inv => {
      const monthKey  = monthKeyOf(inv.date);
      const monthName = new Date(inv.date).toLocaleString("fr-FR", { month: "short", year: "numeric" });
      const cur = inv.currency || "—";
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { monthKey, month: monthName, byCurrency: {} });
      const entry = monthMap.get(monthKey);
      if (!entry.byCurrency[cur]) entry.byCurrency[cur] = { total: 0, paid: 0, unpaid: 0 };
      entry.byCurrency[cur].total  += (inv.amount || 0);
      if (inv.status === "Paid")   entry.byCurrency[cur].paid   += (inv.amount || 0);
      if (inv.status === "Unpaid") entry.byCurrency[cur].unpaid += (inv.amount || 0);
    });
    return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [periodInvoices]);

  // Données du graphique mensuel, filtrées sur la devise sélectionnée uniquement
  // (mélanger des devises différentes sur une même courbe n'aurait pas de sens)
  const monthlyDataForChart = useMemo(() => {
    return monthlyDataAll.map(m => ({
      month: m.month,
      monthKey: m.monthKey,
      total:  m.byCurrency[chartCurrency]?.total  || 0,
      paid:   m.byCurrency[chartCurrency]?.paid   || 0,
      unpaid: m.byCurrency[chartCurrency]?.unpaid || 0,
    }));
  }, [monthlyDataAll, chartCurrency]);

  // Comptage mensuel (indépendant de la devise), utilisé pour la tendance du taux de paiement
  const monthlyCounts = useMemo(() => {
    const map = new Map();
    periodInvoices.forEach(inv => {
      const key = monthKeyOf(inv.date);
      const entry = map.get(key) || { monthKey: key, total: 0, paid: 0 };
      entry.total += 1;
      if (inv.status === "Paid") entry.paid += 1;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [periodInvoices]);

  // Variation par rapport au mois précédent (basée sur la devise sélectionnée pour les montants,
  // et sur le nombre de factures pour le taux de paiement)
  const trends = useMemo(() => {
    const pctChange = (c, p) => (p === 0 ? null : ((c - p) / p) * 100);

    let amountTrends = { total: null, paid: null, unpaid: null };
    if (monthlyDataForChart.length >= 2) {
      const curr = monthlyDataForChart[monthlyDataForChart.length - 1];
      const prev = monthlyDataForChart[monthlyDataForChart.length - 2];
      amountTrends = {
        total:  pctChange(curr.total,  prev.total),
        paid:   pctChange(curr.paid,   prev.paid),
        unpaid: pctChange(curr.unpaid, prev.unpaid),
      };
    }

    let rateTrend = null;
    if (monthlyCounts.length >= 2) {
      const curr = monthlyCounts[monthlyCounts.length - 1];
      const prev = monthlyCounts[monthlyCounts.length - 2];
      const currRate = curr.total > 0 ? (curr.paid / curr.total) * 100 : 0;
      const prevRate = prev.total > 0 ? (prev.paid / prev.total) * 100 : 0;
      rateTrend = currRate - prevRate;
    }

    return { ...amountTrends, rate: rateTrend };
  }, [monthlyDataForChart, monthlyCounts]);

  const pieData = [
    { name: "Payées",     value: countByStatus.Paid,    color: "#2e7d32" },
    { name: "Non payées", value: countByStatus.Unpaid,  color: "#c62828" },
    { name: "En attente", value: countByStatus.Pending, color: "#e65100" },
  ].filter(d => d.value > 0);

  const filtered = periodInvoices
    .filter(i => filter === "All" || i.status === filter)
    .filter(i =>
      (i.vendor?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (i.id?.toLowerCase() || "").includes(search.toLowerCase())
    );

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
            <SapStatusBadge status={sapStatus} />
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
            value={formatMultiCurrency(statsByCurrency, "total")}
            color="#0064d9"
            icon="money-bills"
            trendValue={trends.total}
          />
          <KpiCard
            title="Factures payées"
            value={formatMultiCurrency(statsByCurrency, "paid")}
            color="#2e7d32"
            icon="complete"
            trendValue={trends.paid}
          />
          <KpiCard
            title="Factures impayées"
            value={formatMultiCurrency(statsByCurrency, "unpaid")}
            color="#c62828"
            icon="alert"
            trendValue={trends.unpaid}
            trendInvert
          />
          <KpiCard
            title="Taux de paiement"
            subtitle="basé sur le nombre de factures"
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
            <Text style={{ fontSize: "12px", color: palette.textSecondary, marginBottom: "8px", display: "block" }}>
              Classement par nombre de factures — montants empilés par devise
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSuppliers}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fill: palette.chartAxis, fontSize: 12 }} />
                <YAxis tick={{ fill: palette.chartAxis, fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [`${value.toLocaleString()} ${name}`, name]}
                  contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}` }}
                  labelStyle={{ color: palette.textPrimary }}
                  itemStyle={{ color: palette.textPrimary }}
                />
                <Legend wrapperStyle={{ color: palette.textSecondary }} />
                {currencies.map((cur, idx) => (
                  <Bar key={cur} dataKey={cur} stackId="amount" fill={colorForCurrency(cur, idx)} name={cur} />
                ))}
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
            <FlexBox justifyContent={FlexBoxJustifyContent.SpaceBetween} alignItems={FlexBoxAlignItems.Center} style={{ marginBottom: "16px" }}>
              <Title level="H4">Évolution mensuelle</Title>
              {currencies.length > 1 && (
                <Select onChange={e => setChartCurrency(e.detail.selectedOption.value)} style={{ width: "110px" }}>
                  {currencies.map(cur => (
                    <Option key={cur} value={cur} selected={chartCurrency === cur}>{cur}</Option>
                  ))}
                </Select>
              )}
            </FlexBox>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyDataForChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} />
                <XAxis dataKey="month" tick={{ fill: palette.chartAxis, fontSize: 12 }} />
                <YAxis tick={{ fill: palette.chartAxis, fontSize: 12 }} />
                <Tooltip
                  formatter={v => `${v.toLocaleString()} ${chartCurrency || ""}`}
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
                  <TableHeaderCell style={{ width: "160px" }}>Facture</TableHeaderCell>
                  <TableHeaderCell style={{ width: "180px" }}>Fournisseur</TableHeaderCell>
                  <TableHeaderCell style={{ width: "220px" }}>Description</TableHeaderCell>
                  <TableHeaderCell style={{ width: "120px" }}>Montant</TableHeaderCell>
                  <TableHeaderCell style={{ width: "90px" }}>Devise</TableHeaderCell>
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
                    <TableCell><Text style={{ fontWeight: "700" }}>{(inv.amount || 0).toLocaleString()}</Text></TableCell>
                    <TableCell><Text>{inv.currency}</Text></TableCell>
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

function SapStatusBadge({ status }) {
  const { palette } = useTheme();

  if (status.connected === null) {
    return (
      <FlexBox alignItems={FlexBoxAlignItems.Center} style={{
        gap: "6px", background: palette.badgeBg, color: palette.textSecondary, fontSize: "12px", fontWeight: "700",
        padding: "4px 12px", borderRadius: "999px",
      }}>
        Vérification...
      </FlexBox>
    );
  }

  const isUp = status.connected;
  const color = isUp ? "#2e7d32" : "#c62828";
  const bg = isUp ? "#2e7d321A" : "#c628281A";
  const label = isUp ? "SAP ECC : Connecté" : "SAP ECC : Injoignable";

  return (
    <FlexBox
      alignItems={FlexBoxAlignItems.Center}
      title={status.error || undefined}
      style={{
        gap: "6px", background: bg, color, fontSize: "12px", fontWeight: "700",
        padding: "4px 12px", borderRadius: "999px",
      }}
    >
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%", background: color,
        boxShadow: isUp ? `0 0 0 3px ${color}33` : "none",
      }} />
      {label}
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

function KpiCard({ title, subtitle, value, color, icon, trendValue, trendSuffix, trendInvert }) {
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
        <Text style={{ fontSize: "22px", fontWeight: "700", color: color || palette.textPrimary, marginTop: "8px", display: "block", lineHeight: "1.3" }}>
          {value}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: "11px", color: palette.textTertiary, display: "block", marginTop: "2px" }}>
            {subtitle}
          </Text>
        )}
        <TrendIndicator value={trendValue} suffix={trendSuffix} invert={trendInvert} />
      </div>
    </Card>
  );
}