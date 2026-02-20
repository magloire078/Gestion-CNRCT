import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Scale, MapPin, Search } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex relative w-10 h-10">
                            <Image src="/images/coat-of-arms.svg" alt="Armoiries de la République du Bénin" layout="fill" objectFit="contain" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">CNRCT</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="default" className="gap-2">
                                Connexion Intranet <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 md:py-32 overflow-hidden bg-muted/30">
                    <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom" />
                    <div className="container mx-auto px-4 relative">
                        <div className="max-w-3xl mx-auto text-center space-y-8">
                            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-4">
                                République du Bénin
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                                Commission Nationale de Règlement des Conflits Terriers
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                Institution de l'État dédiée à la médiation, la résolution pacifique et la gestion transparente des litiges fonciers sur l'ensemble du territoire national.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link href="/login">
                                    <Button size="lg" className="h-12 px-8 text-base">
                                        Accès Collaborateurs
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background">
                                    En savoir plus
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Missions Section */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Nos Missions</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Le CNRCT œuvre pour garantir la paix sociale à travers une gestion équitable et efficace du patrimoine foncier.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <div className="bg-muted/50 rounded-2xl p-8 border border-border/50 transition-all hover:shadow-md">
                                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                                    <Scale className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Médiation & Résolution</h3>
                                <p className="text-muted-foreground">
                                    Intervention neutre pour résoudre les litiges fonciers, ruraux et urbains, en favorisant les accords amiables.
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-2xl p-8 border border-border/50 transition-all hover:shadow-md">
                                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Sécurisation Foncière</h3>
                                <p className="text-muted-foreground">
                                    Accompagnement dans les démarches de formalisation et garantie des droits de propriété.
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-2xl p-8 border border-border/50 transition-all hover:shadow-md">
                                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                                    <MapPin className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Cartographie & Expertise</h3>
                                <p className="text-muted-foreground">
                                    Relevés topographiques, expertises du domaine terrestre et maintien d'un référentiel géographique précis.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t bg-muted/40 py-12">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground mb-2">Commission Nationale de Règlement des Conflits Terriers</p>
                    <p className="text-sm mb-6">Préserver la terre, garantir la paix.</p>
                    <div className="text-xs">
                        &copy; {new Date().getFullYear()} CNRCT - République du Bénin. Tous droits réservés.
                    </div>
                </div>
            </footer>
        </div>
    );
}
