export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin section has its own sidebar/header, so we don't need the main site header/footer
  return <>{children}</>;
}
