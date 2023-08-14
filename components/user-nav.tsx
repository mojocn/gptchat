import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import favcon from "@/app/favicon-16x16.png";
import { useUserStore } from "@/store/user";
import {
  Cloud,
  CreditCard,
  Donut,
  HeartHandshake,
  Languages,
  LogOut,
  Moon,
  Palette,
  ShoppingCart,
  Sun,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { lemonCheckoutURL } from "@/types/lemon";
import { showToast } from "@/components/ui-lib";
import { useRouter } from "next/navigation";
import { useLocal } from "@/store/local";

const REPO_URL = "https://github.com/mojocn/gptchat/issues";

export function UserNav() {
  const { isAuthed, user } = useUserStore();
  const { setTheme } = useTheme();
  const router = useRouter();
  const { t, setLang } = useLocal();

  async function doLogout() {
    if (isAuthed) {
      const res = await fetch("/api/logout");
      if (res.ok) {
        //remove local storage
        localStorage.clear();
        showToast("Clear local cache");
      }
    }
  }

  async function doProfile() {
    if (isAuthed) {
      router.push("/profile");
    }
  }

  async function doBilling() {
    if (isAuthed) {
      router.push("/billing");
    }
  }

  function doLogin() {
    router.push("/login");
  }

  function doRegister() {
    router.push("/register");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-6 w-6">
            <AvatarImage src={favcon.src} alt="@shadcn" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel title={user.email} className={"mx-2"}>
          {isAuthed ? `${user.username}` : `Welcome`}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Donut className="mr-2 h-4 w-4" />
                <span>Auto</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>Languages</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setLang("en")}>
                <span className="mr-2 h-4 w-4">🇺🇸</span>
                <span>English</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang("zh")}>
                <span className="mr-2 h-4 w-4">🇨🇳</span>
                <span>Chinese</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />

        {isAuthed ? (
          <>
            <DropdownMenuItem onClick={doProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut></DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={doBilling}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
              <DropdownMenuShortcut></DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={doLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
              <DropdownMenuShortcut></DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={doLogin}>
              <Cloud className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={doRegister}>
              <Cloud className="mr-2 h-4 w-4" />
              <span>Register</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            const url = lemonCheckoutURL(user.email, user.id);
            window.open(url, "_blank");
          }}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          <span>Store</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            window.open(REPO_URL, "_blank");
          }}
        >
          <HeartHandshake className="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
