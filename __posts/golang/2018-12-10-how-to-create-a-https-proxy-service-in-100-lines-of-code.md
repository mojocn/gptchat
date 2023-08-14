---
layout: post
title: 使用go语言创建HTTP(s)代理100行代码
category: Golang
tags: golang 代理 http
description: 怎么使用go语言100行代码创建一个http(s)代理
keywords: golang,go语言,proxy,代理,http代理,代码实例
date: 2018-12-26T13:19:54+08:00
---

## 前言

这篇教程的目的是用go语言实现一个简单的HTTP(S)代理服务器.
HTTPS代理服务器的大概就是转发客户端发送的网络请求,得到响应之后把远程服务器的请求在转发给客户端.
我们所需要的就是使用go语言的内置server和客户端(net/http包). HTTPS有一些不同因为它要使用http连接通道技术.
首先客户端发送请求使用HTTP CONNECT方法来创建一个连接客户端和目标服务器的通道.
当这个通道的两个TCP连接已经就绪,客户开始常规的和目标服务器TLS建立握手之后就开始发送请求和接受响应.

## 证书

我们的代理将是一个https服务器.因此我们需要证书和私钥.为了实现这么要求,我们使用自己颁发证书.

产生证书的代码脚本文件如下如下:

```bash
#!/usr/bin/env bash
case `uname -s` in
    Linux*)     sslConfig=/etc/ssl/openssl.cnf;;
    Darwin*)    sslConfig=/System/Library/OpenSSL/openssl.cnf;;
esac
openssl req \
    -newkey rsa:2048 \
    -x509 \
    -nodes \
    -keyout server.key \
    -new \
    -out server.pem \
    -subj /CN=localhost \
    -reqexts SAN \
    -extensions SAN \
    -config <(cat $sslConfig \
        <(printf '[SAN]\nsubjectAltName=DNS:localhost')) \
    -sha256 \
    -days 3650
```

需要您的操作系统信任这个证书.
[在MacOS中在Keychain Access中实现](https://tosbourn.com/getting-os-x-to-trust-self-signed-ssl-certificates/)

## HTTP

我们使用go语言的标准库中的[net/http](https://golang.org/pkg/net/http/)来实现.
代理的功能就是处理http请求:转发送请求到目标服务器,转发响应到客户端.

![](/assets/image/golang_proxy_http.png)

## HTTP CONNECT 通道

如果客户端想使用HTTPS或者WebSockets来访问目标服务器.要知道的是:简单的http request/response 流程是不能满足的,因为客户端
需要建立安全连接(https),又或者在tcp上使用其他协议进行连接(WebSocket).
性的同的技术就是HTTP CONNECT 方法. 它告诉代理服务器建立客户端与目标服务器的TCP连接,代理可以客户端和目标服务器之间的tcp流.
代理服务不会终止SSL,仅简单的传递客户端和代理服务器之间的数据流,这样两方就可以建立起安全的网络连接了.

![](/assets/image/golang_proxy_https.png)

## 代码实现

main.go 代码

```go
package main
import (
    "crypto/tls"
    "flag"
    "io"
    "log"
    "net"
    "net/http"
    "time"
)
func handleTunneling(w http.ResponseWriter, r *http.Request) {
	//设置超时防止大量超时导致服务器资源不大量占用
    dest_conn, err := net.DialTimeout("tcp", r.Host, 10*time.Second)
    if err != nil {
        http.Error(w, err.Error(), http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
    //类型转换
    hijacker, ok := w.(http.Hijacker)
    if !ok {
        http.Error(w, "Hijacking not supported", http.StatusInternalServerError)
        return
    }
    //接管连接
    client_conn, _, err := hijacker.Hijack()
    if err != nil {
        http.Error(w, err.Error(), http.StatusServiceUnavailable)
    }
    go transfer(dest_conn, client_conn)
    go transfer(client_conn, dest_conn)
}
//转发连接的数据
func transfer(destination io.WriteCloser, source io.ReadCloser) {
    defer destination.Close()
    defer source.Close()
    io.Copy(destination, source)
}
func handleHTTP(w http.ResponseWriter, req *http.Request) {
	//roudtrip 传递发送的请求返回响应的结果
    resp, err := http.DefaultTransport.RoundTrip(req)
    if err != nil {
        http.Error(w, err.Error(), http.StatusServiceUnavailable)
        return
    }
    defer resp.Body.Close()
    //把目标服务器的响应header复制
    copyHeader(w.Header(), resp.Header)
    w.WriteHeader(resp.StatusCode)
    io.Copy(w, resp.Body)
}
//复制响应头
func copyHeader(dst, src http.Header) {
    for k, vv := range src {
        for _, v := range vv {
            dst.Add(k, v)
        }
    }
}
func main() {
	//证书路径
    var pemPath string
    flag.StringVar(&pemPath, "pem", "server.pem", "path to pem file")
    //私钥路径
    var keyPath string
    flag.StringVar(&keyPath, "key", "server.key", "path to key file")
    //协议
    var proto string
    flag.StringVar(&proto, "proto", "https", "Proxy protocol (http or https)")
    flag.Parse()
    //只支持http和https协议
    if proto != "http" && proto != "https" {
        log.Fatal("Protocol must be either http or https")
    }
    server := &http.Server{
        Addr: ":8888",
        Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if r.Method == http.MethodConnect {
            	//支持https websocket deng ... tcp
                handleTunneling(w, r)
            } else {
            	//直接http代理
                handleHTTP(w, r)
            }
        }),
        // 关闭http2
        TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)),
    }
    if proto == "http" {
        log.Fatal(server.ListenAndServe())
    } else {
        log.Fatal(server.ListenAndServeTLS(pemPath, keyPath))
    }
}
```

> 以上代码不能使用到生成环境,缺少[Hop-by-hop headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#hbh),
> 当代理服务器copy两个连接缺少timeout,[go语言net/http包timeout指南](https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/)

### 代码详解

代理服务器会处理两个分支一个是http代理一个是隧道代理

```go
http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    if r.Method == http.MethodConnect {
        handleTunneling(w, r)
    } else {
        handleHTTP(w, r)
    }
})
```

hanleHTTP这部分代码很好理解,重点就放在hanldeTunneling这方法上.
handleTunneling的方法是关于设置目标服务器的连接

```go
dest_conn, err := net.DialTimeout("tcp", r.Host, 10*time.Second)
if err != nil {
    http.Error(w, err.Error(), http.StatusServiceUnavailable)
    return
 }
 w.WriteHeader(http.StatusOK)
```

下面一部分是劫持连接被http服务器维护的连接

```go
hijacker, ok := w.(http.Hijacker)
    if !ok {
        http.Error(w, "Hijacking not supported", http.StatusInternalServerError)
        return
    }
    client_conn, _, err := hijacker.Hijack()
    if err != nil {
        http.Error(w, err.Error(), http.StatusServiceUnavailable)
    }
```

> Hijacker 接口容许接管连接.在此之后调用者有责任管理这个链接

一旦我们创建好了客户端到代理服务器和代理服务器到目标服务器的连接.

我们需要设置隧道

```go
go transfer(dest_conn, client_conn)
go transfer(client_conn, dest_conn)
```

这两个goroutine在目标服务器和客户端之间复制传递连个连接的数据

## 测试

### 在chrome中使用

请现在系统中设置证书

```bash
> Chrome --proxy-server=https://localhost:8888
```

### curl

```bash
> curl -Lv --proxy https://localhost:8888 --proxy-cacert server.pem https://google.com
```

## HTTP2

这个例子中我们的代理服务器支持HTTP2的功能可以被关闭,因为[HTTP2不支持http.Hijacker](https://github.com/golang/go/issues/14797#issuecomment-196103814)

## Go1.10之后对HTTPs代理的支持

go1.10发布之后 net/http包支持对https的代理,支持只支持http的代理

接下来我们来创建一个环境来测试这部分更新.

### 测试准备

测试之前要确保上面提的代理服务器程序正在执行

### 测试客户端

```go
package main
import (
    "crypto/tls"
    "fmt"
    "net/http"
    "net/http/httputil"
    "net/url"
)
func main() {
    u, err := url.Parse("https://localhost:8888")
    if err != nil {
        panic(err)
    }
    tr := &http.Transport{
        Proxy: http.ProxyURL(u),
        // Disable HTTP/2.
        TLSNextProto: make(map[string]func(authority string, c *tls.Conn) http.RoundTripper),
    }
    client := &http.Client{Transport: tr}
    resp, err := client.Get("https://google.com")
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    dump, err := httputil.DumpResponse(resp, true)
    if err != nil {
        panic(err)
    }
    fmt.Printf("%q", dump)
}
```

### 测试结果 1.9 vs 1.10

```shell
> go version
go version go1.10 darwin/amd64
> go run proxyclient.go
"HTTP/1.1 200 OK\r\nTransfer-Encoding: ...
> go version
go version go1.9 darwin/amd64
> go run proxyclient.go
panic: Get https://google.com: malformed HTTP response "\x15\x03\x01\x00\x02\x02\x16"
...
```

## 参考

- [http/net](https://golang.org/pkg/net/http/)
- [英文原文](https://medium.com/@mlowicki/http-s-proxy-in-golang-in-less-than-100-lines-of-code-6a51c2f2c38c)
- [wiki proxy](https://en.wikipedia.org/wiki/Proxy_server)