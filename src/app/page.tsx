import { ClientList } from "@/components/client-list";

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Project Portal</h1>
        <p className="text-muted-foreground mt-1">
          Hub de gestion de projets — clients et projets
        </p>
      </header>
      <ClientList />
    </div>
  );
}
