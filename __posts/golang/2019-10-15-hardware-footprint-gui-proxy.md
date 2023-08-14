---
layout: post
title: "Go进阶32:HTTP-Reverse-Proxy反向代理Nginx硬件指纹校验"
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,Golang,GUI,HTTP-Proxy,nginx硬件指纹校验,
description: "使用Golang HTTP Reverse Proxy,生成硬件指纹二进制可执行exe,nginx限定特性机器访问网站"
coverage: golang_http_reverse_proxy.jpg
permalink: /go/:title
date: 2019-10-15T14:59:45+08:00
---

## 1. 解决了什么需求

1. 只容许特定机器访问公网某网站,其他客户端浏览器访问都返回404
2. 使用Golang获取机器的唯一指纹
3. 使用Golang开发完成一个签到chrome的GUI客户端
4. 使用Golang开发一个HTTP协议代理,同时附加上机器指纹

## 2. 代码实现

### 2.1 获取硬件指纹

因为每台电脑的网卡mac地址重复概率非常低,而且一般电脑上都包含多个网卡,这样就会多个mac地址(蓝牙mac地址,wlan网卡地址,有线网卡地址),
所以获取多个mac地址在进行md5/SHA-256,就可以得到机器的fingerprint指纹.

#### 2.1.1 硬件信息指纹:全部MAC地址SHA-256

```go
import (
    "crypto/sha256"
    "encoding/hex"
)
func getMacAddrSha256() string {
	netInterfaces, err := net.Interfaces()
	if err != nil {
		fmt.Printf("fail to get net interfaces: %v", err)
		return ""
	}
	var macAddrs []string
	for _, netInterface := range netInterfaces {
		macAddr := netInterface.HardwareAddr.String()
		if len(macAddr) == 0 {
			continue
		}

		macAddrs = append(macAddrs, macAddr)
	}
	str := strings.Join(macAddrs, "_")
	h := sha256.New()
	h.Write([]byte(str))
	return hex.EncodeToString(h.Sum(nil))
}

```

#### 2.1.2 硬件信息指纹:全部MAC地址MD5

```go
import (
	"crypto/md5"
    "encoding/hex"
)
func getMacAddrMd5() string {
	netInterfaces, err := net.Interfaces()
	if err != nil {
		fmt.Printf("fail to get net interfaces: %v", err)
		return ""
	}
	var macAddrs []string
	for _, netInterface := range netInterfaces {
		macAddr := netInterface.HardwareAddr.String()
		if len(macAddr) == 0 {
			continue
		}

		macAddrs = append(macAddrs, macAddr)
	}
	str := strings.Join(macAddrs, "_")
	h := md5.New()
	h.Write([]byte(str))
	return hex.EncodeToString(h.Sum(nil))
}
```

### 2.2 设置Golang标准库HTTP-Reverse(反向代理)

```go
import (

	"net"
	"net/http"
	"net/http/httputil"
)
func runHttpReverseProxy() string{
	proxy := &httputil.ReverseProxy{
		Transport: roundTripper(rt),
		Director: func(req *http.Request) {
			req.URL.Scheme = "http"
			req.URL.Host = remoteHostOrIp // 填写远端,需要被代理的地址或者域名 
			req.Header.Set("user-agent", getMacAddrMd5()) // 修改请求header, 把机器的mac指纹设置成user-agent,  nginx 通过user-agent 验证机器合法性
		},
	}
	//开启本地可用的端口作为代理端口
    ln, err := net.Listen("tcp", "127.0.0.1:0")
    if err != nil {
        log.Fatal(err)
    }
    defer ln.Close()
	// 打印可用的代理地址
	log.Println(ln.Addr())
    //是否在开一个goroutine 根据您自己的业务需求确定
    go http.Serve(ln, proxy)
    //获取代理端口
    return ln.Addr()
}

func rt(req *http.Request) (*http.Response, error) {
	log.Printf("request received. url=%s", req.URL)
	req.Header.Set("Authorization", "golang.tech.mojotv.cn") //也可以在这里对http/request 通讯进篡改
	defer log.Printf("request complete. url=%s", req.URL)

	return http.DefaultTransport.RoundTrip(req)
}

// roundTripper makes func signature a http.RoundTripper
type roundTripper func(*http.Request) (*http.Response, error)

func (f roundTripper) RoundTrip(req *http.Request) (*http.Response, error) { return f(req) }

```

### 2.3 打开GUI或者浏览器

### 2.3.1 调用浏览器反向代理

详细内容参照我的另外一篇文章: [Go进阶22:Go调用浏览访问链接](/go/golang-open-browser)

```go
import (
	"os/exec"
)
func browserOpen(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}
	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}
```

### 2.3.2 打开GUI

github.com/zserge/lorca 用法可以参照我的Golang GUI教程 [使用golang Lora开发一个图像界面GUI应用](/2018/12/26/golang-lora-gui-tutorial)

```go
import (
	"github.com/zserge/lorca"
)

func main() {
	//也可以使用getMacAddrSha256()
	log.Println(getMacAddrMd5())
	// Create and bind Go object to the UI

	// Load HTML.
	// You may also use `data:text/html,<base64>` approach to load initial HTML,
	// e.g: ui.Load("data:text/html," + url.PathEscape(html))

	proxy := &httputil.ReverseProxy{
		Transport: roundTripper(rt),
		Director: func(req *http.Request) {
			req.URL.Scheme = "http"
			req.URL.Host = remoteHostOrIp
			req.Header.Set("user-agent", getMacAddrMd5()) // <--- I set it here first
		},
	}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()
	go func() {
		log.Fatal("run proxy failed: ", http.Serve(ln, proxy))
	}()
	time.Sleep(time.Second * 2)
	firstUrl := fmt.Sprintf("http://%s/#/login", ln.Addr())
	ui, err := lorca.New(firstUrl, "", 1280, 960)
	if err != nil {
		log.Fatal(err)
	}
	defer ui.Close()

	// A simple way to know when UI is ready (uses body.onload event in JS)
	ui.Bind("start", func() {
		log.Println("UI is ready")
	})

	// Wait until the interrupt signal arrives or browser window is closed
	sigc := make(chan os.Signal)
	signal.Notify(sigc, os.Interrupt)
	select {
	case <-sigc:
	case <-ui.Done():
	}

	log.Println("exiting...")
}

```

### 2.4 完整代码

[https://github.com/mojocn/httpproxyapp/blob/master/main.go](https://github.com/mojocn/httpproxyapp/blob/master/main.go)

```go
package main

import (
	"crypto/md5"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"github.com/zserge/lorca"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"strings"
	"time"
)

const remoteHostOrIp = "120.163.249.4"

//https://github.com/golang/go/issues/28168

func main2() {
	proxy := &httputil.ReverseProxy{
		Transport: roundTripper(rt),
		Director: func(req *http.Request) {
			req.URL.Scheme = "http"
			req.URL.Host = remoteHostOrIp
			req.Header.Set("user-agent", getMacAddrMd5()) // <--- I set it here first
		},
	}
	log.Fatal(http.ListenAndServe("127.0.0.1:8888", proxy))
}

func rt(req *http.Request) (*http.Response, error) {
	log.Printf("request received. url=%s", req.URL)
	req.Header.Set("Host", "dev.tech.mojotv.cn") // <--- I set it here as well
	defer log.Printf("request complete. url=%s", req.URL)

	return http.DefaultTransport.RoundTrip(req)
}

// roundTripper makes func signature a http.RoundTripper
type roundTripper func(*http.Request) (*http.Response, error)

func (f roundTripper) RoundTrip(req *http.Request) (*http.Response, error) { return f(req) }

func mustRunProxy() net.Addr {
	proxy := &httputil.ReverseProxy{
		Transport: roundTripper(rt),
		Director: func(req *http.Request) {
			req.URL.Scheme = "http"
			req.URL.Host = remoteHostOrIp
			req.Header.Set("user-agent", getMacAddrSha256()) // <--- I set it here first
		},
	}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()
	go http.Serve(ln, proxy)
	return ln.Addr()
}

func main() {
	log.Println(getMacAddrMd5())
	// Create and bind Go object to the UI

	// Load HTML.
	// You may also use `data:text/html,<base64>` approach to load initial HTML,
	// e.g: ui.Load("data:text/html," + url.PathEscape(html))

	proxy := &httputil.ReverseProxy{
		Transport: roundTripper(rt),
		Director: func(req *http.Request) {
			req.URL.Scheme = "http"
			req.URL.Host = remoteHostOrIp
			req.Header.Set("user-agent", getMacAddrMd5()) // <--- I set it here first
		},
	}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()
	firstUrl := fmt.Sprintf("http://%s/#/login", ln.Addr())

	go func() {
		time.Sleep(time.Second * 1)
		browserOpen(firstUrl)
	}()

	log.Fatal("run proxy failed: ", http.Serve(ln, proxy))
}

func browserOpen(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}
	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}

func mainGuiLora() {
	log.Println(getMacAddrMd5())
	// Create and bind Go object to the UI

	// Load HTML.
	// You may also use `data:text/html,<base64>` approach to load initial HTML,
	// e.g: ui.Load("data:text/html," + url.PathEscape(html))

	proxy := &httputil.ReverseProxy{
		Transport: roundTripper(rt),
		Director: func(req *http.Request) {
			req.URL.Scheme = "http"
			req.URL.Host = remoteHostOrIp
			req.Header.Set("user-agent", getMacAddrMd5()) // <--- I set it here first
		},
	}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()
	go func() {
		log.Fatal("run proxy failed: ", http.Serve(ln, proxy))
	}()
	time.Sleep(time.Second * 2)
	firstUrl := fmt.Sprintf("http://%s/#/login", ln.Addr())
	ui, err := lorca.New(firstUrl, "", 1280, 960)
	if err != nil {
		log.Fatal(err)
	}
	defer ui.Close()

	// A simple way to know when UI is ready (uses body.onload event in JS)
	ui.Bind("start", func() {
		log.Println("UI is ready")
	})

	// Wait until the interrupt signal arrives or browser window is closed
	sigc := make(chan os.Signal)
	signal.Notify(sigc, os.Interrupt)
	select {
	case <-sigc:
	case <-ui.Done():
	}

	log.Println("exiting...")
}

func getMacAddrMd5() string {
	netInterfaces, err := net.Interfaces()
	if err != nil {
		fmt.Printf("fail to get net interfaces: %v", err)
		return ""
	}
	var macAddrs []string
	for _, netInterface := range netInterfaces {
		macAddr := netInterface.HardwareAddr.String()
		if len(macAddr) == 0 {
			continue
		}

		macAddrs = append(macAddrs, macAddr)
	}
	str := strings.Join(macAddrs, "_")
	h := md5.New()
	h.Write([]byte(str))
	return hex.EncodeToString(h.Sum(nil))
}

func getMacAddrSha256() string {
	netInterfaces, err := net.Interfaces()
	if err != nil {
		fmt.Printf("fail to get net interfaces: %v", err)
		return ""
	}
	var macAddrs []string
	for _, netInterface := range netInterfaces {
		macAddr := netInterface.HardwareAddr.String()
		if len(macAddr) == 0 {
			continue
		}

		macAddrs = append(macAddrs, macAddr)
	}
	str := strings.Join(macAddrs, "_")
	h := sha256.New()
	h.Write([]byte(str))
	return hex.EncodeToString(h.Sum(nil))
}

```

### 2.5 编译打包二进制

#### windows 平台制作可执行exe图标

1. go get安装golang 工具(必须先设置GOPATH,GOBIN环境变量),执行命令: `go get github.com/akavel/rsrc`
2. 创建manifest文件, 命名：main.exe.manifest:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
<assemblyIdentity
    version="1.0.0.0"
    processorArchitecture="x86"
    name="controls"
    type="win32"
></assemblyIdentity>
<dependency>
    <dependentAssembly>
        <assemblyIdentity
            type="win32"
            name="Microsoft.Windows.Common-Controls"
            version="6.0.0.0"
            processorArchitecture="*"
            publicKeyToken="6595b64144ccf1df"
            language="*"
        ></assemblyIdentity>
    </dependentAssembly>
</dependency>
</assembly>
```

3. favicon.ico图标生成syso文件: `rsrc -manifest main.exe.manifest -ico favicon.ico -o main.syso`
4. 将生成的main.syso文件拷贝到main.go同级目录
5. 编译生成app.exe `go build -o main.exe -ldflags "-H windowsgui"` ( `-ldflags "-H windowsgui"`  使Golang编译程序从后台运行,不出现dos窗口)

## 3. nginx 服务器权限控制

比对golang `getMacAddrSha256()` `getMacAddrMd5` 获取的硬件指纹信息

```golang
server {
        listen       7777;
        root html/frontend/dist;
        client_max_body_size 100m;

        # 比对user-agent 是否是golang获取的硬件信息
        # c9d218179d82164b280c101c53afadc5 这个是golang `getMacAddrSha256()` `getMacAddrMd5` 得到的字符串
        if ($http_user_agent != "c9d218179d82164b280c101c53afadc5"){
            # 返回nginx 403错误
            return 403;
        }

        location / {
            try_files $uri $uri/ /index.html$is_args$args;
        }
        location /api/ {
            root html/backend/public;
            rewrite ^/api/(.*)$ /$1 break;
            try_files $uri $uri/ /api/index.php$is_args$args;

            location ~ \.php$ {
                rewrite ^/api/(.*)$ /$1 break;
                fastcgi_pass   php:9000;
                fastcgi_index  index.php;
                fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
                include        fastcgi_params;
            }
        }
        location /python/ {
            #rewrite ^/python/(.*)$ /$1 break;
            proxy_pass http://python:8111; # 这里是指向 gunicorn host 的服务地址
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        error_log  /var/log/nginx/fb_error7777.log;
        access_log /var/log/nginx/fb_access7777.log;
}
```

## 4. 总结

- [Golang GUI教程](/2018/12/26/golang-lora-gui-tutorial)
- [Golang调用系统浏览器](/go/golang-open-browser)
- [Golang HTTP Reverse Proxy Issue](https://github.com/golang/go/issues/28168)