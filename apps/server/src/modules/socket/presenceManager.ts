import type { OnlineUserDTO } from "@chat/shared";

export class PresenceManager {
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly userInfo = new Map<string, OnlineUserDTO>();
  private readonly roomUsers = new Map<string, Map<string, Set<string>>>();
  private readonly socketRooms = new Map<string, Set<string>>();

  registerSocket(user: OnlineUserDTO, socketId: string): void {
    this.userInfo.set(user.id, user);
    let sockets = this.userSockets.get(user.id);
    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(user.id, sockets);
    }
    sockets.add(socketId);

    if (!this.socketRooms.has(socketId)) {
      this.socketRooms.set(socketId, new Set<string>());
    }
  }

  joinRoom(roomId: string, user: OnlineUserDTO, socketId: string): OnlineUserDTO[] {
    this.registerSocket(user, socketId);

    let usersInRoom = this.roomUsers.get(roomId);
    if (!usersInRoom) {
      usersInRoom = new Map<string, Set<string>>();
      this.roomUsers.set(roomId, usersInRoom);
    }

    let userRoomSockets = usersInRoom.get(user.id);
    if (!userRoomSockets) {
      userRoomSockets = new Set<string>();
      usersInRoom.set(user.id, userRoomSockets);
    }
    userRoomSockets.add(socketId);

    this.socketRooms.get(socketId)!.add(roomId);
    return this.getRoomUsers(roomId);
  }

  leaveRoom(roomId: string, userId: string, socketId: string): OnlineUserDTO[] {
    const usersInRoom = this.roomUsers.get(roomId);
    if (usersInRoom) {
      const userRoomSockets = usersInRoom.get(userId);
      if (userRoomSockets) {
        userRoomSockets.delete(socketId);
        if (userRoomSockets.size === 0) {
          usersInRoom.delete(userId);
        }
      }
      if (usersInRoom.size === 0) {
        this.roomUsers.delete(roomId);
      }
    }

    this.socketRooms.get(socketId)?.delete(roomId);
    return this.getRoomUsers(roomId);
  }

  disconnectSocket(userId: string, socketId: string): string[] {
    const affectedRooms: string[] = [];
    const rooms = this.socketRooms.get(socketId);
    if (rooms) {
      for (const roomId of rooms) {
        affectedRooms.push(roomId);
        const usersInRoom = this.roomUsers.get(roomId);
        if (usersInRoom) {
          const userRoomSockets = usersInRoom.get(userId);
          if (userRoomSockets) {
            userRoomSockets.delete(socketId);
            if (userRoomSockets.size === 0) {
              usersInRoom.delete(userId);
            }
          }
          if (usersInRoom.size === 0) {
            this.roomUsers.delete(roomId);
          }
        }
      }
      this.socketRooms.delete(socketId);
    }

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        this.userInfo.delete(userId);
      }
    }

    return affectedRooms;
  }

  getRoomUsers(roomId: string): OnlineUserDTO[] {
    const usersInRoom = this.roomUsers.get(roomId);
    if (!usersInRoom) return [];

    const result: OnlineUserDTO[] = [];
    for (const userId of usersInRoom.keys()) {
      const info = this.userInfo.get(userId);
      if (info) {
        result.push(info);
      }
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  isUserOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }

  getConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size ?? 0;
  }
}
