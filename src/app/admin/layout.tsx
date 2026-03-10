/**
 * Admin layout — main content area without sidebar.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white">
      {children}
    </div>
  );
}
