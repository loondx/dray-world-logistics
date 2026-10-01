import type { Metadata } from "next";

import { CompanyContact, LegalPage } from "@/components/marketing/legal-page";
import { getPublicCompanyProfile } from "@/server/services/company-settings.service";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, use and protect personal information submitted through our website.",
};

// Website privacy policy (PIPEDA-based). Describes what this site actually collects.
// Have it reviewed by Canadian counsel before relying on it.
export default async function PrivacyPage() {
  const company = await getPublicCompanyProfile();
  return (
    <LegalPage
      company={company}
      title="Privacy Policy"
      updated="October 1, 2026"
      intro={
        <p>
          {company.legalName} respects your privacy. This policy explains what personal information we collect
          through this website, why we collect it, and the choices you have. We handle personal information in
          line with Canada&apos;s <em>Personal Information Protection and Electronic Documents Act</em>{" "}
          (PIPEDA).
        </p>
      }
    >
      <h2>1. Who is responsible</h2>
      <p>
        {company.legalName} is responsible for the personal information described in this policy. Questions,
        requests and complaints can be sent to us at:
      </p>
      <CompanyContact company={company} />

      <h2>2. What we collect</h2>
      <ul>
        <li>
          <strong>Quote requests:</strong> your name, email address and, if you choose, your phone number and
          company, plus the shipment details you enter (service, origin, destination, equipment, number of
          loads, ready date and notes).
        </li>
        <li>
          <strong>Technical information:</strong> like most websites, our servers may record standard request
          information such as IP address, browser type and the date and time of a visit, for security and to
          keep the site running.
        </li>
      </ul>
      <p>Please do not include sensitive personal information in the free-text fields of our forms.</p>

      <h2>3. Why we use it</h2>
      <ul>
        <li>to respond to your request and prepare a quote;</li>
        <li>to plan and provide the transportation services you ask us to arrange;</li>
        <li>to keep records required by law and by our agreements; and</li>
        <li>to protect the website against abuse and keep it secure.</li>
      </ul>
      <p>
        We do not sell personal information. We only use it for other purposes with your consent or where the
        law permits or requires it.
      </p>

      <h2>4. Consent</h2>
      <p>
        By submitting a form you consent to us using your information for the purposes above. You may withdraw
        consent at any time by contacting us, subject to legal or contractual restrictions; we will explain
        any effect this has on our ability to help you.
      </p>
      <p>
        We do not send commercial electronic messages without consent, in line with Canada&apos;s anti-spam
        legislation (CASL). Replying to your own request is not a marketing message.
      </p>

      <h2>5. Sharing</h2>
      <p>We share personal information only as needed to do what you asked, for example with:</p>
      <ul>
        <li>carriers, drivers and other transportation partners who move your freight;</li>
        <li>service providers who host or support our systems, under obligations to protect it; and</li>
        <li>authorities, when required by law (for example, customs or regulatory requirements).</li>
      </ul>
      <p>
        Because we serve customers in Canada and the United States, your information may be stored or
        processed outside your province or outside Canada, including in the United States, where it may be
        accessible to authorities under local law.
      </p>

      <h2>6. Cookies</h2>
      <p>
        The public pages of this website do not use advertising or analytics cookies. Our staff portal uses a
        strictly necessary session cookie to keep authorised users signed in.
      </p>

      <h2>7. Retention and security</h2>
      <p>
        We keep personal information only as long as needed for the purposes above or as required by law, then
        delete or anonymise it. We use reasonable physical, organisational and technical safeguards, including
        access controls and encrypted connections, to protect it.
      </p>

      <h2>8. Your rights</h2>
      <p>
        You may ask to see the personal information we hold about you and ask us to correct it. Contact us
        using the details above; we may need to verify your identity. If you are not satisfied with our
        response, you may contact the Office of the Privacy Commissioner of Canada (
        <a href="https://www.priv.gc.ca" rel="noreferrer" target="_blank">
          priv.gc.ca
        </a>
        ).
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy from time to time. The &ldquo;last updated&rdquo; date above shows when it
        last changed.
      </p>
    </LegalPage>
  );
}
