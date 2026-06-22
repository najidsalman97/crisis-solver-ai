import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings - CrisisRoom AI" },
      { name: "description", content: "Configure AI providers and API keys" },
    ],
  }),
  component: SettingsPage,
});

interface Settings {
  provider: "auto" | "gemini" | "openai" | "openrouter";
  geminiKey: string;
  openaiKey: string;
  openrouterKey: string;
}

const DEFAULT_SETTINGS: Settings = {
  provider: "auto",
  geminiKey: "",
  openaiKey: "",
  openrouterKey: "",
};

function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem("crisisroom-ai-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
  }, []);

  function handleSave() {
    setLoading(true);
    try {
      localStorage.setItem("crisisroom-ai-settings", JSON.stringify(settings));
      toast.success("Settings saved successfully");
      setTimeout(() => navigate({ to: "/" }), 1500);
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    if (confirm("Clear all API keys?")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem("crisisroom-ai-settings");
      toast.success("Settings cleared");
    }
  }

  function toggleVisibility(key: string) {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster theme="dark" position="top-right" richColors />

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[oklch(0.16_0.02_260/0.7)] border-b border-border">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="font-display text-lg font-semibold">Settings</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="space-y-8">
          {/* AI Provider Selection */}
          <Card className="border border-border/50 bg-[oklch(0.16_0.02_260/0.5)]">
            <CardHeader>
              <CardTitle>AI Provider Selection</CardTitle>
              <CardDescription>
                Choose which AI provider to use for crisis analysis. "Auto" will try Gemini, then OpenAI, then
                OpenRouter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider" className="mb-2 block">
                    Preferred Provider
                  </Label>
                  <Select value={settings.provider} onValueChange={(value: any) => setSettings((prev) => ({ ...prev, provider: value }))}>
                    <SelectTrigger id="provider" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Gemini → OpenAI → OpenRouter)</SelectItem>
                      <SelectItem value="gemini">Gemini (Google)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <div className="space-y-4">
            {/* Gemini */}
            <Card className="border border-border/50 bg-[oklch(0.16_0.02_260/0.5)]">
              <CardHeader>
                <CardTitle className="text-base">Gemini API Key</CardTitle>
                <CardDescription>
                  Get your API key from{" "}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google AI Studio
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    type={visibleKeys["gemini"] ? "text" : "password"}
                    placeholder="sk-..."
                    value={settings.geminiKey}
                    onChange={(e) => setSettings((prev) => ({ ...prev, geminiKey: e.target.value }))}
                    className="pr-10"
                  />
                  <button
                    onClick={() => toggleVisibility("gemini")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visibleKeys["gemini"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* OpenAI */}
            <Card className="border border-border/50 bg-[oklch(0.16_0.02_260/0.5)]">
              <CardHeader>
                <CardTitle className="text-base">OpenAI API Key</CardTitle>
                <CardDescription>
                  Get your API key from{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    OpenAI Platform
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    type={visibleKeys["openai"] ? "text" : "password"}
                    placeholder="sk-..."
                    value={settings.openaiKey}
                    onChange={(e) => setSettings((prev) => ({ ...prev, openaiKey: e.target.value }))}
                    className="pr-10"
                  />
                  <button
                    onClick={() => toggleVisibility("openai")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visibleKeys["openai"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* OpenRouter */}
            <Card className="border border-border/50 bg-[oklch(0.16_0.02_260/0.5)]">
              <CardHeader>
                <CardTitle className="text-base">OpenRouter API Key</CardTitle>
                <CardDescription>
                  Get your API key from{" "}
                  <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    OpenRouter
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    type={visibleKeys["openrouter"] ? "text" : "password"}
                    placeholder="sk-or-..."
                    value={settings.openrouterKey}
                    onChange={(e) => setSettings((prev) => ({ ...prev, openrouterKey: e.target.value }))}
                    className="pr-10"
                  />
                  <button
                    onClick={() => toggleVisibility("openrouter")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visibleKeys["openrouter"] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Alert */}
          <Alert className="border border-border/50 bg-[oklch(0.72_0.18_28/0.15)]">
            <AlertDescription className="text-sm">
              API keys are stored locally in your browser's localStorage. They are not sent to our servers. For security, use API keys with minimal permissions or
              set up usage limits.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClear} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
