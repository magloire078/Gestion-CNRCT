import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Répertoire des Villages",
};

export default function VillagesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
