import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata = { title: "Traceback", description: "Campus finds made easy" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-page text-ink">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
