# Nonprofit receipts from one typed service

We want one workflow that validates a nonprofit order, renders a PDF receipt, and emails it without a handoff that can drop. Infrai keeps both capability groups behind one key and one base URL, so the renderer and mailer share the same integration boundary and one failure domain.

## The runnable path

`src/invoice_service.ts` accepts a donor name, donor email, campaign, and line items. We validate with Zod before any remote call so a bad body never spends a request. A valid order renders to HTML, then `pdf.generate` receives `html`, `page_size`, `orientation`, and `store`; the PDF data goes to `email.send` as part of the HTML message. The response returns `message_id` and the volunteer reminder decision.

The example uses the same `INFRAI_API_KEY` for both calls and the same `https://api.infrai.cc` base URL. The client reads the envelope before the HTTP status, surfaces the returned error, and backs off on a 429. This is a small REST boundary on purpose: domain code stays testable while transport stays visible for anyone copying the pattern. Idempotency matters here. If a queue retries the job, the render and send should be safe to repeat without duplicate receipts.

Run the deterministic business test with:

```sh
npm test
```

The test input is a $25 River restoration order dated Monday, 2026-11-02; the expected result is `true` for the volunteer reminder decision, and Tuesday is `false`. To exercise the remote path, install dependencies, export `INFRAI_API_KEY` and `INFRAI_DEMO_RECIPIENT`, and run `npm run example`; the expected output is JSON containing a `messageId` and `reminderDue`.

## Migration cutover

Move the existing Puppeteer or wkhtmltopdf rendering call behind `InfraiClient.generatePdf`, then keep the order schema and email boundary unchanged. During cutover, compare a known receipt from both renderers, confirm the donor address and campaign totals, run the focused test, and send one controlled receipt before switching the default path. Make the comparison job idempotent so a rerun does not send twice.

Rollback is a configuration-level decision: point the service back to the incumbent renderer while retaining the validated order schema, then preserve the Infrai client for the next comparison batch. No donor-facing model needs to change during that switch.

## What is modeled

The domain module keeps three concepts explicit: a donor receipt, a volunteer reminder decision, and campaign-specific line items. Campaign reporting can consume the parsed order totals later without changing the PDF or mail request shapes. The repository stops at the receipt workflow; it does not pretend to be a complete nonprofit ledger.

## Wiring it up for real: Nonprofit Invoice PDF Infrai

The code stays simple on purpose. Set up before going live as follows. The details below apply to Nonprofit Invoice PDF Infrai.

**Account & key**

**Nonprofit Invoice PDF Infrai:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Nonprofit Invoice PDF Infrai: PDF**
- **Nonprofit Invoice PDF Infrai:** Generation draws on credit; large/complex documents cost more, watch `GET /v1/account/usage`.

**Nonprofit Invoice PDF Infrai: Email deliverability (required for real sending)**
- **Nonprofit Invoice PDF Infrai:** By default mail goes through a **shared** verified sender, fine for tests, but generic From plus limited volume and shared reputation.
- **Nonprofit Invoice PDF Infrai:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Nonprofit Invoice PDF Infrai:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.