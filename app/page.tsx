import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Shield, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    redirect("/dashboard");
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PassCipher
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-10">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-balance">
              Your Passwords,
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Encrypted & Secure
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              PassCipher uses advanced encryption algorithms to keep your
              passwords safe. Military-grade security meets elegant simplicity.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="text-lg px-8">
                Sign Up for Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Military-Grade Encryption
            </h3>
            <p className="text-muted-foreground">
              Vigenère cipher encryption ensures your passwords are protected
              with proven cryptographic algorithms.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Master Key Protection
            </h3>
            <p className="text-muted-foreground">
              Set a master key to encrypt and decrypt all your passwords. Only
              you know the key.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Instant encryption and decryption with a clean, intuitive
              interface designed for speed.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>PassCipher © 2025. Your security is our priority.</p>
        </div>
      </footer>
    </main>
  );
}
