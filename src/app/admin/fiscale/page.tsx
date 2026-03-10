import { TaxDeclarationList } from "@/components/tax/tax-declaration-list";

/**
 * Admin fiscale page — structure: Data (metrics) + Table (declarations).
 */
export default function AdminFiscalePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          Admin
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivi comptable mensuel
        </p>
      </header>

      <TaxDeclarationList />
    </div>
  );
}
