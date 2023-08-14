---
layout: post
title: Go教程:21-io.Reader/Writer详解
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,io.Reader/Writer详解
description:  Go语言教程,Golang教程,接口io.Reader/Writer
permalink: /:categories/:title
date: 2019-09-09T17:32:54+08:00
---

<div class="article-coverage">
    <img src="/assets/pic/c2dtZl8vaW1nL2JWYmR6amE_dz0xNjAwJmg9MjE0.jpg" alt="io.Reader/Writer详解">
</div>

I/O操作也叫输入输出操作.其中I是指Input,O是指Output,用于读或者写数据的,有些语言中也叫流操作,是指数据通信的通道.
Golang 标准库对 IO 的抽象非常精巧,各个组件可以随意组合,可以作为接口设计的典范.

Go原生的pkg中有一些核心的interface,其中io.Reader/Writer是比较常用的接口.
***Go Writer 和 Reader接口的设计遵循了Unix的输入和输出,一个程序的输出可以是另外一个程序的输入***.

## 1. io.Reader/Writer

很多原生的结构都围绕这个系列的接口展开,在实际的开发过程中,您会发现通过这个接口可以在多种不同的io类型之间进行过渡和转化.
io.Reader 和 io.Writer 接口定义如下:

```go
type Reader interface {
	Read(p []byte) (n int, err error)
}

type Writer interface {
	Write(p []byte) (n int, err error)
}
```

### 1.1 io.Reader/Writer,有几个常用的实现：

- net.Conn: 网络
- os.Stdin, os.Stdout, os.Stderr: console终端标准输出,err
- os.File: 网络,标准输入输出,文件的流读取
- strings.Reader: 把字符串抽象成Reader
- bytes.Reader: 把[]byte抽象成Reader
- bytes.Buffer: 把[]byte抽象成Reader和Writer
- bufio.Reader/Writer: 抽象成带缓冲的流读取（比如按行读写）

![](/assets/image/golang_reader_writer.webp)

## 2. io.Reader/Writer使用场景

Unix 下有一切皆文件的思想,Golang 把这个思想贯彻到更远,因为本质上我们对文件的抽象就是一个可读可写的一个对象,
也就是实现了io.Writer 和 io.Reader 的对象我们都可以称为文件,

### 2.1 文件写入

类型 os.File 表示本地系统上的文件.它实现了 io.Reader 和 io.Writer ,因此可以在任何 io 上下文中使用.
例如,下面的例子展示如何将连续的字符串切片直接写入文件：

```go
func main() {
    proverbs := []string{
        "tech.mojotv.cn\n",
        "code.mojotv.cn\n",
        "github.com/libragen\n",
        "rocks my world\n",
    }
    file, err := os.Create("./fileMojotvIO.txt")
    if err != nil {
        fmt.Println(err)
        os.Exit(1)
    }
    defer file.Close()

    for _, p := range proverbs {
        // file 类型实现了 io.Writer
        n, err := file.Write([]byte(p))
        if err != nil {
            fmt.Println(err)
            os.Exit(1)
        }
        if n != len(p) {
            fmt.Println("failed to write bytes")
            os.Exit(1)
        }
    }
    fmt.Println("file write finished")
}
```

### 2.2 Golang HTTP 下载文件

http.Response.Body 实现了io.ReadCloser接口,也实现了io.Reader协议.
os.File实现了io.Writer,
通过io.Copy()直接使用copy http.Response.Body 到 os.File,我们将数据流传输到文件中,避免将其全部加载到内存中.

```go
package main

import (
    "io"
    "net/http"
    "os"
)

func main() {
    fileUrl := "https://mojotv.cn/assets/image/logo01.png"
    if err := DownloadFile("avatar.jpg", fileUrl); err != nil {
        panic(err)
    }
}
// DownloadFile will download a url to a local file. It's efficient because it will
// write as it downloads and not load the whole file into memory.
func DownloadFile(filepath string, url string) error {

    // Get the data
    resp, err := http.Get(url)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    // Create the file
    out, err := os.Create(filepath)
    if err != nil {
        return err
    }
    defer out.Close()

    // Write the body to file
    _, err = io.Copy(out, resp.Body)
    return err
}
```

### 2.3 Golang实现简单HTTP Proxy

使用HTTP／1.1协议中的CONNECT方法建立起来的隧道连接,实现的HTTP Proxy.
这种代理的好处就是不用知道客户端请求的数据,只需要原封不动的转发就可以了,对于处理HTTPS的请求就非常方便了,不用解析他的内容,就可以实现代理.

```go
package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net"
	"net/url"
	"strings"
)

func main() {
	//设置日志格式
	log.SetFlags(log.LstdFlags|log.Lshortfile)
	//监听端口和地址
	l, err := net.Listen("tcp", ":8081")
	if err != nil {
		log.Panic(err)
	}

	for {
		client, err := l.Accept()
		if err != nil {
			log.Panic(err)
		}
        //Listener接口的Accept方法,会接受客户端发来的连接数据,这是一个阻塞型的方法,如果客户端没有连接数据发来,
        // 他就是阻塞等待.接收来的连接数据,会马上交给handleClientRequest方法进行处理,
        // 这里使用一个go关键字开一个goroutine的目的是不阻塞客户端的接收,代理服务器可以马上接收下一个连接请求.
		go handleClientRequest(client)
	}
}

func handleClientRequest(client net.Conn) {
	if client == nil {
		return
	}
	defer client.Close()

	var b [1024]byte
	n, err := client.Read(b[:])
	if err != nil {
		log.Println(err)
		return
	}
	var method, host, address string
	fmt.Sscanf(string(b[:bytes.IndexByte(b[:], '\n')]), "%s%s", &method, &host)
	hostPortURL, err := url.Parse(host)
	if err != nil {
		log.Println(err)
		return
	}

	if hostPortURL.Opaque == "443" { //https访问
		address = hostPortURL.Scheme + ":443"
	} else { //http访问
		if strings.Index(hostPortURL.Host, ":") == -1 { //host不带端口, 默认80
			address = hostPortURL.Host + ":80"
		} else {
			address = hostPortURL.Host
		}
	}

	//获得了请求的host和port,就开始拨号吧
	server, err := net.Dial("tcp", address)
	if err != nil {
		log.Println(err)
		return
	}
	if method == "CONNECT" {
		fmt.Fprint(client, "HTTP/1.1 200 Connection established\r\n\r\n")
	} else {
		server.Write(b[:n])
	}
	//进行转发
	go io.Copy(server, client)
	io.Copy(client, server)
}

```