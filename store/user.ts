import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserTable } from "@/model/user";

export interface UserState {
  user: UserModel;
  userInfo: UserTable;
  setUserInfo: (_: UserTable) => void;
  patchUserInfo: (info: object) => Promise<void>;
  fetchUserInfo: () => void;
  setUser: (_: UserModel) => void;
  isAuthed: boolean;
  reset: () => void;
}

export interface UserModel {
  id: number;
  username: string;
  email: string;
  last_active_at?: string;
  created_at?: string;
  token?: string;
}

const blankUser: UserModel = {
  id: 0,
  username: "",
  email: "",
  token: undefined,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      return {
        fetchUserInfo: () => {
          fetch("/api/users/info")
            .then((r) => r.json())
            .then((res) => {
              set({ userInfo: res.data });
            })
            .catch(console.error);
        },
        patchUserInfo: async (info: object) => {
          const res = await fetch("/api/users/info", {
            method: "PATCH",
            body: JSON.stringify(info),
          }).then((r) => r.json());
          return res;
        },
        setUserInfo: (v: UserTable) => set({ userInfo: v }),
        reset: () => localStorage.removeItem("user"),
        user: blankUser,
        isAuthed: false,
        setUser: (v: UserModel) => set({ user: v, isAuthed: true }),
      } as UserState;
    },
    {
      name: "user", // name of the item in the storage (must be unique)
    },
  ),
);
