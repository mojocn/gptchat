import {create} from 'zustand'
import {persist} from 'zustand/middleware'


export interface UserState {
    user: UserModel
    setUser: (_: UserModel) => void
    isAuthed: boolean
    reset: () => void
}

export interface UserModel {
    id: number
    username: string
    email: string
    last_active_at?: string
    created_at?: string
    token?: string
}

const blankUser: UserModel = {
    id: 0,
    username: '',
    email: '',
    token: undefined,
}

export const useUserStore = create<UserState>()(persist(
    (set, get) => {
        return ({
            reset: () => localStorage.removeItem('user'),
            user: blankUser,
            isAuthed: false,
            setUser: (v: UserModel) => set({user: v, isAuthed: true}),
        } as UserState);
    }, {
        name: 'user', // name of the item in the storage (must be unique)
    }),
)

