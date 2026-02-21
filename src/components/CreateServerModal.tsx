import { useState } from "react";
import { chatApi } from "@/services/chatApi";

interface CreateServerModalProps {
  onClose: () => void;
  onServerCreated: () => void;
}

export default function CreateServerModal({
  onClose,
  onServerCreated,
}: CreateServerModalProps) {

  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;

    await chatApi.createServer(name);
    await onServerCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60">
      <div className="w-96 rounded-lg bg-discord-dark p-6">
        <h2 className="mb-4 text-lg font-bold">Create Your Server</h2>

        <input
          className="w-full rounded bg-discord-input-bg p-2"
          placeholder="Server name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleCreate}
            className="rounded bg-primary px-4 py-1"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
