import { MainNavItem, SidebarNavItem } from "@/types/nav";

interface DocsConfig {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Twitter",
      href: "https://twitter.com/neochau",
      external: true,
    },
    {
      title: "Articles",
      href: "/posts",
      external: false,
    },
  ],
  sidebarNav: [
    {
      title: "User",
      items: [
        {
          title: "Profile",
          href: "/profile",
          items: [],
        },
        {
          title: "Login",
          href: "/login",
          items: [],
        },
        {
          title: "Register",
          href: "/register",
          items: [],
        },
        {
          title: "Reset Password",
          href: "/password-reset",
          items: [],
        },
      ],
    },
    {
      title: "Chat GPT",
      items: [
        {
          title: "OpenAI Chat",
          href: "/chat",
          items: [],
        },

        {
          title: "Speech English",
          href: "/tts",
          items: [],
        },
      ],
    },
  ],
};
