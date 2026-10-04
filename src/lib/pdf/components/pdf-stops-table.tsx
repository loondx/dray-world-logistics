import { Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { PDF_COLORS, pdf } from "../styles";
import type { PdfStop } from "../types";

const COLUMNS = { index: "5%", action: "12%", time: "21%", location: "32%", contact: "30%" } as const;

const divider = { borderRightWidth: 0.75, borderRightColor: PDF_COLORS.border };

// "Stops / Actions" table. `renderStopFooter` lets the BOL add signature boxes per stop.
export function PdfStopsTable({
  stops,
  renderStopFooter,
}: {
  stops: PdfStop[];
  renderStopFooter?: (stop: PdfStop) => ReactNode;
}) {
  return (
    <View>
      <View style={pdf.tableHeader}>
        <Text style={{ width: COLUMNS.index, paddingLeft: 4 }}>#</Text>
        <Text style={{ width: COLUMNS.action, paddingLeft: 5 }}>Action</Text>
        <Text style={{ width: COLUMNS.time, paddingLeft: 5 }}>Date/Time</Text>
        <Text style={{ width: COLUMNS.location, paddingLeft: 5 }}>Location</Text>
        <Text style={{ width: COLUMNS.contact, paddingLeft: 5 }}>Contact</Text>
      </View>

      {stops.map((stop) => (
        <View key={stop.sequence} style={[pdf.box, pdf.row, { marginBottom: 4 }]} wrap={false}>
          <View style={[{ width: COLUMNS.index, alignItems: "center", paddingTop: 5 }, divider]}>
            <Text>{stop.sequence}</Text>
          </View>
          <View style={{ width: "95%" }}>
            <View style={pdf.row}>
              <View style={[pdf.cell, { width: `${(12 / 95) * 100}%` }, divider]}>
                <Text style={pdf.bold}>{stop.action}</Text>
              </View>
              <View style={[pdf.cell, { width: `${(21 / 95) * 100}%` }, divider]}>
                <Text>{stop.appointment}</Text>
                {stop.appointmentNumber ? (
                  <Text style={{ marginTop: 2 }}>
                    <Text style={pdf.bold}>Appt #: </Text>
                    {stop.appointmentNumber}
                  </Text>
                ) : null}
              </View>
              <View style={[pdf.cell, { width: `${(32 / 95) * 100}%` }, divider]}>
                <Text style={pdf.bold}>{stop.locationName}</Text>
                {stop.addressLines.map((line) => (
                  <Text key={line}>{line}</Text>
                ))}
              </View>
              <View style={[pdf.cell, { width: `${(30 / 95) * 100}%` }]}>
                {stop.contact ? <Text>{stop.contact}</Text> : <Text style={pdf.muted}>-</Text>}
              </View>
            </View>
            {stop.references ? (
              <View style={[pdf.cell, { borderTopWidth: 0.75, borderTopColor: PDF_COLORS.border }]}>
                <Text>
                  <Text style={pdf.bold}>References: </Text>
                  {stop.references}
                </Text>
              </View>
            ) : null}
            {stop.instructions ? (
              <View style={[pdf.cell, { borderTopWidth: 0.75, borderTopColor: PDF_COLORS.border }]}>
                <Text>
                  <Text style={pdf.bold}>Instructions: </Text>
                  {stop.instructions}
                </Text>
              </View>
            ) : null}
            {renderStopFooter ? renderStopFooter(stop) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
