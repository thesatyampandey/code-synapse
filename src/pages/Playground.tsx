import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Code2,
  Play,
  Save,
  Home,
  Terminal,
  Download,
  FolderOpen,
  Trash2,
  Settings,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LANGUAGE_OPTIONS = [
  { value: "typescript", label: "TypeScript", ext: ".ts", executable: true },
  { value: "javascript", label: "JavaScript", ext: ".js", executable: true },
  { value: "python", label: "Python", ext: ".py", executable: true },
  { value: "java", label: "Java", ext: ".java", executable: true },
  { value: "cpp", label: "C++", ext: ".cpp", executable: true },
  { value: "c", label: "C", ext: ".c", executable: true },
  { value: "rust", label: "Rust", ext: ".rs", executable: true },
  { value: "go", label: "Go", ext: ".go", executable: true },
  { value: "sql", label: "SQL", ext: ".sql", executable: true },
  { value: "html", label: "HTML", ext: ".html", executable: false },
  { value: "css", label: "CSS", ext: ".css", executable: false },
  { value: "json", label: "JSON", ext: ".json", executable: false },
  { value: "markdown", label: "Markdown", ext: ".md", executable: false },
];

interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  created_at: string;
  updated_at: string;
}

const Playground = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string>("// Start coding...\n\nfunction hello() {\n  console.log('Hello from Playground!');\n}\n\nhello();");
  const [language, setLanguage] = useState<string>("javascript");
  const [title, setTitle] = useState<string>("Untitled");
  const [output, setOutput] = useState<string>("");
  const [showOutput, setShowOutput] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showSnippetsDialog, setShowSnippetsDialog] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<string | null>(null);
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    tabSize: 2,
    theme: "vs-dark",
    fontFamily: "fira-code",
    minimap: false,
    lineNumbers: true,
    wordWrap: false,
  });

  // Load settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("editorSettings");
    if (savedSettings) {
      setEditorSettings(JSON.parse(savedSettings));
    }

    // Load from localStorage for anonymous users
    const savedCode = localStorage.getItem("playground_code");
    const savedLang = localStorage.getItem("playground_language");
    const savedTitle = localStorage.getItem("playground_title");
    if (savedCode) setCode(savedCode);
    if (savedLang) setLanguage(savedLang);
    if (savedTitle) setTitle(savedTitle);
  }, []);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
      
      if (session?.user) {
        loadSnippets();
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          loadSnippets();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("playground_code", code);
      localStorage.setItem("playground_language", language);
      localStorage.setItem("playground_title", title);
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, language, title]);

  const loadSnippets = async () => {
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setSnippets(data);
    }
  };

  const getFontFamilyCSS = (fontFamily: string) => {
    const fontMap: { [key: string]: string } = {
      "fira-code": "'Fira Code', 'Cascadia Code', Consolas, monospace",
      "cascadia": "'Cascadia Code', Consolas, monospace",
      "consolas": "Consolas, monospace",
      "monaco": "Monaco, monospace",
      "monospace": "monospace",
    };
    return fontMap[fontFamily] || fontMap["fira-code"];
  };

  const saveSnippet = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save snippets",
        variant: "destructive",
      });
      return;
    }

    if (currentSnippetId) {
      // Update existing
      const { error } = await supabase
        .from("snippets")
        .update({ title, language, code, updated_at: new Date().toISOString() })
        .eq("id", currentSnippetId);

      if (!error) {
        toast({ title: "Snippet updated" });
        loadSnippets();
      }
    } else {
      // Create new
      const { data, error } = await supabase
        .from("snippets")
        .insert({ user_id: user.id, title, language, code })
        .select()
        .single();

      if (!error && data) {
        setCurrentSnippetId(data.id);
        toast({ title: "Snippet saved" });
        loadSnippets();
      }
    }
  };

  const loadSnippet = (snippet: Snippet) => {
    setCurrentSnippetId(snippet.id);
    setTitle(snippet.title);
    setLanguage(snippet.language);
    setCode(snippet.code);
    setShowSnippetsDialog(false);
    toast({ title: "Snippet loaded", description: snippet.title });
  };

  const deleteSnippet = async (id: string) => {
    const { error } = await supabase
      .from("snippets")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Snippet deleted" });
      loadSnippets();
      if (currentSnippetId === id) {
        setCurrentSnippetId(null);
        setTitle("Untitled");
        setCode("// Start coding...");
      }
    }
    setSnippetToDelete(null);
  };

  const downloadCode = () => {
    const selectedLang = LANGUAGE_OPTIONS.find((l) => l.value === language);
    const filename = `${title}${selectedLang?.ext || ".txt"}`;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Code downloaded", description: filename });
  };

  const runCode = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to execute code",
        variant: "destructive",
      });
      return;
    }

    const isExecutable = LANGUAGE_OPTIONS.find((l) => l.value === language)?.executable;
    if (!isExecutable) {
      toast({
        title: "Cannot execute",
        description: `${language.toUpperCase()} cannot be executed`,
        variant: "destructive",
      });
      return;
    }

    setShowOutput(true);
    setIsExecuting(true);
    setOutput("Executing code...\n");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("execute-code", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { code, language },
      });

      if (error) {
        setOutput(`${"=".repeat(50)}\nERROR\n${"=".repeat(50)}\n\n${error.message}`);
        toast({ title: "Execution error", variant: "destructive" });
        return;
      }

      setOutput(data.output || "No output");
      toast({ title: data.success ? "Code executed" : "Execution completed with errors" });
    } catch (error) {
      setOutput(`ERROR: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast({ title: "Execution error", variant: "destructive" });
    } finally {
      setIsExecuting(false);
    }
  };

  const newSnippet = () => {
    setCurrentSnippetId(null);
    setTitle("Untitled");
    setCode("// Start coding...");
    setLanguage("javascript");
    toast({ title: "New snippet created" });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading playground...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-14 bg-gradient-to-r from-background to-muted border-b border-border flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-foreground">Solo Playground</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-48 h-8 bg-muted border-border"
            placeholder="Snippet title"
          />
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <Button size="sm" variant="outline" onClick={() => setShowSnippetsDialog(true)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Load
              </Button>
              <Button size="sm" variant="outline" onClick={saveSnippet}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={newSnippet}>
                New
              </Button>
            </>
          )}
          <Link to="/settings">
            <Button size="sm" variant="ghost">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <ThemeToggle />
          {user ? (
            <Link to="/profile">
              <Button size="sm" className="bg-teal-500 hover:bg-teal-600">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Sign In
              </Button>
            </Link>
          )}
          <Link to="/">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Toolbar */}
        <div className="h-10 bg-editor-bg border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Language:</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[140px] h-8 bg-muted border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value} className="text-xs">
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={downloadCode}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={runCode}
              className="bg-green-600 hover:bg-green-700"
              disabled={isExecuting || !LANGUAGE_OPTIONS.find((l) => l.value === language)?.executable}
            >
              <Play className={`h-4 w-4 mr-2 ${isExecuting ? "animate-spin" : ""}`} />
              {isExecuting ? "Running..." : "Run Code"}
            </Button>
          </div>
        </div>

        {/* Editor and Output */}
        <div className="flex-1 flex overflow-hidden">
          <div className={`${showOutput ? "w-1/2" : "w-full"} border-r border-border`}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme={editorSettings.theme}
              options={{
                fontSize: editorSettings.fontSize,
                fontFamily: getFontFamilyCSS(editorSettings.fontFamily),
                tabSize: editorSettings.tabSize,
                minimap: { enabled: editorSettings.minimap },
                lineNumbers: editorSettings.lineNumbers ? "on" : "off",
                wordWrap: editorSettings.wordWrap ? "on" : "off",
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                padding: { top: 16 },
              }}
            />
          </div>
          {showOutput && (
            <div className="w-1/2 bg-panel-bg flex flex-col">
              <div className="h-10 border-b border-border flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Output</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowOutput(false)}>
                  Close
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4 font-mono text-sm">
                <pre className="text-foreground whitespace-pre-wrap">{output}</pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Load Snippets Dialog */}
      <Dialog open={showSnippetsDialog} onOpenChange={setShowSnippetsDialog}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Your Snippets</DialogTitle>
            <DialogDescription>Load a previously saved snippet</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            {snippets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No saved snippets yet</p>
            ) : (
              <div className="space-y-2">
                {snippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => loadSnippet(snippet)}>
                      <h4 className="font-medium">{snippet.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {snippet.language} • {new Date(snippet.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSnippetToDelete(snippet.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!snippetToDelete} onOpenChange={() => setSnippetToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete snippet?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => snippetToDelete && deleteSnippet(snippetToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Playground;
