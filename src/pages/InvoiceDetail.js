import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getInvoicesAPI, payInvoiceAPI } from "../services/api";
import {
  DynamicPage, DynamicPageTitle, DynamicPageHeader,
  ObjectPage, ObjectPageSection, ObjectPageSubSection,
  ObjectPageTitle, ObjectPageHeader,
  FlexBox, FlexBoxDirection, FlexBoxWrap, FlexBoxAlignItems,
  Title, Button, Text, MessageStrip, BusyIndicator,
  ObjectStatus, Tag, Card, CardHeader,
  FormItem, Form, FormGroup,
  Timeline, TimelineItem,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/money-bills.js";
import "@ui5/webcomponents-icons/dist/supplier.js";
import "@ui5/webcomponents-icons/dist/calendar.js";
import "@ui5/webcomponents-icons/dist/document-text.js";
import "@ui5/webcomponents-icons/dist/history.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import "@ui5/webcomponents-icons/dist/process.js";
import "@ui5/webcomponents-icons/dist/create-form.js";

const statusColor = { Paid: "8", Unpaid: "1", Pending: "6" };
const statusState = { Paid: "Positive", Unpaid: "Negative", Pending: "Critical" };

export default function InvoiceDetail() {
  const { id }                = useParams();
  const navigate              = useNavigate();
  const [inv, setInv]         = useState(null);
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

      {message && (
        <MessageStrip design="Positive" hideCloseButton style={{ margin: "0 32px" }}>
          {message}
        </MessageStrip>
      )}

      <ObjectPage
        style={{ height: "calc(100vh - 64px)" }}
        titleArea={
          <ObjectPageTitle
            heading={
              <Title level="H3" style={{ color: "#0064d9" }}>
                {inv.id}
              </Title>
            }
            subheading={
              <Text style={{ color: "#6a6d70", fontSize: "13px" }}>
                {inv.vendor} · {inv.date}
              </Text>
            }
            actionsBar={
              <FlexBox style={{ gap: "8px" }}>
                <Button design="Default" onClick={() => navigate(-1)}>
                  ← Retour
                </Button>
                {inv.status === "Unpaid" && (
                  <Button design="Emphasized" onClick={handlePay} disabled={paying}>
                    {paying ? "Paiement en cours..." : "Payer cette facture"}
                  </Button>
                )}
              </FlexBox>
            }
          />
        }
        headerArea={
          <ObjectPageHeader>
            <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: "32px", padding: "8px 0" }}>
              <HeaderStat icon="💰" label="Montant" value={`${inv.amount.toLocaleString()} ${inv.currency}`} bold />
              <HeaderStat icon="📅" label="Date"    value={inv.date} />
              <HeaderStat icon="🏢" label="Fournisseur" value={inv.vendor} />
              <HeaderStat icon="📊" label="Statut"  value={
                <ObjectStatus state={statusState[inv.status]} inverted>
                  {inv.status}
                </ObjectStatus>
              } />
            </FlexBox>
          </ObjectPageHeader>
        }
      >

        {/* Section 1 — Informations */}
        <ObjectPageSection
          id="info"
          titleText="Informations de la Facture"
        >
          <ObjectPageSubSection
            id="info-details"
            titleText="Détails"
          >
            <Card header={<CardHeader titleText="Détails de la Facture" subtitleText={inv.vendor} />}>
              <div style={{ padding: "20px" }}>
                <Form layout="S1 M2 L3 XL4" labelSpan="S12 M4 L4 XL4">
                  <FormGroup titleText="Identification">
                    <FormItem labelContent={<span style={styles.label}>Référence</span>}>
                      <Text style={styles.value}>{inv.id}</Text>
                    </FormItem>
                    <FormItem labelContent={<span style={styles.label}>Fournisseur</span>}>
                      <Text style={styles.value}>{inv.vendor}</Text>
                    </FormItem>
                    <FormItem labelContent={<span style={styles.label}>Description</span>}>
                      <Text style={styles.value}>{inv.description}</Text>
                    </FormItem>
                  </FormGroup>
                  <FormGroup titleText="Financier">
                    <FormItem labelContent={<span style={styles.label}>Montant</span>}>
                      <Text style={{ ...styles.value, fontWeight: "700", color: "#0064d9", fontSize: "18px" }}>
                        {inv.amount.toLocaleString()} {inv.currency}
                      </Text>
                    </FormItem>
                    <FormItem labelContent={<span style={styles.label}>Date</span>}>
                      <Text style={styles.value}>{inv.date}</Text>
                    </FormItem>
                    <FormItem labelContent={<span style={styles.label}>Statut</span>}>
                      <ObjectStatus state={statusState[inv.status]} inverted>
                        {inv.status}
                      </ObjectStatus>
                    </FormItem>
                  </FormGroup>
                </Form>
              </div>
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Section 2 — Historique */}
        <ObjectPageSection
          id="history"
          titleText="Historique"
        >
          <ObjectPageSubSection
            id="history-timeline"
            titleText="Cycle de vie"
          >
            <Card header={<CardHeader titleText="Historique de la Facture" />}>
              <div style={{ padding: "20px" }}>
                <Timeline>
                  <TimelineItem
                    name="Facture créée"
                    subtitleText={inv.date}
                    icon="create-form"
                    titleText="Facture créée"
                  >
                    <Text>La facture {inv.id} a été créée par {inv.vendor}.</Text>
                  </TimelineItem>

                  <TimelineItem
                    name="En traitement"
                    subtitleText="En cours"
                    icon="process"
                    titleText="En cours de traitement"
                  >
                    <Text>
                      {inv.status !== "Unpaid"
                        ? "La facture est en cours de traitement."
                        : "En attente de traitement."}
                    </Text>
                  </TimelineItem>

                  <TimelineItem
                    name="Paiement"
                    subtitleText={inv.status === "Paid" ? "Aujourd'hui" : "En attente"}
                    icon={inv.status === "Paid" ? "accept" : "history"}
                    titleText={inv.status === "Paid" ? "Paiement effectué ✅" : "Paiement en attente"}
                  >
                    <Text>
                      {inv.status === "Paid"
                        ? `La facture ${inv.id} a été payée avec succès.`
                        : "Le paiement n'a pas encore été effectué."}
                    </Text>
                  </TimelineItem>
                </Timeline>
              </div>
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>

        {/* Section 3 — Actions */}
        <ObjectPageSection
          id="actions"
          titleText="Actions"
        >
          <ObjectPageSubSection
            id="actions-pay"
            titleText="Actions disponibles"
          >
            <Card header={<CardHeader titleText="Actions sur la Facture" />}>
              <FlexBox style={{ padding: "20px", gap: "12px", flexWrap: "wrap" }}>
                <Button design="Default" onClick={() => navigate(-1)}>
                  ← Retour à la liste
                </Button>
                {inv.status === "Unpaid" && (
                  <Button design="Emphasized" onClick={handlePay} disabled={paying}>
                    {paying ? "Paiement en cours..." : "💳 Payer cette facture"}
                  </Button>
                )}
                {inv.status === "Paid" && (
                  <MessageStrip design="Positive" hideCloseButton>
                    ✅ Cette facture a déjà été payée.
                  </MessageStrip>
                )}
                {inv.status === "Pending" && (
                  <MessageStrip design="Warning" hideCloseButton>
                    ⏳ Cette facture est en attente de validation.
                  </MessageStrip>
                )}
              </FlexBox>
            </Card>
          </ObjectPageSubSection>
        </ObjectPageSection>

      </ObjectPage>
    </div>
  );
}

function HeaderStat({ icon, label, value, bold }) {
  return (
    <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "4px" }}>
      <Text style={{ fontSize: "12px", color: "#6a6d70", fontWeight: "600" }}>
        {icon} {label}
      </Text>
      {bold
        ? <Text style={{ fontSize: "16px", fontWeight: "700", color: "#0064d9" }}>{value}</Text>
        : <Text style={{ fontSize: "14px", color: "#32363a" }}>{value}</Text>
      }
    </FlexBox>
  );
}

const styles = {
  label: { fontSize: "13px", color: "#6a6d70", fontWeight: "600" },
  value: { fontSize: "14px", color: "#32363a" },
};