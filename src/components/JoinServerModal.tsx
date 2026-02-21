import { useState } from "react";
import { chatApi } from "@/services/chatApi";

interface JoinServerModalProps {
  onClose: () => void;
  onServerJoined: () => void;
}

export default function JoinServerModal({
  onClose,
  onServerJoined,
}: JoinServerModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await chatApi.joinServer(inviteCode.trim());
      await onServerJoined();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to join server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-96 rounded-lg bg-discord-dark p-6">
        <h2 className="mb-2 text-xl font-bold text-foreground">Join a Server</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Enter an invite code to join an existing server
        </p>

        <div className="mb-2">
          <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
            Invite Code
          </label>
          <input
            className="w-full rounded bg-discord-input-bg p-2 text-foreground focus:outline-none"
            placeholder="e.g., abc123xyz"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-400">{error}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-foreground transition-colors hover:bg-discord-hover"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            className="rounded bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Joining..." : "Join Server"}
          </button>
        </div>
      </div>
    </div>
  );
}
