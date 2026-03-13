import { useState, useRef } from "react";
import { Camera, LogOut, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/api";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, logout, token } = useAuth();
  const [bio, setBio] = useState((user as any)?.bio || "");
  const [status, setStatus] = useState((user as any)?.status || "online");
  
  // Convert relative URLs to absolute URLs
  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    // Use the auth API base URL (remove /api/auth to get base URL)
    const baseUrl = API_CONFIG.authApiUrl.replace('/api/auth', '');
    return `${baseUrl}${path}`;
  };
  
  const [profileImage, setProfileImage] = useState<string | null>(getImageUrl(user?.avatar));
  const [bannerImage, setBannerImage] = useState<string | null>(getImageUrl((user as any)?.banner));
  const [isUploading, setIsUploading] = useState(false);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setBannerFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setIsUploading(true);
    try {
      const updateData: any = {
        bio,
        status,
      };
      
      if (avatarFile) updateData.avatar = avatarFile;
      if (bannerFile) updateData.banner = bannerFile;

      const result = await authApi.updateProfile(token, updateData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully!");
        // Refresh user data
        window.location.reload();
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold">My Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Banner & Avatar */}
          <div className="relative -mx-6">
            {/* Banner */}
            <div 
              className="h-40 bg-gradient-to-r from-primary to-accent relative overflow-hidden"
              style={bannerImage ? { backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerImageChange}
                className="hidden"
              />
              <button 
                onClick={() => bannerInputRef.current?.click()}
                className="absolute right-4 top-4 rounded-lg bg-black/60 backdrop-blur-sm p-2.5 text-white transition-all hover:bg-black/80 hover:scale-105"
                title="Change banner"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>

            {/* Avatar */}
            <div className="relative px-6 -mt-16">
              <div className="relative inline-block group">
                <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-primary/20">
                  <AvatarImage src={profileImage || undefined} alt={user?.username} />
                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                {/* Camera overlay on avatar */}
                <div 
                  onClick={() => profileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-8 w-8 text-white" />
                </div>
                
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
                
                {/* Status indicator */}
                <div className={`absolute bottom-1 right-1 h-8 w-8 rounded-full border-4 border-background ${
                  status === 'online' ? 'bg-green-500' :
                  status === 'idle' ? 'bg-yellow-500' :
                  status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-5 px-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-foreground">{user?.username}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="font-mono bg-muted px-2 py-0.5 rounded">#{user?.id}</span>
              </p>
            </div>

            <div className="h-px bg-border" />

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
              <Input
                id="username"
                value={user?.username || ""}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <X className="h-3 w-3" />
                Username cannot be changed
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="online">🟢 Online</option>
                <option value="idle">🟡 Idle</option>
                <option value="dnd">🔴 Do Not Disturb</option>
                <option value="invisible">⚫ Invisible</option>
              </select>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-semibold">About Me</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell everyone about yourself..."
                rows={4}
                maxLength={190}
                className="resize-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/190 characters
              </p>
            </div>

            {/* Account Info */}
            <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted p-5 border border-border/50">
              <h3 className="mb-3 text-sm font-bold text-foreground flex items-center gap-2">
                📊 Account Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-semibold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs bg-background px-2 py-1 rounded">{user?.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between border-t px-6 pt-5 pb-2 -mx-6 -mb-2 bg-muted/30">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="gap-2 hover:scale-105 transition-transform"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="hover:scale-105 transition-transform"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveChanges}
                disabled={isUploading}
                className="gap-2 hover:scale-105 transition-transform"
              >
                {isUploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
