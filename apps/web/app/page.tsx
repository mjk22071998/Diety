import { redirect } from "next/navigation";

/**
 * Root page — immediately redirects to the authenticated dashboard.
 * Marketing / landing page lives at the marketing subdomain.
 */
export default function RootPage() {
  redirect("/dashboard");
}
