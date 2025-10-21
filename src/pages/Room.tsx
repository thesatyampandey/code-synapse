import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, MessageSquare, Users, FileCode, Plus, X, Send, Home, LogOut, Play, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

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

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }
    
    toast({
      title: "Connected to room",
      description: `Room ID: ${roomId}`,
    });
  }, [roomId, navigate, toast]);

  const activeFile = files.find(f => f.id === activeFileId);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFile) {
      setFiles(files.map(f => 
        f.id === activeFileId ? { ...f, content: value } : f
      ));
    }
  };

  const addNewFile = () => {
    const newFile: File = {
      id: Date.now().toString(),
      name: `untitled-${files.length + 1}.tsx`,
      content: "// New file\n",
      language: "typescript"
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  const closeFile = (fileId: string) => {
    if (files.length === 1) return;
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
      // Simple mock compiler - in production, this would send to a backend
      const code = activeFile?.content || "";
      
      // For demo purposes, we'll simulate output
      setOutput(`Compiling ${activeFile?.name}...\n\n✓ Compilation successful!\n\nOutput:\nCode executed successfully.\n\n[Note: This is a demo compiler. In production, code would be executed in a secure sandbox environment.]`);
      
      toast({
        title: "Code compiled",
        description: "Check the output panel below",
      });
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Compilation error",
        description: "Check the output panel for details",
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
    <div className="h-screen flex flex-col bg-background dark">
      {/* Top Bar */}
      <div className="h-12 bg-statusBar border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">CodeSync</span>
          <span className="text-xs text-muted-foreground">Room: {roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">1 user</span>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-1" />
                Leave Room
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this room?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  You will exit the collaboration session. Your code changes may not be saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={leaveRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addNewFile}>
              <Plus className="h-4 w-4" />
            </Button>
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
              <Button onClick={runCode} size="sm" className="bg-primary hover:bg-primary/90">
                <Play className="h-4 w-4 mr-1" />
                Run Code
              </Button>
            </div>
          </div>

          {/* Monaco Editor & Output Panel */}
          <div className="flex-1 flex flex-col">
            <div className={showOutput ? "h-2/3" : "flex-1"}>
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

            {/* Output Panel */}
            {showOutput && (
              <div className="h-1/3 border-t border-border bg-editor-bg flex flex-col">
                <div className="h-10 border-b border-border flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Output</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOutput(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">
                    {output || "Run your code to see output here..."}
                  </pre>
                </ScrollArea>
              </div>
            )}
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
