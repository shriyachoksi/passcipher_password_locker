"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function SignUpSuccessPage() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push("/auth/login"), 2500);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Account Created!</CardTitle>
            <CardDescription>
              Please check your email to confirm your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a confirmation email to your inbox. Click the link
              in the email to activate your account and start using PassCipher.
            </p>
            <Link href="/auth/login" className="block">
              <Button className="w-full">Back to Login</Button>
            </Link>
            <p className="text-xs text-muted-foreground text-center">
              Redirecting to login…
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
