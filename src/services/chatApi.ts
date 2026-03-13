import { api } from "./axios";

export const chatApi = {
  getServers: () =>
    api.get("/servers").then((res) => res.data),

  getMembers: (serverId: string) =>
    api.get(`/servers/${serverId}/members`).then((res) => res.data),

  createServer: (name: string) =>
    api.post("/servers", { name }).then((res) => res.data),

  updateServer: (serverId: string, name: string) =>
    api.put(`/servers/${serverId}`, { name }).then((res) => res.data),

  deleteServer: (serverId: string) =>
    api.delete(`/servers/${serverId}`).then((res) => res.data),

  createChannel: (serverId: string, name: string, type: "text" | "voice", category?: string) =>
    api.post(`/servers/${serverId}/channels`, { name, type, category }).then((res) => res.data),

  updateChannel: (serverId: string, channelId: string, name: string) =>
    api.put(`/servers/${serverId}/channels/${channelId}`, { name }).then((res) => res.data),

  deleteChannel: (serverId: string, channelId: string) =>
    api.delete(`/servers/${serverId}/channels/${channelId}`).then((res) => res.data),

  joinServer: (inviteCode: string) =>
    api.post("/servers/join", { inviteCode }).then((res) => res.data),

  generateInvite: (serverId: string) =>
    api.post(`/servers/${serverId}/invite`).then((res) => res.data),

  getMessages: (channelId: string) =>
    api.get(`/messages/${channelId}`).then((res) => res.data),

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/messages/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }).then((res) => res.data);
  },

  // Friends APIs
  getFriends: () =>
    api.get("/friends").then((res) => res.data),

  sendFriendRequest: (username: string) =>
    api.post("/friends/request", { username }).then((res) => res.data),

  acceptFriendRequest: (friendId: string) =>
    api.post(`/friends/${friendId}/accept`).then((res) => res.data),

  rejectFriendRequest: (friendId: string) =>
    api.post(`/friends/${friendId}/reject`).then((res) => res.data),

  removeFriend: (friendId: string) =>
    api.delete(`/friends/${friendId}`).then((res) => res.data),

  // DM APIs
  getOrCreateDM: (friendId: number) =>
    api.post("/dm/create", { friendId }).then((res) => res.data),

  getDMs: () =>
    api.get("/dm").then((res) => res.data),

  getDMMessages: (dmId: string) =>
    api.get(`/dm/${dmId}/messages`).then((res) => res.data),
};