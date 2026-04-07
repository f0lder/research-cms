import { redirect } from 'next/navigation';

// Global block layout editing has moved to Clients — each client configures
// its own layout per schema under /clients/:id/layout/:slug.
export default function LayoutRedirect() {
  redirect('/clients');
}
