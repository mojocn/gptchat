---
layout: post
title: Go:怎么和API服务器一起serve前端代码
category: Golang
tags: Golang
keywords: go语言
description: 怎么把API接口和前端代码同时放在一个服务中
coverage: ginbro_coverage.jpg
---

## 1. 前言

前后端分离式是大家都认可的一种项目开发模式, 当时今天老周要在这里提供使用go语言一种`前后端混合`的开发模式.
这种`前后端混合`使用go语言开启一个服务占用一个端口,同时提供前端代码的输出和提供RESTful接口输出.
这种Go语言`前后端混合`模式的好处,

- 部署简单: 因为把前端代码打包压缩转换成go代码的字符串常量,
  `npm run build`之后前端代码包含在编译之后的二进制文件中,部署的时候不需要拷贝前端代码到`nginx`前端目录.
  这个app服务只需要一个二进制文件,从此告别部署拷贝前端代码和相对路径的疼苦.
- 减少nginx依赖: `npm run build`之后前端代码,通过golang标准库`http.FileServer`输出到浏览器,收益不需要nginx开启一个`server`后者`location`单独提供前端代码服务,
  因为减少了nginx这一层服务,和直接从内存中加载前端代码而不是从硬盘加载`html/js/css`,请求耗时减少2ms
- 避免跨域OPTIONS请求: 因为前端代码和API服务是用一个服务使用相同的端口,从此从此告别讨厌并且耗时的`OPTIONS`请求(当然您也可以在通过nginx location
  配置减少options跨域,这里就不详细介绍了),

Go语言是一门后端语言,

## 2. 使用

1. git clone `git clone https://github.com/libragen/felix.git`
2. go install `cd felix && go install` ([设置GOBIN环境变量](#附录GOBIN))
3. felix ginbin -h 运行帮助命令

```bash
$ felix ginbin -h
Is this a crazy idea? No, not necessarily.
If you're building a tool that has a Web component,
you typically want to serve some images, CSS and JavaScript.
You like the comfort of distributing a single binary,
so you don't want to mess with deploying them elsewhere.
If your static files are not large in size and will be browsed by a few people,
ginbin is a solution you are looking for

Usage:
  felix ginbin [flags]

Flags:
  -c, --comment string   The package comment. An empty value disables this comment.
  -d, --dest string      The destination path of the generated package. (default ".")
  -f, --force            Overwrite destination file if it already exists. (default true)
  -h, --help             help for ginbin
  -m, --mtime            Ignore modification times on files.
  -p, --package string   The destination path of the generated package. (default "felixbin")
  -s, --src string       The path of the source directory. (default "dist")
  -t, --tags string      The golang tags.
  -z, --zip              Do not use compression to shrink the files.

```

### 2.1 使用实例

编译`npm run build `自己的vuejs SPA前端项目,复制编译好的`dist`目录路径.

- `cd ${goWebApp项目目录}`
- `felix ginbin -s ${前端编译好的dist目录路径}`  `felix ginbin` 重要参数说明: `-s` 前端编译好的代码目录,也可以适用于普通的前端项目 `-d`输出go代码的目录(包),默认当前工作目录,其他参数选填.

前端代码转换成go代码最终输出效果如图,[staticbin](https://github.com/libragen/felix/tree/master/staticbin)
![前端代码转换成go代码最终输出效果如图](/assets/image/felix_ginbin01.png)

![](/assets/image/sshfortress_ginbin.png)

### 2.2 把前端代码加载到项目API中

先上代码再说原理 [ssh2ws.go](https://github.com/libragen/felix/blob/master/ssh2ws/ssh2ws.go)

```go
package ssh2ws

import (
	"github.com/libragen/felix/staticbin"
	"github.com/gin-gonic/gin"
	"time"
)

func RunSsh2ws(bindAddress, user, password, secret string, expire time.Duration, verbose bool) error {
	//config jwt variables
	r := gin.New()
	//sever static file in http's root path
	binStaticMiddleware, err := staticbin.NewGinStaticBinMiddleware("/")
	if err != nil {
		return err
	}
	r.Use(binStaticMiddleware)

	api := r.Group("api")
	r.POST("api/login", internal.Login)
	r.POST("api/register", internal.UserCreate)

```

#### 加载ginbin生产的前端代码package作为gin middleware

加载ginbin生产的前端代码package作为gin middleware `binStaticMiddleware, err := staticbin.NewGinStaticBinMiddleware("/")`,同时设置url-path:`/` 映射前端代码

#### gin使用前端代码中间件

`r.Use(binStaticMiddleware)`

#### 加载RESTful APIs Gin

```go
	api := r.Group("api")
	r.POST("api/login", internal.Login)
	r.POST("api/register", internal.UserCreate)
```

#### 最终效果见 [http://home.mojotv.cn:2222/#/login](http://home.mojotv.cn:2222/#/login)

#### 最终效果见 [https://sshfortress.mojotv.cn/#/login](https://sshfortress.mojotv.cn/#/login)

## 3. 原理

1. 遍历前端代码目录
2. 使用标准库`archive/zip`压缩文件到`bytes.Buffer`
3. `bytes.Buffer` 转换输出go 常量字符串
4. go const 字符串 转换成 File interface的结构体
5. 编写gin middleware拦截请求,http.Serve 前端文件

源代码[https://github.com/libragen/felix/blob/master/ginbro/ginstatic.go](https://github.com/libragen/felix/blob/master/ginbro/ginstatic.go)

## 4. 附录GOBIN

环境变量`GOBIN`表示我们开发程序编译后二进制命令的安装目录.
当我们使用`go install`命令编译和打包应用程序时,该命令会将编译后二进制程序打包`GOBIN`目录,一般我们将`GOBIN`设置为`GOPATH/bin`目录
`Linux`设置`GOBIN`演示
`export GOBIN=$GOPATH/bin`
复制代码上面的代码中,我们都是使用export命令设置环境变量的,这样设置只能在当前`shell`中有效,如果想一直有效,如在`Linux`中,则应该将环境变量添加到`/etc/profile` `~/.bashrc`等文件当中.

我的另外一个项目也使用了这样的技术

### 4.1 [github.com/mojocn/sshfortress](https://github.com/mojocn/sshfortress).