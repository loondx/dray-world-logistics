import { Text, View } from "@react-pdf/renderer";

import { PDF_COLORS, pdf } from "../styles";
import type { PdfPayItem } from "../types";

const W = { description: "32%", notes: "30%", quantity: "12%", rate: "13%", amount: "13%" } as const;
const divider = { borderRightWidth: 0.75, borderRightColor: PDF_COLORS.border };

export function PdfPayItems({
  items,
  total,
  currency = "USD",
}: {
  items: PdfPayItem[];
  total: string;
  currency?: string;
}) {
  return (
    <View wrap={false}>
      <View style={pdf.tableHeader}>
        <Text style={{ width: W.description, paddingLeft: 5 }}>Description</Text>
        <Text style={{ width: W.notes, paddingLeft: 5 }}>Notes</Text>
        <Text style={{ width: W.quantity, textAlign: "right", paddingRight: 5 }}>Quantity</Text>
        <Text style={{ width: W.rate, textAlign: "right", paddingRight: 5 }}>Rate</Text>
        <Text style={{ width: W.amount, textAlign: "right", paddingRight: 5 }}>Amount</Text>
      </View>
      {items.map((item, index) => (
        <View key={index} style={[pdf.box, pdf.row, { marginBottom: 3 }]}>
          <Text style={[pdf.cell, { width: W.description }, divider]}>{item.description}</Text>
          <Text style={[pdf.cell, { width: W.notes }, divider]}>{item.notes}</Text>
          <Text style={[pdf.cell, { width: W.quantity, textAlign: "right" }, divider]}>{item.quantity}</Text>
          <Text style={[pdf.cell, { width: W.rate, textAlign: "right" }, divider]}>{item.rate}</Text>
          <Text style={[pdf.cell, { width: W.amount, textAlign: "right" }]}>{item.amount}</Text>
        </View>
      ))}
      <View style={[pdf.row, { justifyContent: "space-between", paddingHorizontal: 5, marginTop: 2 }]}>
        <Text style={[pdf.bold, { fontSize: 10 }]}>Total ({currency})</Text>
        <Text style={[pdf.bold, { fontSize: 10 }]}>{total}</Text>
      </View>
    </View>
  );
}
