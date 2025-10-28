"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordCipher, type CipherAlgorithm } from "@/lib/encryption";
import {
  LogOut,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Copy,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface Password {
  id: string;
  service_name: string;
  username: string;
  encrypted_password: string;
  website_url?: string;
  notes?: string;
}

export function DashboardClient({ user }: { user: User }) {
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [masterKey, setMasterKey] = useState("");
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    service_name: "",
    username: "",
    password: "",
    website_url: "",
    notes: "",
  });
  const [algorithm, setAlgorithm] = useState<CipherAlgorithm>("vigenere");
  const [visibleModes, setVisibleModes] = useState<
    Record<string, "hidden" | "encrypted" | "decrypted">
  >({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Load saved master key from localStorage
    try {
      const saved = localStorage.getItem("passcipher_master_key");
      if (saved) setMasterKey(saved);
      const savedAlg = localStorage.getItem(
        "passcipher_algorithm"
      ) as CipherAlgorithm | null;
      if (savedAlg === "vigenere" || savedAlg === "vernam")
        setAlgorithm(savedAlg);
    } catch {}
    loadPasswords();
  }, []);

  const loadPasswords = async () => {
    try {
      const { data, error } = await supabase
        .from("passwords")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPasswords(data || []);
    } catch (error) {
      console.error("Error loading passwords:", error);
      alert(
        `Failed to load passwords: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey) {
      alert("Please set a master key first");
      return;
    }

    try {
      const encrypted = PasswordCipher.encrypt(
        formData.password,
        masterKey,
        algorithm
      );

      const { error } = await supabase.from("passwords").insert({
        service_name: formData.service_name,
        username: formData.username,
        encrypted_password: encrypted,
        website_url: formData.website_url || null,
        notes: formData.notes || null,
        user_id: user.id,
      });

      if (error) throw error;

      setFormData({
        service_name: "",
        username: "",
        password: "",
        website_url: "",
        notes: "",
      });
      setShowForm(false);
      loadPasswords();
    } catch (error) {
      console.error("Error adding password:", error);
      alert(
        `Failed to add password: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeletePassword = async (id: string) => {
    if (!confirm("Are you sure you want to delete this password?")) return;

    try {
      const { error } = await supabase.from("passwords").delete().eq("id", id);
      if (error) throw error;
      loadPasswords();
    } catch (error) {
      console.error("Error deleting password:", error);
      alert("Failed to delete password");
    }
  };

  const setVisibilityMode = (
    id: string,
    mode: "hidden" | "encrypted" | "decrypted"
  ) => {
    setVisibleModes((prev) => ({ ...prev, [id]: mode }));
  };

  const decryptPassword = (encrypted: string): string => {
    if (!masterKey) return "Set master key to view";
    try {
      return PasswordCipher.decrypt(encrypted, masterKey);
    } catch (e) {
      console.error("Decrypt failed:", e);
      return "Error decrypting";
    }
  };

  const copyToClipboard = (
    text: string,
    id: string,
    variant: "encrypted" | "decrypted"
  ) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(`${id}:${variant}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PassCipher
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Master Key Section */}
        <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Master Key
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="flex-1 relative">
                <Input
                  type={showMasterKey ? "text" : "password"}
                  placeholder="Enter your master key"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  className="bg-input border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowMasterKey(!showMasterKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showMasterKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <select
                className="border bg-input border-border/50 rounded-md px-3 py-2 text-sm"
                value={algorithm}
                onChange={(e) =>
                  setAlgorithm(e.target.value as CipherAlgorithm)
                }
              >
                <option value="vigenere">Vigenère</option>
                <option value="vernam">Vernam</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    localStorage.setItem("passcipher_master_key", masterKey);
                    localStorage.setItem("passcipher_algorithm", algorithm);
                    alert("Master key saved locally");
                  } catch {
                    alert("Failed to save key to localStorage");
                  }
                }}
              >
                Set Key
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setMasterKey("");
                  try {
                    localStorage.removeItem("passcipher_master_key");
                    localStorage.removeItem("passcipher_algorithm");
                  } catch {}
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Passwords Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Passwords</h2>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Password
            </Button>
          </div>

          {/* Add Password Form */}
          {showForm && (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Add New Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPassword} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service">Service Name</Label>
                      <Input
                        id="service"
                        placeholder="e.g., Gmail, GitHub"
                        value={formData.service_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            service_name: e.target.value,
                          })
                        }
                        required
                        className="bg-input border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username/Email</Label>
                      <Input
                        id="username"
                        placeholder="your@email.com"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        required
                        className="bg-input border-border/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      className="bg-input border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL (Optional)</Label>
                    <Input
                      id="website"
                      placeholder="https://example.com"
                      value={formData.website_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          website_url: e.target.value,
                        })
                      }
                      className="bg-input border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Add any notes..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="bg-input border-border/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Save Password</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Passwords List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading passwords...
            </div>
          ) : passwords.length === 0 ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="py-12 text-center">
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  No passwords yet. Add one to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {passwords.map((pwd) => (
                <Card
                  key={pwd.id}
                  className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {pwd.service_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {pwd.username}
                          </p>
                          {pwd.website_url && (
                            <a
                              href={pwd.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {pwd.website_url}
                            </a>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePassword(pwd.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="inline-flex rounded-md border border-border/50 overflow-hidden">
                            <button
                              className={`px-3 py-1 text-sm ${
                                !visibleModes[pwd.id] ||
                                visibleModes[pwd.id] === "hidden"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background"
                              }`}
                              onClick={() =>
                                setVisibilityMode(pwd.id, "hidden")
                              }
                            >
                              Hidden
                            </button>
                            <button
                              className={`px-3 py-1 text-sm ${
                                visibleModes[pwd.id] === "encrypted"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background"
                              }`}
                              onClick={() =>
                                setVisibilityMode(pwd.id, "encrypted")
                              }
                            >
                              Encrypted
                            </button>
                            <button
                              className={`px-3 py-1 text-sm ${
                                visibleModes[pwd.id] === "decrypted"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background"
                              }`}
                              onClick={() =>
                                setVisibilityMode(pwd.id, "decrypted")
                              }
                            >
                              Decrypted
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {(!visibleModes[pwd.id] ||
                              visibleModes[pwd.id] === "hidden") && (
                              <code className="text-sm font-mono">
                                ••••••••
                              </code>
                            )}
                            {visibleModes[pwd.id] === "encrypted" && (
                              <code className="text-sm font-mono break-all">
                                {pwd.encrypted_password}
                              </code>
                            )}
                            {visibleModes[pwd.id] === "decrypted" && (
                              <code className="text-sm font-mono break-all">
                                {decryptPassword(pwd.encrypted_password)}
                              </code>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const content =
                                  visibleModes[pwd.id] === "encrypted"
                                    ? pwd.encrypted_password
                                    : decryptPassword(pwd.encrypted_password);
                                copyToClipboard(
                                  content,
                                  pwd.id,
                                  visibleModes[pwd.id] === "encrypted"
                                    ? "encrypted"
                                    : "decrypted"
                                );
                              }}
                              disabled={
                                !visibleModes[pwd.id] ||
                                visibleModes[pwd.id] === "hidden"
                              }
                              title="Copy"
                            >
                              {copiedKey?.startsWith(`${pwd.id}:`) ? (
                                <Check className="w-4 h-4 text-primary" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {pwd.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          Note: {pwd.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
