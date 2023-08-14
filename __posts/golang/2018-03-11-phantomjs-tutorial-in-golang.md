---
layout: post
title: go语言使用phantomjs提供截图服务
category: Golang
tags: golang PhantomJS Spider
date: 2018-12-26T13:19:54+08:00
description: PhantomJS是一个基于webkit的JavaScript API.这篇文章我来教大家这么使用phantomjs来提供解图服务,或者自动注册账号这一类服务.
keywords: chrome,chromedp,selenium,phantomjs,chrome debugging protocol, edge,safari,android
---

## 1. 什么是Phantomjs

PhantomJS是一个基于webkit的JavaScript
API.它使用QtWebKit作为它核心浏览器的功能,使用webkit来编译解释执行JavaScript代码.任何您可以在基于webkit浏览器做的事情,它都能做到.它不仅是个隐形的浏览器,提供了诸如CSS选择器,支持Web标准,DOM操作,JSON,HTML5,Canvas,SVG等,同时也提供了处理文件I/O的操作,从而使您可以向操作系统读写文件等.PhantomJS的用处可谓非常广泛,诸如网络监测,网页截屏,无需浏览器的
Web 测试,页面访问自动化等.

## 2. 准备工作

- *unix系统安装[phantomJS](http://phantomjs.org/download.html)可执行文件,`phantomjs`添加到系统环境变量
- 检验phantomjs安装是否成功,`在终端中运行$:` `phantomjs`不报错,则安装成功
- 安装go package [`github.com/benbjohnson/phantomjs`](https://github.com/benbjohnson/phantomjs),主要功能方便go调用phantomJS二进制文件命令

## 3. go调用phantomJS代码解析

### 3.1 defer函数捕捉panic

```go
func main() {
    defer func(){

        err:= recover()
        if err != nil {
            println(err)
        }
    }()
    var url = "https://www.163.com"
```

### 3.2 创建一个在golang里面phantomJS创建一个phanomJS进程

```go
if err := phantomjs.DefaultProcess.Open(); err != nil {
    panic(err)
    os.Exit(1)
}
defer phantomjs.DefaultProcess.Close()
```

### 3.3 创建phantomJS page设置请求headers和view port

```go
page, err := phantomjs.CreateWebPage()
if err != nil {
    panic(err)
}
//set request headers 设置UserAgent为iPhone
requestHeader := http.Header{
    "User-Agent" :[]string{"Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1"},
}

if err := page.SetCustomHeaders(requestHeader);err != nil {
    panic(err)
}

// Setup the viewport and render the results view.
if err := page.SetViewportSize(640, 960); err != nil {
    panic(err)
}
```

### 3.4 截图并输出png文件

```go
// Open a URL.
if err := page.Open(url); err != nil {
    panic(err)
}
if err := page.Render("hackernews4.png", "png", 50); err != nil {
    panic(err)
}
}
```

### 3.5 完整代码 `main.go`

```go
package main

import (
    "github.com/benbjohnson/phantomjs"
    "os"
    "net/http"
)

//https://github.com/benbjohnson/phantomjs
func main() {
    defer func(){

        err:= recover()
        if err != nil {
            println(err)
        }
    }()

    var url = "https://www.163.com"
    // Start the process once.
    if err := phantomjs.DefaultProcess.Open(); err != nil {
        panic(err)
        os.Exit(1)
    }

    defer phantomjs.DefaultProcess.Close()


    page, err := phantomjs.CreateWebPage()
    if err != nil {
        panic(err)
    }
    //set request headers
    requestHeader := http.Header{
        "User-Agent" :[]string{"Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1"},
    }

    if err := page.SetCustomHeaders(requestHeader);err != nil {
        panic(err)
    }

    // Setup the viewport and render the results view.
    if err := page.SetViewportSize(640, 960); err != nil {
        panic(err)
    }
    // Open a URL.
    if err := page.Open(url); err != nil {
        panic(err)
    }
    if err := page.Render("163_news_screen_shot.png", "png", 50); err != nil {
        panic(err)
    }}
```

## 4. 使用go标准库创建截图微服务

### 4.1 main.go完成代码

```go
    // example of HTTP server that uses the captcha package.
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"github.com/benbjohnson/phantomjs"
)

const OutputDir = "screen_shot"

//ConfigJsonBody json request body.
type jsonBody struct {
	Url              string `json:"url"`
	ViewportWidth     int `json:"viewport_width"`
	ViewportHeight     int `json:"viewport_height"`
	OutputFileName     string `json:"output_file_name"`
	OutputFileExt     string  `json:"output_file_ext"`
	Quility int `json:"quility"`
	OutputUri	string `json:"output_uri"`
}


func screen_shot(w http.ResponseWriter, r *http.Request) {
	//parse request parameters
	//接收客户端发送来的请求参数json
	decoder := json.NewDecoder(r.Body)
	var postParameters jsonBody
	err := decoder.Decode(&postParameters)
	if err != nil {
		log.Println(err)
	}
	defer r.Body.Close()
	//截图网页
	phantomjs_screen_shot(&postParameters)
	//set json response
	//设置json响应
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	body := map[string]interface{}{"code": 1, "data": postParameters, "msg": "success"}
	json.NewEncoder(w).Encode(body)
}

func phantomjs_screen_shot(config *jsonBody)  {
	uri := fmt.Sprintf("%s/%s", OutputDir,config.OutputFileName)
	config.OutputFileName = uri
	config.OutputUri = uri
	// Start the process once.
	if err := phantomjs.DefaultProcess.Open(); err != nil {
		panic(err)
		os.Exit(1)
	}
	defer phantomjs.DefaultProcess.Close()


	page, err := phantomjs.CreateWebPage()
	if err != nil {
		panic(err)
	}
	//set request headers
	requestHeader := http.Header{
		"User-Agent" :[]string{"Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1"},
	}

	if err := page.SetCustomHeaders(requestHeader);err != nil {
		panic(err)
	}

	// Setup the viewport and render the results view.
	if err := page.SetViewportSize(config.ViewportWidth, config.ViewportHeight); err != nil {
		panic(err)
	}
	// Open a URL.
	if err := page.Open(config.Url); err != nil {
		panic(err)
	}
	if err := page.Render(config.OutputFileName, config.OutputFileExt, config.Quility); err != nil {
		panic(err)
	}
}


//start a net/http server
//启动golang net/http 服务器
func main() {
	
	pathPrefix := "/"+OutputDir +"/"
	staticDir := "./"+OutputDir
	http.Handle(pathPrefix,http.StripPrefix(pathPrefix, http.FileServer(http.Dir(staticDir))))

	//api for create captcha
	http.HandleFunc("/api/shot", screen_shot)


	fmt.Println("Server is at localhost:1122")
	if err := http.ListenAndServe("localhost:1122", nil); err != nil {
		log.Fatal(err)
	}
}

```

### 4.2 postmanAPI接口

```
POST /api/shot HTTP/1.1
Host: localhost:1122
Content-Type: application/json
Cache-Control: no-cache

{
	"url":"http://www.163.com",
	"viewport_width":480,
	"viewport_height":960,
	"output_file_name":"awesome.jpg",
	"output_file_ext":"jpg",
	"quility":90
}
```

### 4.3 返回参数

```JavaScript
{
    "code": 1,
    "data": {
        "url": "http://www.163.com",
        "viewport_width": 480,
        "viewport_height": 960,
        "output_file_name": "screen_shot/awesome.jpg",
        "output_file_ext": "jpg",
        "quility": 90,
        "output_uri": "screen_shot/awesome.jpg"
    },
    "msg": "success"
}
```

### 4.4 截图图片地址`localhost:1122/` + `output_uri`

## 5. 参考资料

- [golang chrome-dp 网页截图教程](/2018/12/26/chromedp-tutorial-for-golang)
- [PHP phantomjs 网页截图教程](/2018/12/26/php-phantomjs-screen-shot)
- [golang phantomjs 网页截图教程](/2018/12/26/phantomjs-tutorial-in-golang)
- [Python Selenium Chome-driver 网页截图教程](/python/selenium-chrome-driver-docker)
- [benbjohnson/phantomjs](https://github.com/benbjohnson/phantomjs)
- [使用chromedp 提换phantomjs](/2018/12/11/chromedp-tutorial-for-golang.html)
- [Github源码地址](https://github.com/mojocn/screen_shot)













