import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, MessageSquare, Users, FileCode, Plus, X, Send, Home, LogOut, Play, Terminal, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

const LANGUAGE_OPTIONS = [
  { value: "typescript", label: "TypeScript", ext: ".ts" },
  { value: "javascript", label: "JavaScript", ext: ".js" },
  { value: "python", label: "Python", ext: ".py" },
  { value: "java", label: "Java", ext: ".java" },
  { value: "cpp", label: "C++", ext: ".cpp" },
  { value: "c", label: "C", ext: ".c" },
  { value: "html", label: "HTML", ext: ".html" },
  { value: "css", label: "CSS", ext: ".css" },
  { value: "json", label: "JSON", ext: ".json" },
  { value: "markdown", label: "Markdown", ext: ".md" },
  { value: "sql", label: "SQL", ext: ".sql" },
  { value: "rust", label: "Rust", ext: ".rs" },
  { value: "go", label: "Go", ext: ".go" },
];

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([
    { id: "1", name: "index.tsx", content: "// Welcome to CodeSync!\n// Start coding together...\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;", language: "typescript" }
  ]);
  const [activeFileId, setActiveFileId] = useState("1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [username] = useState(`User${Math.floor(Math.random() * 1000)}`);
  const [output, setOutput] = useState<string>("");
  const [showOutput, setShowOutput] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileLanguage, setNewFileLanguage] = useState("typescript");
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);

  // Load files from database
  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }
    
    loadFiles();
    
    toast({
      title: "Connected to room",
      description: `Room ID: ${roomId}`,
    });
  }, [roomId, navigate, toast]);

  const loadFiles = async () => {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading files:', error);
      return;
    }

    if (data && data.length > 0) {
      setFiles(data.map(f => ({
        id: f.id,
        name: f.name,
        content: f.content,
        language: f.language
      })));
      setActiveFileId(data[0].id);
    } else {
      // Create initial file if none exist
      const initialFile = {
        room_id: roomId,
        name: "index.tsx",
        content: "// Welcome to CodeSync!\n// Start coding together...\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;",
        language: "typescript"
      };

      const { data: newFile, error: insertError } = await supabase
        .from('files')
        .insert(initialFile)
        .select()
        .single();

      if (!insertError && newFile) {
        setFiles([{
          id: newFile.id,
          name: newFile.name,
          content: newFile.content,
          language: newFile.language
        }]);
        setActiveFileId(newFile.id);
      }
    }
  };

  const activeFile = files.find(f => f.id === activeFileId);

  const handleEditorChange = async (value: string | undefined) => {
    if (value !== undefined && activeFile) {
      setFiles(files.map(f => 
        f.id === activeFileId ? { ...f, content: value } : f
      ));

      // Save to database
      await supabase
        .from('files')
        .update({ content: value })
        .eq('id', activeFileId);
    }
  };

  const addNewFile = () => {
    setShowNewFileDialog(true);
  };

  const createNewFile = async () => {
    if (!newFileName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a file name",
        variant: "destructive",
      });
      return;
    }

    const selectedLang = LANGUAGE_OPTIONS.find(l => l.value === newFileLanguage);
    const extension = selectedLang?.ext || ".txt";
    const fileName = newFileName.includes(".") ? newFileName : `${newFileName}${extension}`;

    const { data: newFile, error } = await supabase
      .from('files')
      .insert({
        room_id: roomId,
        name: fileName,
        content: `// New ${selectedLang?.label || "file"}\n`,
        language: newFileLanguage
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create file",
        variant: "destructive",
      });
      return;
    }

    if (newFile) {
      setFiles([...files, {
        id: newFile.id,
        name: newFile.name,
        content: newFile.content,
        language: newFile.language
      }]);
      setActiveFileId(newFile.id);
    }
    
    setShowNewFileDialog(false);
    setNewFileName("");
    
    toast({
      title: "File created",
      description: `${fileName} has been created`,
    });
  };

  const closeFile = async (fileId: string) => {
    if (files.length === 1) return;
    
    await supabase
      .from('files')
      .delete()
      .eq('id', fileId);
    
    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);
    if (activeFileId === fileId) {
      setActiveFileId(newFiles[0].id);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      user: username,
      text: messageInput,
      timestamp: new Date()
    };
    
    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  const runCode = () => {
    setShowOutput(true);
    try {
      const code = activeFile?.content || "";
      const language = activeFile?.language || "unknown";
      
      // Enhanced mock compiler with language-specific output
      let simulatedOutput = "";
      
      if (language === "javascript" || language === "typescript") {
        simulatedOutput = `Running ${activeFile?.name}...\n\n✓ TypeScript Compilation successful!\n✓ JavaScript execution completed\n\nOutput:\n${"=".repeat(50)}\nHello World\nExecution finished in 42ms\n${"=".repeat(50)}\n\n[Demo Mode: Code would run in secure sandbox]`;
      } else if (language === "python") {
        simulatedOutput = `Running ${activeFile?.name}...\n\n✓ Python ${activeFile?.name} executed successfully\n\nOutput:\n${"=".repeat(50)}\nHello World\nExecution time: 0.034s\n${"=".repeat(50)}\n\n[Demo Mode: Code would run in secure sandbox]`;
      } else {
        simulatedOutput = `Compiling ${activeFile?.name}...\n\n✓ Compilation successful!\n✓ Program executed\n\nOutput:\n${"=".repeat(50)}\nProgram output appears here\n${"=".repeat(50)}\n\n[Demo Mode: Code would run in secure sandbox]`;
      }
      
      setOutput(simulatedOutput);
      
      toast({
        title: "Code executed",
        description: "Check the output window",
      });
    } catch (error) {
      setOutput(`${"=".repeat(50)}\nERROR\n${"=".repeat(50)}\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nStack trace:\n  at line 1:1`);
      toast({
        title: "Execution error",
        description: "Check the output window for details",
        variant: "destructive",
      });
    }
  };

  const leaveRoom = () => {
    navigate("/");
    toast({
      title: "Left room",
      description: "You have left the collaboration session",
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-14 bg-gradient-to-r from-background to-muted border-b border-border flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-foreground">CodeSync</span>
          <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">Room: {roomId}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full mr-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">1 user</span>
          </div>
          <ThemeToggle />
          <Link to="/profile">
            <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          <Link to="/">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
                <LogOut className="h-4 w-4 mr-2" />
                Leave Room
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this room?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  You will exit the collaboration session. All code is auto-saved to the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={leaveRoom} className="bg-rose-600 hover:bg-rose-700 text-white">
                  Leave Room
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-12 bg-sidebar-bg border-r border-border flex flex-col items-center py-4 gap-4">
          <Button variant="ghost" size="icon" className="hover:bg-muted">
            <FileCode className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-muted">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>

        {/* File Explorer */}
        <div className="w-64 bg-panel-bg border-r border-border flex flex-col">
          <div className="h-10 border-b border-border flex items-center justify-between px-3">
            <span className="text-xs font-medium text-muted-foreground uppercase">Explorer</span>
            <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Create New File</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Choose a filename and language for your new file
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="filename">File Name</Label>
                    <Input
                      id="filename"
                      placeholder="e.g., main or app.js"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="bg-input border-border"
                      onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={newFileLanguage} onValueChange={setNewFileLanguage}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label} ({lang.ext})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createNewFile} className="bg-primary hover:bg-primary/90">
                    Create File
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-smooth ${
                    activeFileId === file.id 
                      ? 'bg-muted text-foreground' 
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <FileCode className="h-4 w-4" />
                  {file.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs with Run Button */}
          <div className="h-10 bg-editor-bg border-b border-border flex items-center justify-between">
            <div className="flex items-center overflow-x-auto">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`h-full px-4 flex items-center gap-2 border-r border-border cursor-pointer transition-smooth ${
                    activeFileId === file.id
                      ? 'bg-panel-bg text-foreground'
                      : 'text-muted-foreground hover:bg-muted/30'
                  }`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <span className="text-sm">{file.name}</span>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFile(file.id);
                      }}
                      className="hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center px-2">
              <Button onClick={runCode} size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-lg">
                <Play className="h-4 w-4 mr-2" />
                Run Code
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={activeFile?.language || "typescript"}
              value={activeFile?.content || ""}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                padding: { top: 16 },
              }}
            />
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-80 bg-panel-bg border-l border-border flex flex-col">
          <div className="h-10 border-b border-border flex items-center px-4">
            <MessageSquare className="h-4 w-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Chat</span>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm mt-8">
                No messages yet. Start chatting!
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-primary">{msg.user}</span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{msg.text}</p>
                </div>
              ))
            )}
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-editor-bg border-border"
              />
              <Button onClick={sendMessage} size="icon" className="bg-primary hover:bg-primary/90">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Output Dialog Popup */}
      <Dialog open={showOutput} onOpenChange={setShowOutput}>
        <DialogContent className="max-w-3xl max-h-[80vh] bg-editor-bg border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Output
            </DialogTitle>
            <DialogDescription>
              Code compilation and execution results
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-md bg-black/20 p-4">
            <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">
              {output || "Run your code to see output here..."}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowOutput(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Bar */}
      <div className="h-6 bg-statusBar border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>TypeScript</span>
          <span>UTF-8</span>
        </div>
        <div>Line 1, Col 1</div>
      </div>
    </div>
  );
};

export default Room;
