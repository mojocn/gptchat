"use client";
import { Metadata } from "next";
import Image from "next/image";
import {
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconMinus, IconPlus, IconSpherePlus } from "@tabler/icons-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { HTMLAttributes, useState } from "react";

type Playlist = (typeof playlists)[number];
const playlists = ["Mick Jackson", "Acme Ltd"];

interface Album {
  name: string;
  artist: string;
  cover: string;
}

import qichun from "@/images/qichun.jpg";
import wuhan from "@/images/wuhan.png";
import hangzhou from "@/images/hangzhou.webp";
import gelihaian from "@/images/gelihaian.jpeg";
import zhuhai2 from "@/images/zhuhai2.jpg";
import wifeNsan from "@/images/wifeNsan.jpg";
import oldFather from "@/images/oldFather.jpg";
import kid2 from "@/images/kid2.jpg";
import kid3 from "@/images/kid3.jpg";
import blueKid from "@/images/blueKid.jpg";
import { useTheme } from "next-themes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

const placeItem: Album[] = [
  {
    name: "Qichun",
    artist: "The village where I grew up",
    cover: qichun.src,
  },
  {
    name: "Wuhan",
    artist: "The City where I studied",
    cover: wuhan.src,
  },
  {
    name: "Hangzhou",
    artist: "The City where I worked",
    cover: hangzhou.src,
  },
  {
    name: "Zhuhai",
    artist: "The city where my son likes",
    cover: zhuhai2.src,
  },
  {
    name: "Gree Coast",
    artist: "The place My family lives",
    cover: gelihaian.src,
  },
];

const madeForYouAlbums: Album[] = [
  {
    name: "Wife and Son",
    artist: "A joyous child with his mother",
    cover: wifeNsan.src,
  },

  {
    name: "The Kid",
    artist: "The playful and cheerful child",
    cover: kid2.src,
  },
  {
    name: "Child at the aquarium",
    artist: "Happy child",
    cover: blueKid.src,
  },
  {
    name: "The lady",
    artist: "Mother and son spend quality time together",
    cover: kid3.src,
  },
  {
    name: "Grandpa",
    artist: "The gentle grandfather",
    cover: oldFather.src,
  },
];

interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  playlists: Playlist[];
}

function InnerSidebar({ className, playlists }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Discover
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              Life Gallery
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
                <circle cx="12" cy="12" r="2" />
                <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
                <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
              </svg>
              Radio
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Library
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M21 15V6" />
                <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path d="M12 12H3" />
                <path d="M16 6H3" />
                <path d="M12 18H3" />
              </svg>
              Playlists
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <circle cx="8" cy="18" r="4" />
                <path d="M12 18V2l7 4" />
              </svg>
              Songs
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Made for You
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
                <circle cx="17" cy="7" r="5" />
              </svg>
              Artists
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="m16 6 4 14" />
                <path d="M12 6v14" />
                <path d="M8 8v12" />
                <path d="M4 4v16" />
              </svg>
              Albums
            </Button>
          </div>
        </div>
        <div className="py-2">
          <h2 className="relative px-7 text-lg font-semibold tracking-tight">
            Playlists
          </h2>
          <ScrollArea className="h-[300px] px-1">
            <div className="space-y-1 p-2">
              {playlists?.map((playlist, i) => (
                <Button
                  key={`${playlist}-${i}`}
                  variant="ghost"
                  className="w-full justify-start font-normal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <path d="M21 15V6" />
                    <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                    <path d="M12 12H3" />
                    <path d="M16 6H3" />
                    <path d="M12 18H3" />
                  </svg>
                  {playlist}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function InnerTopMusicNavBar() {
  function gotoURL(url: string) {
    //open url in a new tab
    const win = window.open(url, "_blank");
    win?.focus();
  }

  return (
    <Menubar className="rounded-none border-b border-none px-2 lg:px-4">
      <MenubarMenu>
        <MenubarTrigger className="font-bold">Music</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>About Music</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Preferences... <MenubarShortcut>⌘,</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Hide Music... <MenubarShortcut>⌘H</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Hide Others... <MenubarShortcut>⇧⌘H</MenubarShortcut>
          </MenubarItem>
          <MenubarShortcut />
          <MenubarItem>
            Quit Music <MenubarShortcut>⌘Q</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="relative">File</MenubarTrigger>
        <MenubarContent>
          <MenubarSub>
            <MenubarSubTrigger>New</MenubarSubTrigger>
            <MenubarSubContent className="w-[230px]">
              <MenubarItem>
                Playlist <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled>
                Playlist from Selection <MenubarShortcut>⇧⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Smart Playlist... <MenubarShortcut>⌥⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>Playlist Folder</MenubarItem>
              <MenubarItem disabled>Genius Playlist</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem>
            Open Stream URL... <MenubarShortcut>⌘U</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Close Window <MenubarShortcut>⌘W</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Library</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Update Cloud Library</MenubarItem>
              <MenubarItem>Update Genius</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Organize Library...</MenubarItem>
              <MenubarItem>Export Library...</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Import Playlist...</MenubarItem>
              <MenubarItem disabled>Export Playlist...</MenubarItem>
              <MenubarItem>Show Duplicate Items</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Get Album Artwork</MenubarItem>
              <MenubarItem disabled>Get Track Names</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem>
            Import... <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>Burn Playlist to Disc...</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Show in Finder <MenubarShortcut>⇧⌘R</MenubarShortcut>{" "}
          </MenubarItem>
          <MenubarItem>Convert</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Page Setup...</MenubarItem>
          <MenubarItem disabled>
            Print... <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem disabled>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem disabled>
            Cut <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Copy <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Paste <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Select All <MenubarShortcut>⌘A</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Deselect All <MenubarShortcut>⇧⌘A</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Smart Dictation...{" "}
            <MenubarShortcut>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4"
                viewBox="0 0 24 24"
              >
                <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
                <circle cx="17" cy="7" r="5" />
              </svg>
            </MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Emoji & Symbols{" "}
            <MenubarShortcut>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="hidden md:block">Account</MenubarTrigger>
        <MenubarContent forceMount>
          <MenubarLabel inset>Github Account</MenubarLabel>
          <MenubarSeparator />
          <MenubarRadioGroup value="mojocn">
            <MenubarRadioItem
              value="mojocn"
              onClick={() => gotoURL("https://github.com/mojocn")}
            >
              mojocn
            </MenubarRadioItem>
            <MenubarRadioItem
              value="go-gorm"
              onClick={() => gotoURL("https://github.com/go-gorm")}
            >
              ORG:go-gorm
            </MenubarRadioItem>
            <MenubarRadioItem
              value="bytegang"
              onClick={() => gotoURL("https://github.com/bytegang")}
            >
              ORG:bytegang
            </MenubarRadioItem>
          </MenubarRadioGroup>
          <MenubarSeparator />
          <MenubarItem
            inset
            onClick={() => gotoURL("https://twitter.com/neochau")}
          >
            Twitter
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            inset
            onClick={() => gotoURL("https://www.reddit.com/user/trytvorg")}
          >
            Reddit
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

interface AlbumArtworkProps extends HTMLAttributes<HTMLDivElement> {
  album: Album;
  aspectRatio?: "portrait" | "square";
  width?: number;
  height?: number;
}

function InnerTabPersonal({
  album,
  aspectRatio = "portrait",
  width,
  height,
  className,
  ...props
}: AlbumArtworkProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="overflow-hidden rounded-md">
            <Image
              src={album.cover}
              alt={album.name}
              width={width}
              height={height}
              className={cn(
                "h-auto w-auto object-cover transition-all hover:scale-105",
                aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
              )}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          <ContextMenuItem>Add to Library</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Add to Playlist</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem>
                <IconSpherePlus className="mr-2 h-4 w-4" />
                New Playlist
              </ContextMenuItem>
              <ContextMenuSeparator />
              {playlists.map((playlist) => (
                <ContextMenuItem key={playlist}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3" />
                  </svg>
                  {playlist}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem>Play Next</ContextMenuItem>
          <ContextMenuItem>Play Later</ContextMenuItem>
          <ContextMenuItem>Create Station</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Like</ContextMenuItem>
          <ContextMenuItem>Share</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <div className="space-y-1 text-sm">
        <h3 className="font-medium leading-none">{album.name}</h3>
        <p className="text-xs text-muted-foreground">{album.artist}</p>
      </div>
    </div>
  );
}

function InnerTabSkills() {
  const dataStatus = [
    {
      revenue: 10400,
      subscription: 240,
    },
    {
      revenue: 14405,
      subscription: 300,
    },
    {
      revenue: 9400,
      subscription: 200,
    },
    {
      revenue: 8200,
      subscription: 278,
    },
    {
      revenue: 7000,
      subscription: 189,
    },
    {
      revenue: 9600,
      subscription: 239,
    },
    {
      revenue: 11244,
      subscription: 278,
    },
    {
      revenue: 26475,
      subscription: 189,
    },
  ];
  const data = [
    {
      goal: 400,
    },
    {
      goal: 300,
    },
    {
      goal: 200,
    },
    {
      goal: 300,
    },
    {
      goal: 200,
    },
    {
      goal: 278,
    },
    {
      goal: 189,
    },
    {
      goal: 239,
    },
    {
      goal: 300,
    },
    {
      goal: 200,
    },
    {
      goal: 278,
    },
    {
      goal: 189,
    },
    {
      goal: 349,
    },
  ];
  const { theme: mode } = useTheme();
  const [goal, setGoal] = useState(350);
  const dataMetrics = [
    {
      average: 400,
      today: 240,
    },
    {
      average: 300,
      today: 139,
    },
    {
      average: 200,
      today: 980,
    },
    {
      average: 278,
      today: 390,
    },
    {
      average: 189,
      today: 480,
    },
    {
      average: 239,
      today: 380,
    },
    {
      average: 349,
      today: 430,
    },
  ];
  const lightPrimary = "hsl(221.2 83.2% 53.3%)";
  const darkPrimary = "hsl(217.2 91.2% 59.8%)";
  const color = mode === "light" ? lightPrimary : darkPrimary;
  const dataRadar = [
    {
      subject: "Math",
      A: 120,
      B: 110,
      fullMark: 150,
    },
    {
      subject: "Chinese",
      A: 98,
      B: 130,
      fullMark: 150,
    },
    {
      subject: "English",
      A: 86,
      B: 130,
      fullMark: 150,
    },
    {
      subject: "Geography",
      A: 99,
      B: 100,
      fullMark: 150,
    },
    {
      subject: "Physics",
      A: 85,
      B: 90,
      fullMark: 150,
    },
    {
      subject: "History",
      A: 65,
      B: 85,
      fullMark: 150,
    },
  ];
  const dataRadarBar = [
    {
      name: "18-24",
      uv: 31.47,
      pv: 2400,
      fill: "#8884d8",
    },
    {
      name: "25-29",
      uv: 26.69,
      pv: 4567,
      fill: "#83a6ed",
    },
    {
      name: "30-34",
      uv: 15.69,
      pv: 1398,
      fill: "#8dd1e1",
    },
    {
      name: "35-39",
      uv: 8.22,
      pv: 9800,
      fill: "#82ca9d",
    },
    {
      name: "40-49",
      uv: 8.63,
      pv: 3908,
      fill: "#a4de6c",
    },
    {
      name: "50+",
      uv: 2.63,
      pv: 4800,
      fill: "#d0ed57",
    },
    {
      name: "unknow",
      uv: 6.67,
      pv: 4800,
      fill: "#ffc658",
    },
  ];
  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)));
  }

  return (
    <div className="grid w-full grid-cols-12 gap-3">
      <Card className="col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$15,231.89</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataStatus}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="revenue"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                  style={
                    {
                      "--theme-primary": `hsl(${color})`,
                    } as React.CSSProperties
                  }
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+2350</div>
          <p className="text-xs text-muted-foreground">
            +180.1% from last month
          </p>
          <div className="mt-4 h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataStatus}>
                <Bar
                  dataKey="subscription"
                  style={
                    {
                      fill: "var(--theme-primary)",
                      "--theme-primary": color,
                    } as React.CSSProperties
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Move Goal</CardTitle>
          <CardDescription>Set your daily activity goal.</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => onClick(-10)}
              disabled={goal <= 200}
            >
              <IconMinus className="h-4 w-4" />
              <span className="sr-only">Decrease</span>
            </Button>
            <div className="flex-1 text-center">
              <div className="text-5xl font-bold tracking-tighter">{goal}</div>
              <div className="text-[0.70rem] uppercase text-muted-foreground">
                Calories/day
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={() => onClick(10)}
              disabled={goal >= 400}
            >
              <IconPlus className="h-4 w-4" />
              <span className="sr-only">Increase</span>
            </Button>
          </div>
          <div className="my-3 h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <Bar
                  dataKey="goal"
                  style={
                    {
                      fill: "var(--theme-primary)",
                      "--theme-primary": color,
                      // opacity: 0.8,
                    } as React.CSSProperties
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Exercise Minutes</CardTitle>
          <CardDescription>
            Your excercise minutes are ahead of where you normally are.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataMetrics}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Average
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {payload[0].value}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Today
                              </span>
                              <span className="font-bold">
                                {payload[1].value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="average"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                  style={
                    {
                      stroke: "var(--theme-primary)",
                      "--theme-primary": color,
                      opacity: 0.25,
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  dataKey="today"
                  strokeWidth={2}
                  activeDot={{
                    r: 8,
                    style: { fill: "var(--theme-primary)" },
                  }}
                  style={
                    {
                      stroke: "var(--theme-primary)",
                      "--theme-primary": color,
                    } as React.CSSProperties
                  }
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* radar */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Data Radar</CardTitle>
          <CardDescription>
            What area are you having problems with?
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={dataRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar
                  name="Mike"
                  dataKey="A"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Lily"
                  dataKey="B"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter className="justify-between space-x-2"></CardFooter>
      </Card>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Data Radar</CardTitle>
          <CardDescription> </CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="10%"
                outerRadius="80%"
                barSize={10}
                data={dataRadarBar}
              >
                <RadialBar
                  label={{ position: "insideStart", fill: "#fff" }}
                  background
                  dataKey="uv"
                />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  wrapperStyle={{
                    top: "50%",
                    right: 0,
                    transform: "translate(0, -50%)",
                    lineHeight: "24px",
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>{" "}
          </div>
        </CardContent>
        <CardFooter className="justify-between space-x-2"></CardFooter>
      </Card>
    </div>
  );
}

export default function Hero() {
  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/music-light.png"
          width={1280}
          height={1114}
          alt="Music"
          className="block dark:hidden"
        />
        <Image
          src="/examples/music-dark.png"
          width={1280}
          height={1114}
          alt="Music"
          className="hidden dark:block"
        />
      </div>
      <div className="hidden md:block">
        <InnerTopMusicNavBar />
        <div className="border-t">
          <div className="bg-background">
            <div className="grid lg:grid-cols-5">
              <InnerSidebar playlists={playlists} className="hidden lg:block" />
              <div className="col-span-3 lg:col-span-4 lg:border-l">
                <div className="h-full px-4 py-6 lg:px-8">
                  <Tabs defaultValue="music" className="h-full space-y-6">
                    <div className="space-between flex items-center">
                      <TabsList>
                        <TabsTrigger value="music" className="relative">
                          Personal
                        </TabsTrigger>
                        <TabsTrigger value="podcasts">Skills</TabsTrigger>
                        <TabsTrigger value="live" disabled>
                          Projects
                        </TabsTrigger>
                      </TabsList>
                      <div className="ml-auto mr-4">
                        {/*<Button className="text-foreground">*/}
                        {/*    <PlusCircle className="mr-2 h-4 w-4"/>*/}
                        {/*    Add music*/}
                        {/*</Button>*/}
                      </div>
                    </div>
                    <TabsContent
                      value="music"
                      className="border-none p-0 outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-semibold tracking-tight">
                            Where
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Locations mean a lot
                          </p>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="relative">
                        <ScrollArea>
                          <div className="flex space-x-4 pb-4">
                            {placeItem.map((album) => (
                              <InnerTabPersonal
                                key={album.name}
                                album={album}
                                className="w-[320px]"
                                aspectRatio="portrait"
                                width={320}
                                height={640}
                              />
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </div>
                      <div className="mt-6 space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">
                          Family
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          I am blessed with a wonderful wife and an adorable
                          son.
                        </p>
                      </div>
                      <Separator className="my-4" />
                      <div className="relative">
                        <ScrollArea>
                          <div className="flex space-x-4 pb-4">
                            {madeForYouAlbums.map((album) => (
                              <InnerTabPersonal
                                key={album.name}
                                album={album}
                                className="w-[320px]"
                                aspectRatio="portrait"
                                width={320}
                                height={640}
                              />
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </div>
                    </TabsContent>
                    <TabsContent
                      value="podcasts"
                      className="h-full flex-col border-none p-0 data-[state=active]:flex"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-semibold tracking-tight">
                            New Episodes
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Your favorite podcasts. Updated daily.
                          </p>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <InnerTabSkills />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
