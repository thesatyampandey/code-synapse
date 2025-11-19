import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, MessageSquare, Users, FileCode, Plus, X, Send, Home, LogOut, Play, Terminal, User, Download, ThumbsUp, Heart, Smile as SmileIcon, Share2, Copy, CheckCircle2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import QRCode from "react-qr-code";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { TypingIndicator, useTypingIndicator } from "@/components/TypingIndicator";
import { RoomMembers } from "@/components/RoomMembers";
import { Badge } from "@/components/ui/badge";
import { Crown, Edit3, Eye } from "lucide-react";
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

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  reactions?: { [emoji: string]: number };
}

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([
    { id: "1", name: "index.tsx", content: "// Welcome to CodeSync!\n// Start coding together...\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;", language: "typescript" }
  ]);
  const [activeFileId, setActiveFileId] = useState("1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [output, setOutput] = useState<string>("");
  const [showOutput, setShowOutput] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [messagesChannel, setMessagesChannel] = useState<any>(null);
  const [editorChannel, setEditorChannel] = useState<any>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [cursorPositions, setCursorPositions] = useState<Record<string, { line: number; column: number; email: string }>>({});
  const { typingUsers, handleTyping } = useTypingIndicator(
    roomId || "",
    messagesChannel,
    user?.email || ""
  );
  const [newFileName, setNewFileName] = useState("");
  const [newFileLanguage, setNewFileLanguage] = useState("typescript");
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [userRole, setUserRole] = useState<"owner" | "editor" | "viewer" | null>(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [editorSettings, setEditorSettings] = useState({
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

  // Load editor settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("editorSettings");
    if (savedSettings) {
      setEditorSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to access rooms.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/auth');
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Load files, messages and setup realtime when authenticated
  useEffect(() => {
    if (!roomId || !user || loading) return;
    
    const joinRoom = async () => {
      // Ensure profile exists for current user
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
      if (profileErr) {
        console.error('Error ensuring profile:', profileErr);
      }

      // Try to join as editor by default (no RETURNING to avoid SELECT RLS)
      const { error } = await supabase
        .from('room_members')
        .insert({ room_id: roomId, user_id: user.id, role: 'editor' });
      
      if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
        console.error('Error joining room:', error);
      }

      // Load user's role
      const { data: memberData } = await supabase
        .from('room_members')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberData) {
        setUserRole(memberData.role);
      }
    };

    joinRoom();
    loadFiles();
    loadMessages();
    
    toast({
      title: "Connected to room",
      description: `Room ID: ${roomId}`,
    });

    // Setup realtime subscriptions
    const filesChannel = supabase
      .channel(`files-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('File change:', payload);
          loadFiles();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel(`messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('New message:', payload);
          const newMsg = payload.new;
          
          // Fetch sender email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', newMsg.sender_id)
            .single();
          
          setMessages((prev) => [
            ...prev,
            {
              id: newMsg.id,
              user: profile?.email || 'Unknown',
              text: newMsg.text,
              timestamp: new Date(newMsg.created_at),
              reactions: newMsg.reactions || {},
            },
          ]);
        }
      )
      .subscribe();

    setMessagesChannel(messagesChannel);

    // Setup cursor tracking channel
    const cursorChannel = supabase
      .channel(`room-cursors-${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = cursorChannel.presenceState();
        const positions: Record<string, { line: number; column: number; email: string }> = {};
        
        Object.keys(state).forEach(key => {
          const presences = state[key];
          if (presences.length > 0) {
            const presence = presences[0] as any;
            if (presence.user_id !== user.id) {
              positions[presence.user_id] = {
                line: presence.line,
                column: presence.column,
                email: presence.email,
              };
            }
          }
        });
        
        setCursorPositions(positions);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await cursorChannel.track({
            user_id: user.id,
            email: user.email,
            line: 1,
            column: 1,
          });
        }
      });

    setEditorChannel(cursorChannel);

    return () => {
      supabase.removeChannel(filesChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(cursorChannel);
    };
  }, [roomId, user, loading, toast]);

  const loadMessages = async () => {
    const { data: msgs, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const senderIds = Array.from(new Set((msgs || []).map((m: any) => m.sender_id)));
    let profilesMap: Record<string, string> = {};
    if (senderIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', senderIds);
      profilesMap = (profs || []).reduce((acc: any, p: any) => {
        acc[p.id] = p.email;
        return acc;
      }, {} as Record<string, string>);
    }

    setMessages(
      (msgs || []).map((msg: any) => ({
        id: msg.id,
        user: profilesMap[msg.sender_id] || 'Unknown',
        text: msg.text,
        timestamp: new Date(msg.created_at),
        reactions: msg.reactions || {},
      }))
    );
  };

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

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFile) {
      setFiles(files.map(f => 
        f.id === activeFileId ? { ...f, content: value } : f
      ));

      // Debounce auto-save to database
      if (editorSettings.autoSave) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(async () => {
          await supabase
            .from('files')
            .update({ content: value })
            .eq('id', activeFileId);
        }, editorSettings.autoSaveInterval * 1000);
      }
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

  const addNewFile = () => {
    if (userRole === 'viewer') {
      toast({
        title: "Permission denied",
        description: "Viewers cannot create files",
        variant: "destructive",
      });
      return;
    }
    setShowNewFileDialog(true);
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case "owner":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50">
            <Crown className="h-3 w-3 mr-1" />
            Owner
          </Badge>
        );
      case "editor":
        return (
          <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50">
            <Edit3 className="h-3 w-3 mr-1" />
            Editor
          </Badge>
        );
      case "viewer":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Eye className="h-3 w-3 mr-1" />
            Viewer
          </Badge>
        );
      default:
        return null;
    }
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
    
    // Check permission
    if (userRole !== 'owner') {
      toast({
        title: "Permission denied",
        description: "Only owners can delete files",
        variant: "destructive",
      });
      return;
    }
    
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

  const sendMessage = async () => {
    if (!messageInput.trim() || !user) return;

    // Sanitize message to prevent XSS
    const sanitizedMessage = messageInput
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        text: sanitizedMessage,
      });

    if (error) {
      toast({
        title: "Failed to send message",
        variant: "destructive",
      });
      return;
    }

    setMessageInput("");
    
    // Stop typing indicator
    if (messagesChannel) {
      messagesChannel.send({
        type: "broadcast",
        event: "stop-typing",
        payload: { email: user.email },
      });
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const reactions = { ...message.reactions };
    reactions[emoji] = (reactions[emoji] || 0) + 1;

    await supabase
      .from('messages')
      .update({ reactions })
      .eq('id', messageId);

    setMessages(
      messages.map((msg) =>
        msg.id === messageId ? { ...msg, reactions } : msg
      )
    );
  };

  const downloadCode = () => {
    if (!activeFile) return;
    
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File downloaded",
      description: `${activeFile.name} has been downloaded`,
    });
  };

  const downloadProject = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Add all files to zip
    files.forEach((file) => {
      zip.file(file.name, file.content);
    });
    
    // Add README
    const readme = `# CodeSync Project\n\nRoom ID: ${roomId}\nExported: ${new Date().toISOString()}\nFiles: ${files.length}\n\n## Files\n${files.map(f => `- ${f.name}`).join('\n')}`;
    zip.file('README.md', readme);
    
    // Generate and download
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codesync-${roomId}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Project downloaded",
      description: `All ${files.length} files exported`,
    });
  };

  const shareRoom = () => {
    setShowShareDialog(true);
    setLinkCopied(false);
  };

  const copyRoomLink = async () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setLinkCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your team",
      });
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const runCode = async () => {
    if (!activeFile || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to execute code.",
        variant: "destructive",
      });
      return;
    }

    const isExecutable = LANGUAGE_OPTIONS.find(l => l.value === activeFile.language)?.executable;
    if (!isExecutable) {
      toast({
        title: "Cannot execute",
        description: `${activeFile.language.toUpperCase()} files cannot be executed. Only programming languages like Python, JavaScript, C++, etc. can run.`,
        variant: "destructive",
      });
      return;
    }
    
    setShowOutput(true);
    setIsExecuting(true);
    setOutput("Executing code...\nPlease wait...");
    
    try {
      const code = activeFile.content;
      const language = activeFile.language;
      
      console.log('Running code:', { language, fileName: activeFile.name });
      
      toast({
        title: `Executing ${LANGUAGE_OPTIONS.find(l => l.value === language)?.label} code...`,
        description: "Running your code in a secure sandbox",
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the edge function to execute code with authentication
      const { data, error } = await supabase.functions.invoke('execute-code', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: { code, language }
      });

      if (error) {
        setOutput(`${"=".repeat(50)}\nERROR\n${"=".repeat(50)}\n\n${error.message}\n\nPlease try again or check your code.`);
        toast({
          title: "Execution error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      setOutput(data.output || "No output generated");
      
      if (data.success) {
        toast({
          title: "Code executed successfully",
          description: "Check the output window for results",
        });
      } else {
        toast({
          title: "Execution completed with errors",
          description: "Check the output window for details",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      setOutput(`${"=".repeat(50)}\nERROR\n${"=".repeat(50)}\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your code and try again.`);
      toast({
        title: "Execution error",
        description: "Failed to execute code",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const leaveRoom = () => {
    navigate("/");
    toast({
      title: "Left room",
      description: "You have left the collaboration session",
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading room...</p>
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
          <span className="font-bold text-lg text-foreground">CodeSync</span>
          <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">Room: {roomId}</span>
          {getRoleBadge()}
        </div>
        <div className="flex items-center gap-2">
          {roomId && <PresenceIndicator roomId={roomId} />}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowMembersPanel(!showMembersPanel)}
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Members
          </Button>
          <Button size="sm" variant="outline" onClick={shareRoom} className="border-primary text-primary hover:bg-primary hover:text-white">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Link to="/settings">
            <Button size="sm" variant="ghost">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
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
            <div className="flex items-center gap-2 px-2">
              <Button 
                onClick={downloadCode} 
                size="sm" 
                variant="outline"
                className="border-border hover:bg-muted"
                title="Download current file"
              >
                <Download className="h-4 w-4 mr-2" />
                File
              </Button>
              <Button 
                onClick={downloadProject} 
                size="sm" 
                variant="outline"
                className="border-border hover:bg-muted"
                title="Download all files as ZIP"
              >
                <Download className="h-4 w-4 mr-2" />
                Project
              </Button>
              <Select 
                value={activeFile?.language || "typescript"} 
                onValueChange={(newLang) => {
                  if (activeFile) {
                    setFiles(files.map(f => 
                      f.id === activeFileId ? { ...f, language: newLang } : f
                    ));
                    supabase.from('files').update({ language: newLang }).eq('id', activeFileId);
                  }
                }}
              >
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
              <Button 
                onClick={runCode} 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                disabled={isExecuting || !LANGUAGE_OPTIONS.find(l => l.value === activeFile?.language)?.executable}
                title={!LANGUAGE_OPTIONS.find(l => l.value === activeFile?.language)?.executable ? "This language is not executable" : "Run code"}
              >
                <Play className={`h-4 w-4 mr-2 ${isExecuting ? 'animate-spin' : ''}`} />
                {isExecuting ? 'Running...' : 'Run Code'}
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={activeFile?.language || "typescript"}
              value={activeFile?.content || ""}
              onChange={handleEditorChange}
              onMount={(editor) => {
                setEditorInstance(editor);
                
                // Track cursor position changes
                editor.onDidChangeCursorPosition((e) => {
                  if (editorChannel && user) {
                    editorChannel.track({
                      user_id: user.id,
                      email: user.email,
                      line: e.position.lineNumber,
                      column: e.position.column,
                    });
                  }
                });
              }}
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
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                padding: { top: 16 },
              }}
            />
            
            {/* Render other users' cursors */}
            {Object.entries(cursorPositions).map(([userId, pos]) => (
              <div
                key={userId}
                className="absolute pointer-events-none z-10 text-xs font-medium px-2 py-1 rounded shadow-lg"
                style={{
                  top: `${(pos.line - 1) * (editorSettings.fontSize * 1.5) + 16}px`,
                  left: `${pos.column * (editorSettings.fontSize * 0.6) + 60}px`,
                  backgroundColor: `hsl(${(userId.charCodeAt(0) * 137) % 360}, 70%, 50%)`,
                  color: 'white',
                }}
              >
                {pos.email}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Panel or Members Panel */}
        {showMembersPanel ? (
          <div className="w-80 bg-panel-bg border-l border-border flex flex-col">
            <div className="h-10 border-b border-border flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Room Members</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMembersPanel(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {user && roomId && (
              <RoomMembers
                roomId={roomId}
                currentUserId={user.id}
                userRole={userRole}
              />
            )}
          </div>
        ) : (
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
                <div key={msg.id} className="mb-4 group">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-primary">{msg.user}</span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">{msg.text}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => addReaction(msg.id, "👍")}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => addReaction(msg.id, "❤️")}
                    >
                      <Heart className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => addReaction(msg.id, "😄")}
                    >
                      <SmileIcon className="h-3 w-3" />
                    </Button>
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex gap-1 ml-2">
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <span 
                            key={emoji} 
                            className="text-xs bg-muted px-2 py-0.5 rounded-full"
                          >
                            {emoji} {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <TypingIndicator typingUsers={typingUsers} />
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-editor-bg border-border"
              />
              <Button onClick={sendMessage} size="icon" className="bg-primary hover:bg-primary/90">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Share Room Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Room
            </DialogTitle>
            <DialogDescription>
              Share this link with your team to collaborate together
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCode
                value={`${window.location.origin}/room/${roomId}`}
                size={200}
                level="H"
              />
            </div>
            
            {/* Shareable Link */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Room Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/room/${roomId}`}
                  className="bg-muted border-border font-mono text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button 
                  onClick={copyRoomLink}
                  size="icon"
                  variant={linkCopied ? "default" : "outline"}
                  className={linkCopied ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {linkCopied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Room ID */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Room ID</Label>
              <div className="px-4 py-2 bg-muted rounded-lg border border-border">
                <code className="text-sm font-mono text-primary">{roomId}</code>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowShareDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Output Dialog Popup */}
      <Dialog open={showOutput} onOpenChange={setShowOutput}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-editor-bg border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-green-500" />
              Code Execution Output
            </DialogTitle>
            <DialogDescription>
              Real-time code compilation and execution results powered by Piston API
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto rounded-lg bg-black/30 p-4 border border-border">
            {isExecuting ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Play className="h-4 w-4 animate-spin" />
                <span className="text-sm">Executing code in secure sandbox...</span>
              </div>
            ) : (
              <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">
                {output || "Run your code to see output here..."}
              </pre>
            )}
          </div>
          <DialogFooter className="gap-2">
            {!isExecuting && (
              <Button 
                variant="outline" 
                onClick={runCode}
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Run Again
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowOutput(false)} disabled={isExecuting}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Bar */}
      <div className="h-6 bg-statusBar border-t border-border flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{LANGUAGE_OPTIONS.find(l => l.value === activeFile?.language)?.label || "Text"}</span>
          <span>UTF-8</span>
          <span className="text-green-500">
            {LANGUAGE_OPTIONS.find(l => l.value === activeFile?.language)?.executable ? "✓ Executable" : "• View Only"}
          </span>
        </div>
        <div>Room: {roomId}</div>
      </div>
    </div>
  );
};

export default Room;
