"use client";
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

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconArticle,
  IconLink,
  IconMinus,
  IconPlus,
  IconSpherePlus,
} from "@tabler/icons-react";
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
import { HTMLAttributes, useState, CSSProperties } from "react";
import qichun from "@/images/qichun.jpg";
import wuhan from "@/images/wuhan.png";
import hangzhou from "@/images/hangzhou.webp";
import gelihaian from "@/images/gelihaian.jpeg";
import zhuhai2 from "@/images/zhuhai2.jpg";
import bear01 from "@/images/bear01.jpeg";
import bear02 from "@/images/bear02.jpg";
import bear03 from "@/images/bear03.jpg";
import cat04 from "@/images/cat04.jpeg";
import monkey05 from "@/images/monkey05.jpeg";

import { useTheme } from "next-themes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

interface Album {
  name: string;
  artist: string;
  cover: string;
}

const madeForYouAlbums: Album[] = [
  {
    name: "Bear",
    artist: "BearBearBearBear",
    cover: bear01.src,
  },

  {
    name: "Bear",
    artist: "The playful and cheerful bear",
    cover: bear02.src,
  },
  {
    name: "Bear at the aquarium",
    artist: "Happy Bear",
    cover: bear03.src,
  },
  {
    name: "Cate",
    artist: "Cate and son spend quality time together",
    cover: cat04.src,
  },
  {
    name: "Monkey",
    artist: "The gentle grandfather",
    cover: monkey05.src,
  },
];

interface Item {
  name: string;
  url: string;
}
function openNewTab(url: string) {
  window.open(url, "_blank")?.focus();
}

function InnerSidebar({ className }: HTMLAttributes<any>) {
  const linkItems: Item[] = [
    { name: "Github", url: "https://github.com/mojocn" },
    { name: "Twitter", url: "https://twitter.com/neochau" },
    { name: "Email", url: "mailto:neochau@gmail.com" },
    { name: "Reddit", url: "https://reddit.com/trytv" },
  ];

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
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={(_) => {
                openNewTab("https://zh.mojotv.cn");
              }}
            >
              <IconArticle size={14} className="mr-2" />
              My Blog
            </Button>
          </div>
        </div>
        <div className="py-2">
          <h2 className="relative px-7 text-lg font-semibold tracking-tight">
            Social Links
          </h2>
          <ScrollArea className="h-[300px] px-1">
            <div className="space-y-1 p-2">
              {linkItems?.map((obj, i) => (
                <Button
                  key={`${obj.name}-${i}`}
                  variant="ghost"
                  onClick={(e) => {
                    openNewTab(obj.url);
                  }}
                  className="w-full justify-start font-normal"
                >
                  <IconLink size={14} className="mr-2" />
                  {obj.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
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
              {["awesome", "is", "me"].map((musicItem) => (
                <ContextMenuItem key={musicItem}>
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
                  {musicItem}
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
  const [goal, setGoal] = useState(8);
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
      subject: "Go",
      A: 120,
      B: 110,
      fullMark: 150,
    },
    {
      subject: "HTML",
      A: 98,
      B: 130,
      fullMark: 150,
    },
    {
      subject: "Rust",
      A: 86,
      B: 130,
      fullMark: 150,
    },
    {
      subject: "Vue.js",
      A: 99,
      B: 100,
      fullMark: 150,
    },
    {
      subject: "React.js",
      A: 85,
      B: 90,
      fullMark: 150,
    },
    {
      subject: "Java",
      A: 65,
      B: 85,
      fullMark: 150,
    },
  ];
  const dataRadarBar = [
    {
      name: "Backend",
      uv: 31.47,
      pv: 2400,
      fill: "#8884d8",
    },

    {
      name: "Web",
      uv: 15.69,
      pv: 1398,
      fill: "#8dd1e1",
    },
    {
      name: "Database",
      uv: 8.22,
      pv: 9800,
      fill: "#82ca9d",
    },
    {
      name: "System",
      uv: 8.63,
      pv: 3908,
      fill: "#a4de6c",
    },

    {
      name: "Algorithm",
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
        <CardHeader>
          <CardTitle>Program Languages</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={dataRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar
                  name="Frontend"
                  dataKey="A"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Backend"
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
          <CardTitle>Commit History</CardTitle>
          <CardDescription>github commit activity.</CardDescription>
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
                    } as CSSProperties
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
                    } as CSSProperties
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
          <CardTitle>Tech Stack</CardTitle>
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
      <Card className="col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">Github Stars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3.3k</div>
          <p className="text-xs text-muted-foreground">+3.1% from last year</p>
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
                    } as CSSProperties
                  }
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal">Github Repo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">90+</div>
          <p className="text-xs text-muted-foreground">+4.1% from last year</p>
          <div className="mt-4 h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataStatus}>
                <Bar
                  dataKey="subscription"
                  style={
                    {
                      fill: "var(--theme-primary)",
                      "--theme-primary": color,
                    } as CSSProperties
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Activity</CardTitle>
          <CardDescription>activity meter</CardDescription>
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
                Point/day
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
                    } as CSSProperties
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </div>
  );
}

export default function Hero() {
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

  return (
    <div className="bg-background">
      <div className="grid lg:grid-cols-5">
        <InnerSidebar className="hidden lg:block" />
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
                    I am blessed with a wonderful wife and an adorable son.
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
                <InnerTabSkills />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
