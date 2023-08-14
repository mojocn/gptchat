---
layout: post 
title: "Go进阶53:从零Go实现Websocket-H5-RDP/VNC远程桌面客户端"
category: Golang 
tags: Go进阶 
keywords: 'golang,ssh,sudo' 
description: '从零开始开发一个HTML5-websocket远程桌面包含前端代码和后端代码,非常好的教程,RDP/VNC guacamole,guacd,golang' 
coverage: windows_remote_desktop_versus_vcn.png 
permalink: /:categories/:title 
date: 2021-03-12T23:58:54+08:00
---

## 1. 关于

因为工作的原因,一直研究堡垒机(linux/windows),对SSH和RDP这两种协议接触比较多.今天这个教程主要是讲怎么从零开始,开始一个HTML5-websocket-RDP/VNC远程桌面.
这个远程桌面包:

1. golang-后端代码
2. 前端vuejs代码
3. docker-compose 依赖的容器和demo操作系统容器.

读懂这篇文章之前一需要了解一下概念:

1. RDP 远程桌面协议(支持 linux windows)
2. VNC linux中常用的屏幕分享协议
3. SSH 安全外壳协议(主要支持*unix系统)
4. Telnet 互联网远程登录服务的标准协议(逐渐被淘汰)
5. Guacamole Protocol (guacamole.apache.org中的协议)

> 远程桌面协议（英语：Remote Desktop Protocol，缩写：RDP）是一个多通道（multi-channel）的协议，让用户（客户端或称“本地电脑”）连上提供微软终端服务的电脑（服务端或称“远程电脑”）。大部分的Windows都有客户端软件。
> 其他操作系统例如Linux、FreeBSD、Mac OS X，也有对应的客户端软件。服务端电脑方面，则监听送到TCP 3389端口的资料。

> VNC（Virtual Network Computing），为一种使用RFB协议的屏幕画面分享及远程操作软件。此软件借由网络，可发送键盘与鼠标的动作及即时的屏幕画面。
> VNC与操作系统无关，因此可跨平台使用，例如可用Windows连线到某Linux的电脑，反之亦同。甚至在没有安装客户端程序的电脑中，只要有支持JAVA的浏览器，也可使用。

> Secure Shell（安全外壳协议，简称SSH）是一种加密的网络传输协议，可在不安全的网络中为网络服务提供安全的传输环境。SSH通过在网络中创建安全隧道来实现SSH客户端与服务器之间的连接。
> SSH最常见的用途是远程登录系统，人们通常利用SSH来传输命令行界面和远程执行命令。SSH使用频率最高的场合是类Unix系统，但是Windows操作系统也能有限度地使用SSH。2015年，微软宣布将在未来的操作系统中提供原生SSH协议支持[3]
> ，Windows 10 1803版本已提供OpenSSH工具[4]。

> Telnet是一种应用层协议，使用于互联网及局域网中，使用虚拟终端的形式，提供双向、以文字字符串为主的命令行接口交互功能。属于TCP/IP协议族的其中之一，是互联网远程登录服务的标准协议和主要方式，常用于服务器的远程控制，可供用户在本地主机运行远程主机上的工作。
> Telnet在1969年开发出来，在RFC 15定义，RFC 854定义了扩展。互联网工程任务组（IETF），在STD 8中，将其加以标准化，是最早形成的互联网协议之一。


> Guacamole 是 Apache 出品的免费开源远程桌面网关，通过 Guacamole，无需任何客户端或插件，只要有支持 HTML5 和 JavaScript 的 Web 浏览器即可访问远程资源，不仅支持 Windows RDP 协议，也支持
> VNC 协议，甚至还支持 SSH、Telnet 等协议。Guacamole 的核心目标是将桌面保持在云端，从任何地方访问计算机。

[Guacamole Protocol技术文档](https://guacamole.apache.org/doc/gug/guacamole-protocol.html#guacamole-protocol-handshake),这份文档在Go项目项目中非常重要,了解了解套可以帮助你,完成
Guacamole Protocol 桥接 Websocket
Protocol
> This chapter is an overview of the Guacamole protocol, describing its design and general use. While a few instructions and their syntax will be described here, this is not an
> exhaustive list of all available instructions. The intent is only to list the general types and usage. If you are looking for the syntax or purpose of a specific instruction,
> consult the protocol reference included with the appendices.

### 1.1 学习准备

- docker && docker-compose (代码中包含;快速run demo的 docker-compose.yml)
- docker network (代码中设计到docker-compose 容器通过容器名的访问)
- golang 编程基础
- websocket (http upgrade to websocket)
- net 网络基础 (websocket and gaucamodle protocol copy)
- 熟悉 [Guacamole Protocol](https://guacamole.apache.org/doc/gug/guacamole-protocol.html#guacamole-protocol-handshake) ***Design***   ***Handshake*** 这两个章节.
- (可选)前端ES6, vuejs

### 1.2 Live Demo

<iframe src="//player.bilibili.com/player.html?aid=757037090&bvid=BV1Tr4y1P7gf&cid=309298929&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

## 2. 原理和架构

![Go-Websocket-H5-远程桌面架构原理](/assets/image/go-websocket-guacd.png)

从原理架构图中,可以看出我们可以提用 guacamole.appache.org 提供的文档和软件来使用 guacd 和 guacamole-common-js功能来实现. 我们唯一需要做的就是 guacamole <-> websocket之间的通信.
图中绿色的圆角矩形是我们要用golang来实现的功能.

## 3. 项目代码解读

[https://github.com/mojocn/rdpgo](https://github.com/mojocn/rdpgo) 项目代码目录结构

```shell 
.
├── api_ws_guaca.go
├── docker-compose.yaml
├── Dockerfile
├── frontend
│   ├── babel.config.js
│   ├── package.json
│   ├── package-lock.json
│   ├── public
│   │   ├── favicon.ico
│   │   └── index.html
│   ├── README.md
│   └── src
│       ├── App.vue
│       ├── assets
│       │   └── logo.png
│       ├── components
│       │   └── GuacClient.vue
│       ├── libs
│       │   ├── clipboard.js
│       │   ├── config.js
│       │   ├── GuacMouse.js
│       │   ├── request.js
│       │   ├── states.js
│       │   └── store.js
│       └── main.js
├── go.mod
├── go.sum
├── go-websocket-guacd
├── go-websocket-guacd.jpg
├── guac
│   ├── config.go
│   ├── counted_lock.go
│   ├── counted_lock_test.go
│   ├── doc.go
│   ├── errors.go
│   ├── guac.go
│   ├── guac_instruction.go
│   ├── readme.md
│   ├── status.go
│   ├── stream_conn.go
│   ├── stream_conn_test.go
│   └── tunnel_pipe.go
├── main.go
└── readme.md

```

### 3.1 main.go

这个是整个程序的执行入口,我们启动一个`:9528`的gin http服务. 这里有两个API和一个middleware

- api `version`,做docker-compose health-check的之用
- api `ws` 提供前端远程桌面websocket只用
- middleware `feMw` (frontend-middleware) 使用 go.16的新新特性实现serve前端static (几行代码+标准库+gin实现了部分nginx的功能)

main.go

```go
package main

import (
	"embed"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"path"
	"path/filepath"
	"strings"
)

var buildAt string
var gitHash string

func main() {
	logrus.SetReportCaller(true) //将来有时间简化为标准库log, 为了go.mod更精致
	r := gin.Default()
	r.GET("/version", func(c *gin.Context) { c.JSON(200, gin.H{gitHash: buildAt}) })
	r.Use(feMw("/"))               //替换nginx serve 前端HTML代码
	r.GET("/ws", ApiWsGuacamole()) //websocket proxy to guacd
	r.Run(":9528")
}
```

### 3.2 Go 1.6 embed

这几行代码是我先对比较得意的, 因为他满足我的编程哲学: `One binary rules them all.`, server 前端代码不需要nginx,前端代码打包的executable file. 大大的减少了部署的麻烦.

使用go.16 embed打包前端static文件到编译文件. 实现一个简单的gin-middleware,来吐出前端文件.(go rules them all).

main.go

```go

//go:embed frontend/dist/*
var fs embed.FS
const fsBase = "frontend/dist" //和 embed一样

//feMw 使用go.16新的特性embed 到包前端编译后的代码. 替代nginx.   one binary rules them all
func feMw(urlPrefix string) gin.HandlerFunc {
	const indexHtml = "index.html"

	return func(c *gin.Context) {
		urlPath := strings.TrimSpace(c.Request.URL.Path)
		if urlPath == urlPrefix {
			urlPath = path.Join(urlPrefix, indexHtml)
		}
		urlPath = filepath.Join(fsBase, urlPath)

		f, err := fs.Open(urlPath)
		if err != nil {
			return
		}
		fi, err := f.Stat()
		if strings.HasSuffix(urlPath, ".html") {
			c.Header("Cache-Control", "no-cache")
			c.Header("Content-Type", "text/html; charset=utf-8")
		}

		if strings.HasSuffix(urlPath, ".js") {
			c.Header("Content-Type", "text/javascript; charset=utf-8")
		}
		if strings.HasSuffix(urlPath, ".css") {
			c.Header("Content-Type", "text/css; charset=utf-8")
		}

		if err != nil || !fi.IsDir() {
			bs, err := fs.ReadFile(urlPath)
			if err != nil {
				logrus.WithError(err).Error("embed fs")
				return
			}
			c.Status(200)
			c.Writer.Write(bs)
			c.Abort()
		}
	}
}

```

### 3.3 Go websocket

代码解读

1. websocket 参数只能通过cookie,request-headers,url-query 传递给后端
2. 接收前端传来的参数
3. upgrade to websocket
4. 开始使用参数连接RDP远程桌面资产, 对应guacamole protocol 文档的handshake章节
5. 进行guacamole 协议 websocket 协议 net io copy

api_ws_guaca.go

```go
package main

import (
	"bytes"
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
	"net/http"
	"rdpgo/guac"
)

type ReqArg struct {
	GuacadAddr    string `form:"guacad_addr"`
	AssetProtocol string `form:"asset_protocol"`
	AssetHost     string `form:"asset_host"`
	AssetPort     string `form:"asset_port"`
	AssetUser     string `form:"asset_user"`
	AssetPassword string `form:"asset_password"`
	ScreenWidth   int    `form:"screen_width"`
	ScreenHeight  int    `form:"screen_height"`
	ScreenDpi     int    `form:"screen_dpi"`
}

//ApiWsGuacamole websocket 转 guacamole协议
func ApiWsGuacamole() gin.HandlerFunc {
	//0. 初始化 websocket 配置
	websocketReadBufferSize := guac.MaxGuacMessage
	websocketWriteBufferSize := guac.MaxGuacMessage * 2
	upgrade := websocket.Upgrader{
		ReadBufferSize:  websocketReadBufferSize,
		WriteBufferSize: websocketWriteBufferSize,
		CheckOrigin: func(r *http.Request) bool {
			//检查origin 限定websocket 被其他的域名访问
			return true
		},
	}
	return func(c *gin.Context) {
		//1. 解析参数, 因为 websocket 只能个通过浏览器url,request-header,cookie 传参数, 这里之接收 url-query 参数.
		logrus.Println("1. 解析参数, 因为 websocket 只能个通过浏览器url,request-header,cookie 传参数, 这里之接收 url-query 参数.")

		arg := new(ReqArg)
		err := c.BindQuery(arg)
		if err != nil {
			c.JSON(202, err.Error())
			return
		}

		//2. 设置为http-get websocket 升级
		logrus.Println("2. 设置为http-get websocket 升级")

		protocol := c.Request.Header.Get("Sec-Websocket-Protocol")
		ws, err := upgrade.Upgrade(c.Writer, c.Request, http.Header{
			"Sec-Websocket-Protocol": {protocol},
		})
		if err != nil {
			logrus.WithError(err).Error("升级ws失败")
			return
		}
		defer func() {
			if err = ws.Close(); err != nil {
				logrus.Traceln("Error closing websocket", err)
			}
		}()

		//3. 开始使用参数连接RDP远程桌面资产
		logrus.Println("3. 开始使用参数连接RDP远程桌面资产, 对应guacamole protocol 文档的handshake章节")
		uid := ""

		pipeTunnel, err := guac.NewGuacamoleTunnel(arg.GuacadAddr, arg.AssetProtocol, arg.AssetHost, arg.AssetPort, arg.AssetUser, arg.AssetPassword, uid, arg.ScreenWidth, arg.ScreenHeight, arg.ScreenDpi)
		if err != nil {
			logrus.Error("Failed to upgrade websocket", err)
			return
		}
		defer func() {
			if err = pipeTunnel.Close(); err != nil {
				logrus.Traceln("Error closing pipeTunnel", err)
			}
		}()
		//4. 开始处理 guacad-tunnel的io(reader,writer)
		logrus.Println("4. 开始处理 guacad-tunnel的io(reader,writer)")
		//id := pipeTunnel.ConnectionID()

		ioCopy(ws, pipeTunnel)
		logrus.Info("websocket session end")
	}
}

```

### 3.4 Guacamole协议转websocket协议

读懂这一部分代码你必须要读懂 [guacamole 协议](https://guacamole.apache.org/doc/gug/guacamole-protocol.html)的前两节 Design,Handshake phase. 后面的章节主要是给客户端开发(
guacamole-common-js)的人看的. 这部分代码主要在 guac 目录中.
你需要重点关注的代码有

- [guac/guac_instruction.go](https://github.com/mojocn/rdpgo/blob/master/guac/guac_instruction.go)    [guacamole 协议](https://guacamole.apache.org/doc/gug/guacamole-protocol.html)
  Design 章节
- [guac/stream_conn.go](https://github.com/mojocn/rdpgo/blob/master/guac/stream_conn.go)  [guacamole 协议](https://guacamole.apache.org/doc/gug/guacamole-protocol.html) handshake
  章节
- [guac/tunnel_pipe.go](https://github.com/mojocn/rdpgo/blob/master/guac/tunnel_pipe.go)  [guacamole 协议](https://guacamole.apache.org/doc/gug/guacamole-protocol.html) handshake
  章节

这一部分代码就不粘贴出来,有兴趣可以参考[Github Repo](https://github.com/mojocn/rdpgo)

### 3.5 net io copy

这里使用 [errgroup](https://pkg.go.dev/golang.org/x/sync/errgroup)( 源码很简单 就是标准库context,waitgroup,err的缝合怪). 完全可以使用 go for-loop 和 exit chan 来代替, 但是要注意的是防止
for-loop 僵尸化,一直运行. 两个 go
for-loop 完全进行的是 reader -> writer, writer -> reader 的 []byte 搬运.

```go

func ioCopy(ws *websocket.Conn, tunnl *guac.SimpleTunnel) {

	writer := tunnl.AcquireWriter()
	reader := tunnl.AcquireReader()
	//if pipeTunnel.OnDisconnectWs != nil {
	//	defer pipeTunnel.OnDisconnectWs(id, ws, c.Request, pipeTunnel.TunnelPipe)
	//}
	defer tunnl.ReleaseWriter()
	defer tunnl.ReleaseReader()

	//使用 errgroup 来处理(管理) goroutine for-loop, 防止 for-goroutine zombie
	eg, _ := errgroup.WithContext(context.Background())

	eg.Go(func() error {
		buf := bytes.NewBuffer(make([]byte, 0, guac.MaxGuacMessage*2))

		for {
			ins, err := reader.ReadSome()
			if err != nil {
				return err
			}

			if bytes.HasPrefix(ins, guac.InternalOpcodeIns) {
				// messages starting with the InternalDataOpcode are never sent to the websocket
				continue
			}

			if _, err = buf.Write(ins); err != nil {
				return err
			}

			// if the buffer has more data in it or we've reached the max buffer size, send the data and reset
			if !reader.Available() || buf.Len() >= guac.MaxGuacMessage {
				if err = ws.WriteMessage(1, buf.Bytes()); err != nil {
					if err == websocket.ErrCloseSent {
						return fmt.Errorf("websocket:%v", err)
					}
					logrus.Traceln("Failed sending message to ws", err)
					return err
				}
				buf.Reset()
			}
		}

	})
	eg.Go(func() error {
		for {
			_, data, err := ws.ReadMessage()
			if err != nil {
				logrus.Traceln("Error reading message from ws", err)
				return err
			}
			if bytes.HasPrefix(data, guac.InternalOpcodeIns) {
				// messages starting with the InternalDataOpcode are never sent to guacd
				continue
			}
			if _, err = writer.Write(data); err != nil {
				logrus.Traceln("Failed writing to guacd", err)
				return err
			}
		}

	})
	if err := eg.Wait(); err != nil {
		logrus.WithError(err).Error("session-err")
	}

}

```

## 4. 前端Vuejs代码

前端vuejs代码在frontend目录,如果自己运行起来需要有node环境. 前端代码,主要使用elementUI 来展示表单.
[guacamole-common-js](https://www.npmjs.com/package/guacamole-common-js)来做远程桌面的展示.
核心代码在 [`rdpgo/frontend/src/components/GuacClient.vue`](https://github.com/mojocn/rdpgo/blob/master/frontend/src/components/GuacClient.vue)中. 如何编译请查看视频

## 5. 结束语和展望

- [guacamole协议](https://guacamole.apache.org/doc/gug/guacamole-protocol.html)
- [guacamole-common-js](https://www.npmjs.com/package/guacamole-common-js)
- 视频Demo: [https://www.bilibili.com/video/BV1Tr4y1P7gf/](https://www.bilibili.com/video/BV1Tr4y1P7gf/)
- Github项目代码: [https://github.com/mojocn/rdpgo](https://github.com/mojocn/rdpgo)