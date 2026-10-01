import type { Metadata } from "next";
import Link from "next/link";

import { CompanyContact, LegalPage } from "@/components/marketing/legal-page";
import { getPublicCompanyProfile } from "@/server/services/company-settings.service";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms that apply when you use our website and request quotes.",
};

// Website terms of use. They deliberately do not restate carriage terms (liability,
// claims, payment): those live in the rate confirmation / bill of lading terms set in
// Settings. Have this page reviewed by Canadian counsel before relying on it.
export default async function TermsPage() {
  const company = await getPublicCompanyProfile();
  return (
    <LegalPage
      company={company}
      title="Terms of Use"
      updated="October 1, 2026"
      intro={
        <p>
          These terms apply to your use of the {company.legalName} website. By using the site you agree to
          them. If you do not agree, please do not use the site.
        </p>
      }
    >
      <h2>1. About this website</h2>
      <p>
        This website describes the transportation services offered by {company.legalName} and lets you request
        a quote or a call back. Content is provided for general information and may change without notice.
      </p>

      <h2>2. Quotes and services</h2>
      <ul>
        <li>
          A request sent through this website is an enquiry, not a booking. Nothing on the site is an offer to
          carry freight.
        </li>
        <li>
          Quotes are estimates based on the information you provide and are not binding until confirmed in
          writing (for example, in a rate confirmation).
        </li>
        <li>
          Transportation services are governed by the written agreement for each shipment (such as the rate
          confirmation, the bill of lading and its terms) and by applicable law in Canada and the United
          States. Those documents prevail over anything on this website.
        </li>
      </ul>

      <h2>3. Your responsibilities</h2>
      <p>When you use the site you agree to:</p>
      <ul>
        <li>give accurate information in your requests;</li>
        <li>
          not misuse the site, attempt to gain unauthorised access, or interfere with its operation; and
        </li>
        <li>not submit content that is unlawful or infringes anyone&apos;s rights.</li>
      </ul>
      <p>The staff portal is for authorised users only.</p>

      <h2>4. Intellectual property</h2>
      <p>
        The website, including its text, graphics, illustrations and logos, belongs to {company.legalName} or
        its licensors. You may view it for your own information; any other use requires our written
        permission.
      </p>

      <h2>5. Links</h2>
      <p>
        Links to other websites are provided for convenience. We are not responsible for their content or
        practices.
      </p>

      <h2>6. Disclaimer and limitation of liability</h2>
      <p>
        The website is provided &ldquo;as is&rdquo;. To the fullest extent permitted by law,{" "}
        {company.legalName} makes no warranties about the site and is not liable for any loss arising from its
        use or from reliance on its content. This section does not limit any rights you have that cannot be
        limited by law, and it does not change the terms that govern a shipment.
      </p>

      <h2>7. Privacy</h2>
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains how we handle personal information submitted
        through this website.
      </p>

      <h2>8. Governing law</h2>
      <p>
        These terms are governed by the laws of the Province of Ontario and the federal laws of Canada that
        apply there. The courts of Ontario have jurisdiction over any dispute about the use of this website.
      </p>

      <h2>9. Changes and contact</h2>
      <p>
        We may update these terms; the &ldquo;last updated&rdquo; date shows when. Questions about these terms
        can be sent to:
      </p>
      <CompanyContact company={company} />
    </LegalPage>
  );
}
