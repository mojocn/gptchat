import { create } from "zustand";

export interface UiStore {
  isChatMsgListHitBottom: boolean;
  setIsChatMsgListHitBottom: (_: boolean) => void;

  isChatInputBlur: boolean;
  setIsChatInputBlur: (_: boolean) => void;

  isScrollTop: boolean;
  setIsScrollTop: (_: boolean | undefined) => void;

  isScrollBottom: boolean;
  setIsScrollBottom: (_: boolean | undefined) => void;

  isScrollAuto: boolean;
  setIsScrollAuto: (_: boolean | undefined) => void;
}

export const useUiStore = create<UiStore>()(
  (set, get) =>
    ({
      isChatMsgListHitBottom: false,
      setIsChatMsgListHitBottom: (v: boolean) =>
        set({ isChatMsgListHitBottom: v }),

      isScrollBottom: true,
      setIsScrollBottom: (v: boolean) => set({ isScrollBottom: v }),

      isScrollAuto: true,
      setIsScrollAuto: (v: boolean) => set({ isScrollAuto: v }),

      isScrollTop: true,
      setIsScrollTop: (v: boolean) => set({ isScrollTop: v }),

      isChatInputBlur: false,
      setIsChatInputBlur: (v: boolean) => set({ isChatInputBlur: v }),
    }) as UiStore,
);
