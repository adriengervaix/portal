import { ClientList } from "@/components/client-list";

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          Project Portal
        </h1>
      </header>
      <ClientList />
    </div>
  );
}
