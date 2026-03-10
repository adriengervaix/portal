import { ClientManagement } from "@/components/client-management";

export default function ClientsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          Gestion des clients
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos clients : logo, statut et informations
        </p>
      </header>
      <ClientManagement />
    </div>
  );
}
