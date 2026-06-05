import React from "react";
import { AnalyticalTable, Button, Tag } from "@ui5/webcomponents-react";

const statusColor = { Paid: "8", Unpaid: "1", Pending: "6" };

function InvoiceTable({ invoices, onPay, showPayButton = true }) {
  const columns = [
    { Header: "ID",          accessor: "id",          width: 110 },
    { Header: "Fournisseur", accessor: "vendor",      width: 180 },
    { Header: "Description", accessor: "description", width: 220 },
    {
      Header: "Montant",
      accessor: "amount",
      width: 150,
      Cell: ({ value, row }) => `${value.toLocaleString()} ${row.original.currency}`,
    },
    { Header: "Date",   accessor: "date",   width: 120 },
    {
      Header: "Statut",
      accessor: "status",
      width: 120,
      Cell: ({ value }) => <Tag colorScheme={statusColor[value]}>{value}</Tag>,
    },
    ...(showPayButton ? [{
      Header: "Action",
      accessor: "action",
      width: 120,
      Cell: ({ row }) =>
        row.original.status === "Unpaid" ? (
          <Button design="Emphasized" onClick={() => onPay(row.original.id)}>
            Payer
          </Button>
        ) : null,
    }] : []),
  ];

  return (
    <AnalyticalTable
      data={invoices}
      columns={columns}
      visibleRows={8}
      alternateRowColor
      filterable
      sortable
    />
  );
}

export default InvoiceTable;