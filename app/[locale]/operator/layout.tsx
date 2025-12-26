export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Operator section has its own sidebar/header, so we don't need the main site header/footer
  return <>{children}</>;
}
