import AuthHeader from "@/components/custom/auth-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AuthHeader />
      {/* Main layout with nav, sidebar will go here */}
      <main>{children}</main>
    </div>
  );
}