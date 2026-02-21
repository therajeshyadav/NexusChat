import { useState } from "react";
// import { Compass } from "lucide-react";
import { chatApi } from "@/services/chatApi";

export default function AddFriendPage() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await chatApi.sendFriendRequest(username.trim());
      setMessage(`Success! Your friend request to ${username} was sent.`);
      setUsername("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Hm, didn't work. Double check that the username is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-4">
        <h2 className="mb-2 text-base font-bold uppercase text-foreground">Add Friend</h2>
        <p className="text-sm text-muted-foreground">
          You can add friends with their Discord username.
        </p>
      </div>

      <div className="rounded-lg border border-discord-darkest bg-discord-darker p-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
          placeholder="You can add friends with their Discord username."
          className="w-full rounded-md bg-discord-input-bg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          disabled={loading}
        />

        <button
          onClick={handleSendRequest}
          disabled={loading || !username.trim()}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Friend Request"}
        </button>

        {message && (
          <div className="mt-3 text-sm text-green-400">{message}</div>
        )}
        {error && (
          <div className="mt-3 text-sm text-red-400">{error}</div>
        )}
      </div>

      {/* Explore Discoverable Servers - Commented for now */}
      {/* <div className="mb-4 mt-6">
        <h3 className="mb-2 text-base font-bold uppercase text-foreground">
          Other Places to Make Friends
        </h3>
        <p className="text-sm text-muted-foreground">
          Don't have a username on hand? Check out our list of public servers that includes everything from gaming to cooking, music, anime and more.
        </p>
      </div>

      <button className="flex items-center gap-3 rounded-lg bg-discord-darker px-4 py-3 transition-colors hover:bg-discord-hover">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
          <Compass className="h-6 w-6 text-white" />
        </div>
        <span className="font-medium text-foreground">Explore Discoverable Servers</span>
        <svg className="ml-auto h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button> */}
    </div>
  );
}
