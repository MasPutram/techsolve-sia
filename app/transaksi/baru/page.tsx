// =============================================================
//  app/transaksi/baru/page.tsx  -> Form input transaksi baru
// =============================================================

import PageHeader from "@/components/PageHeader";
import TransaksiForm from "@/components/TransaksiForm";

export default function TransaksiBaruPage() {
  return (
    <div>
      <PageHeader
        title="Transaksi Baru"
        description="Catat transaksi dengan prinsip double-entry (total debit = total kredit)"
      />
      <TransaksiForm mode="baru" />
    </div>
  );
}
