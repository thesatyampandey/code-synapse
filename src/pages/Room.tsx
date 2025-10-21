import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, MessageSquare, Users, FileCode, Plus, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <div className="h-screen flex flex-col bg-background dark">
      {/* Top Bar */}
      <div className="h-12 bg-statusBar border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">CodeSync</span>
          <span className="text-xs text-muted-foreground">Room: {roomId}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">1 user</span>
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
          {/* Tabs */}
          <div className="h-10 bg-editor-bg border-b border-border flex items-center overflow-x-auto">
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
