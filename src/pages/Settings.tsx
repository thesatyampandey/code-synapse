import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Settings as SettingsIcon, Code2, Save, Palette, Type } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface EditorSettings {
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  autoSaveInterval: number;
  theme: string;
  fontFamily: string;
  minimap: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;
}

const FONT_FAMILIES = [
  { value: "fira-code", label: "Fira Code" },
  { value: "cascadia", label: "Cascadia Code" },
  { value: "consolas", label: "Consolas" },
  { value: "monaco", label: "Monaco" },
  { value: "monospace", label: "Monospace" },
];

const THEMES = [
  { value: "vs-dark", label: "Dark" },
  { value: "vs-light", label: "Light" },
  { value: "hc-black", label: "High Contrast Dark" },
];

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EditorSettings>({
    fontSize: 14,
    tabSize: 2,
    autoSave: true,
    autoSaveInterval: 5,
    theme: "vs-dark",
    fontFamily: "fira-code",
    minimap: false,
    lineNumbers: true,
    wordWrap: false,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("editorSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem("editorSettings", JSON.stringify(settings));
    toast({
      title: "Settings saved",
      description: "Your editor preferences have been updated",
    });
  };

  const resetSettings = () => {
    const defaultSettings: EditorSettings = {
      fontSize: 14,
      tabSize: 2,
      autoSave: true,
      autoSaveInterval: 5,
      theme: "vs-dark",
      fontFamily: "fira-code",
      minimap: false,
      lineNumbers: true,
      wordWrap: false,
    };
    setSettings(defaultSettings);
    localStorage.setItem("editorSettings", JSON.stringify(defaultSettings));
    toast({
      title: "Settings reset",
      description: "All preferences have been restored to defaults",
    });
  };

  const getFontFamilyCSS = (fontFamily: string) => {
    const fontMap: { [key: string]: string } = {
      "fira-code": "'Fira Code', monospace",
      "cascadia": "'Cascadia Code', monospace",
      "consolas": "Consolas, monospace",
      "monaco": "Monaco, monospace",
      "monospace": "monospace",
    };
    return fontMap[fontFamily] || fontMap["fira-code"];
  };

  return (
    <div className="min-h-screen bg-background dark flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Editor Settings</h1>
                <p className="text-muted-foreground">Customize your coding experience</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Editor Appearance */}
          <Card className="bg-card border-border shadow-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of the editor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Editor Theme</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => setSettings({ ...settings, theme: value })}
                >
                  <SelectTrigger id="theme" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {THEMES.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select 
                  value={settings.fontFamily} 
                  onValueChange={(value) => setSettings({ ...settings, fontFamily: value })}
                >
                  <SelectTrigger id="fontFamily" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fontSize">Font Size: {settings.fontSize}px</Label>
                </div>
                <Slider
                  id="fontSize"
                  min={10}
                  max={24}
                  step={1}
                  value={[settings.fontSize]}
                  onValueChange={([value]) => setSettings({ ...settings, fontSize: value })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10px</span>
                  <span>24px</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor Behavior */}
          <Card className="bg-card border-border shadow-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                Editor Behavior
              </CardTitle>
              <CardDescription>Configure how the editor works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tabSize">Tab Size: {settings.tabSize} spaces</Label>
                </div>
                <Slider
                  id="tabSize"
                  min={2}
                  max={8}
                  step={1}
                  value={[settings.tabSize]}
                  onValueChange={([value]) => setSettings({ ...settings, tabSize: value })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2 spaces</span>
                  <span>8 spaces</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lineNumbers">Line Numbers</Label>
                  <p className="text-sm text-muted-foreground">Show line numbers in the editor</p>
                </div>
                <Switch
                  id="lineNumbers"
                  checked={settings.lineNumbers}
                  onCheckedChange={(checked) => setSettings({ ...settings, lineNumbers: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="minimap">Minimap</Label>
                  <p className="text-sm text-muted-foreground">Display code minimap on the right</p>
                </div>
                <Switch
                  id="minimap"
                  checked={settings.minimap}
                  onCheckedChange={(checked) => setSettings({ ...settings, minimap: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="wordWrap">Word Wrap</Label>
                  <p className="text-sm text-muted-foreground">Wrap long lines automatically</p>
                </div>
                <Switch
                  id="wordWrap"
                  checked={settings.wordWrap}
                  onCheckedChange={(checked) => setSettings({ ...settings, wordWrap: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto-Save Settings */}
          <Card className="bg-card border-border shadow-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-primary" />
                Auto-Save
              </CardTitle>
              <CardDescription>Configure automatic file saving</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSave">Enable Auto-Save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch
                  id="autoSave"
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoSave: checked })}
                />
              </div>

              {settings.autoSave && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoSaveInterval">
                      Auto-Save Interval: {settings.autoSaveInterval} seconds
                    </Label>
                  </div>
                  <Slider
                    id="autoSaveInterval"
                    min={1}
                    max={30}
                    step={1}
                    value={[settings.autoSaveInterval]}
                    onValueChange={([value]) => setSettings({ ...settings, autoSaveInterval: value })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1s (instant)</span>
                    <span>30s</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-card border-border shadow-panel">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your code will look with these settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="p-4 bg-editor-bg border border-border rounded-lg font-mono"
                style={{
                  fontSize: `${settings.fontSize}px`,
                  fontFamily: getFontFamilyCSS(settings.fontFamily),
                }}
              >
                <pre className="text-foreground">
                  <code>{`function example() {
  const message = "Hello, CodeSync!";
  console.log(message);
  return true;
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={resetSettings}>
              Reset to Defaults
            </Button>
            <Button onClick={saveSettings} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-16 border-t border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Built by Akash Mishra
        </p>
      </footer>
    </div>
  );
};

export default Settings;
