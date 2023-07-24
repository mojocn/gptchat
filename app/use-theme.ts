import {useConfigStore} from "@/store/config";
import {useEffect} from "react";
import {Theme} from "@/types/const";

export function useTheme() {
    const {theme} = useConfigStore()
    useEffect(() => {
        // On page load or when changing themes, best to add inline in `head` to avoid FOUC
        if (theme === Theme.Dark || (theme === Theme.Auto && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        if (theme === Theme.Light || (theme === Theme.Auto && window.matchMedia('(prefers-color-scheme: light)').matches)) {
            document.documentElement.classList.add('light')
        } else {
            document.documentElement.classList.remove('light')
        }
    }, [theme])
}