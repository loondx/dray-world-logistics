# DRAY-WORLD TMS: Staff Guide

How to run a load from booking to close-out in the DRAY-WORLD portal, which document goes to whom, and the
practices that keep paperwork correct. For setup and deployment, see the [README](../README.md).

## 1. The dashboard at a glance

Start each day here. Work through **Needs attention** first, then the **Schedule**.

| Panel               | What it tells you                                                           | Click to             |
| ------------------- | --------------------------------------------------------------------------- | -------------------- |
| **Four tiles**      | Created (not started), In progress, pickups today, deliveries today         | The matching list    |
| **Needs attention** | Problems to fix, with the first few load numbers. Shows "All clear" if none | The load or the list |
| **Schedule**        | Every pickup and delivery in the next 7 days, by day and appointment time   | The load             |
| **Revenue**         | This month's revenue and gross margin, plus the last 6 months               | (financial roles)    |

**Needs attention** checks for:

- **Not started:** the pickup date has passed but the load is still **Created**.
- **No carrier assigned:** pickup is within 3 days and no carrier is on the load.
- **Past delivery date:** the load is still **In progress** after its delivery date. Collect the POD, send the
  invoice, then mark it **Completed**.
- **Carrier insurance expiring:** an active carrier's insurance has expired or expires within 30 days.
- **New leads:** website or phone leads nobody has contacted yet.

In the schedule, **No carrier** in amber means the appointment has nobody to run it.

## 2. Load workflow

Every load has one of three statuses:

```
Created → In progress → Completed
```

| Status          | Meaning                                                         | Typical next step                     |
| --------------- | --------------------------------------------------------------- | ------------------------------------- |
| **Created**     | Booked for a client, not started yet                            | Assign carrier, send the confirmation |
| **In progress** | Dispatched, on the road, or delivered and waiting for paperwork | Get the POD, send the invoice         |
| **Completed**   | Delivered, paperwork in and invoice sent                        | Nothing. The load is closed           |

Use **Mark In progress** / **Mark Completed** on the load page to move one step forward, or **Change status** to
go back a step. Every change is recorded in the load timeline with who made it and when. Assigning a carrier does
not change the status; you start the load yourself when it is dispatched.

**Cancelled before it started?** Open the load and click **Delete**. Only a **Created** load with no documents can be
deleted, so a real move and its paperwork can never be lost. The audit log keeps a record of the deletion.

### Creating a load quickly

Only the **client** and **load date** are required. Fill in the rest as you learn it:

1. **Loads → Create load**, pick Drayage or OTR.
2. Choose the client (or **New client** inline).
3. Choose carrier and driver (or add them inline). Truck and trailer numbers fill in from the driver.
4. Enter pickup and delivery. **Use saved location** reuses a facility you have entered before.
5. Enter the **client rate** and **carrier rate**. The gross margin updates as you type.

Appointment dates and times are the facility's local time. Enter them exactly as the terminal or warehouse gives
them; the system never converts time zones.

## 3. Documents: which one goes to whom

| Document                      | Send to                           | Shows                   | Never shows                                       |
| ----------------------------- | --------------------------------- | ----------------------- | ------------------------------------------------- |
| **Carrier Load Confirmation** | The carrier                       | Carrier rate            | Client rate, client name, margin, notes           |
| **Client Rate Confirmation**  | The client (shipper)              | Client rate             | Carrier rate, carrier, driver, margin, notes      |
| **Invoice (INV-#)**           | The client (with the POD)         | Client rate + extras    | Carrier rate, carrier, driver, margin, notes      |
| **Bill of Lading (BOL-#)**    | Driver, pickup and delivery sites | Carrier and driver only | Any rate, client name or reference, margin, notes |

The system enforces these rules: a carrier document cannot contain the client rate, and a client document cannot
contain the carrier rate, whatever is typed into the load. Internal notes are never printed.

Every PDF carries the company letterhead (logo, legal name, address and contact details from **Settings → Company
details**).

### Getting a document

Open the load and use the **Documents** panel. Each document has **View** (opens in a new tab) and **Download**.
The PDF is built from the load's details **at that moment**, and nothing is saved in the portal. So:

- If you change rates, appointments or charges, simply download the document again.
- **Keep what you send.** Save the PDF in your email or your own files when you send it: that copy is your record
  of what the carrier or client received. Keep signed copies they send back the same way.

### Invoicing a client

1. Add any extra charges on the load page under **Financial → Extra charges** (chassis, detention, storage,
   pre-pull …). Pick a suggestion or type your own, enter the amount and click **Add**. The **Invoice total**
   updates as you go.
2. After delivery, click **Download** on the **Invoice** card. The file is always `INV-<load #>.pdf`, so the
   invoice number never changes. It shows:
   - **Invoice # `INV-<load #>`**, invoice date and due date
   - **Bill To:** the client's name, address, contact person and email
   - **Shipment:** load #, client ref, container, booking, equipment, commodity, weight, pickup and delivery
   - **Charges:** the freight (client rate), each extra charge, and the **Total due**
   - **Payment:** the terms in plain words (e.g. "Net 15: payment is due within 15 days"), your payment
     instructions and business number
3. Email the invoice and the POD to the client's billing contact.
4. If something was wrong, fix the load or charges and download it again. It keeps the same number; tell the
   client the new copy replaces the first one.

**Payment terms (Net terms):** choose the company default under **Settings → Document terms & instructions**: Due on
receipt, Net 7, 10, 15, 30, 45, 60 or 90. A client who pays on different terms gets their own choice on the client
page. The invoice prints the terms and works out the due date from the invoice date. If neither is set, invoices
use **Net 15**.

## 4. Leads

**Leads** in the menu (the number next to it counts new ones) collects every enquiry in one place:

- **Website:** each quote request from the website's form arrives automatically, with everything the visitor
  entered: name, company, email, phone, service, pickup and delivery, equipment, number of loads, ready date and notes.
- **Added by staff:** click **Add lead** for enquiries that came in by phone, email or in person. A name plus a
  phone or email is enough; the other fields are optional.

Work each lead: call or email, then set its status to **Contacted**, and **Closed** when it is won or lost. Use the
search box to find a lead by name, company, email, phone or city. When a lead becomes a customer, click
**Create client**: the client form opens already filled with the lead's company, contact, email and phone.

## 5. Roles

| Role              | Loads | Clients / carriers | Rates and margin | Documents           | Settings |
| ----------------- | ----- | ------------------ | ---------------- | ------------------- | -------- |
| **Administrator** | Edit  | Edit               | View and edit    | All                 | Yes      |
| **Operations**    | Edit  | Edit               | View and edit    | All                 | No       |
| **Dispatcher**    | Edit  | Edit               | View and edit    | All                 | No       |
| **Accounting**    | View  | View               | View and edit    | All                 | No       |
| **Read only**     | View  | View               | Hidden           | BOL only (no rates) | No       |

Documents that show rates (both rate confirmations and invoices) open only for roles that can see rates.
Administrators add users and reset passwords under **Settings → Users**. Give each person their own account,
named with their real name; never share logins.

## 6. Recommended practices

**Booking**

- Book every load in the TMS before it is dispatched, even if details are incomplete. The load number is the
  reference everyone shares.
- Enter container, booking and seal numbers as soon as you have them; they print on the BOL and confirmations.
- Keep rates in the rate fields only. Never type a rate into notes or instructions, which other parties may see.

**Dispatch**

- Send the Carrier Load Confirmation before the truck is dispatched, and get it back signed.
- Check the carrier's insurance expiry (shown on the carrier page) before assigning.
- Send the BOL to the driver with the pickup appointment number and any special instructions.

**Delivery and close-out**

- Ask the driver for the signed POD at delivery, the same day. Keep it with the load's email thread or files.
- Send the invoice the same day the POD comes in, with the POD attached.
- Move the load to **Completed** once the POD is in and the invoice is sent. **Past delivery date** should be
  empty at the end of each day.

**Settings and company details**

- Company name, address, MC/DOT, phone and email come only from **Settings → Company details**. Update them there and
  every new document uses them; documents already generated keep the details they were printed with.
- Terms and instructions under **Settings → Document terms & instructions** must be your final, legally reviewed wording. The
  system adds no terms of its own. Enter one item per line; each line becomes a bullet on the PDF.
- Upload a high-resolution PNG logo under **Settings → Logo** if you have one. Without an upload, documents use
  the standard DRAY-WORLD emblem.
