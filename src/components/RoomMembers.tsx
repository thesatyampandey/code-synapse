import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { UserMinus, Crown, Edit3, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  joined_at: string;
  profiles: {
    email: string;
    avatar_url?: string;
  };
}

interface RoomMembersProps {
  roomId: string;
  currentUserId: string;
  userRole: "owner" | "editor" | "viewer" | null;
}

export const RoomMembers = ({ roomId, currentUserId, userRole }: RoomMembersProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();

    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from("room_members")
      .select("*, profiles!room_members_user_id_fkey(email, avatar_url)")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error loading members:", error);
    } else if (data) {
      setMembers(data as any);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from("room_members")
      .update({ role: newRole as "owner" | "editor" | "viewer" })
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Failed to update role",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully",
      });
    }
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Failed to remove member",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Member removed",
        description: "Member has been removed from the room",
      });
    }
    setMemberToRemove(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
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
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium">Members ({members.length})</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {member.profiles?.email?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.profiles?.email}
                    {member.user_id === currentUserId && (
                      <span className="text-xs text-muted-foreground ml-2">(You)</span>
                    )}
                  </p>
                  <div className="mt-1">{getRoleBadge(member.role)}</div>
                </div>
              </div>

              {userRole === "owner" && member.user_id !== currentUserId && (
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value) => updateMemberRole(member.id, value)}
                  >
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMemberToRemove(member.id)}
                    className="h-8 w-8 p-0"
                  >
                    <UserMinus className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This member will be removed from the room and will lose access to all files and
              messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && removeMember(memberToRemove)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
