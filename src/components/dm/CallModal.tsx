import { Phone, Video, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CallModalProps {
  isOpen: boolean;
  callType: 'voice' | 'video';
  callerUsername: string;
  isIncoming: boolean;
  onAccept?: () => void;
  onReject: () => void;
}

export default function CallModal({
  isOpen,
  callType,
  callerUsername,
  isIncoming,
  onAccept,
  onReject,
}: CallModalProps) {
  const descriptionId = `call-description-${Date.now()}`;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onReject()}>
      <DialogContent 
        className="max-w-md" 
        aria-describedby={descriptionId}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {isIncoming ? 'Incoming Call' : 'Calling...'}
          </DialogTitle>
        </DialogHeader>

        <div id={descriptionId} className="flex flex-col items-center gap-6 py-6">
          {/* Avatar */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-4xl font-bold text-primary-foreground">
            {callerUsername.charAt(0).toUpperCase()}
          </div>

          {/* Username */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground">{callerUsername}</h3>
            <p className="text-sm text-muted-foreground">
              {callType === 'video' ? 'Video' : 'Voice'} Call
            </p>
          </div>

          {/* Call Icon Animation */}
          <div className="flex items-center justify-center">
            {callType === 'video' ? (
              <Video className="h-12 w-12 text-primary animate-pulse" />
            ) : (
              <Phone className="h-12 w-12 text-primary animate-pulse" />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {isIncoming && onAccept && (
              <Button
                onClick={onAccept}
                size="lg"
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Phone className="h-5 w-5" />
                Accept
              </Button>
            )}
            <Button
              onClick={onReject}
              size="lg"
              variant="destructive"
              className="gap-2"
            >
              <PhoneOff className="h-5 w-5" />
              {isIncoming ? 'Decline' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
