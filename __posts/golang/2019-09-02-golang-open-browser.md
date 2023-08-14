---
layout: post
title: Go进阶22:Go调用浏览访问链接
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,golang调用系统默认浏览器打开指定链接
description:  Go语言教程,Golang教程,golang调用系统默认浏览器打开指定链接,golang open browser打开浏览器.
permalink: /go/:title
coverage: golang_horse.jpg
date: 2019-09-02T16:52:54+08:00
---

## 1.背景

开发程序的时候,需要打开浏览器,省去用户自己手动打开的麻烦,在golang中有方式可以直接代开,

start, xdg-open 分别是windows和mac, linux打开系统默认程序的工具,
所以您要使用谷歌打开就必须要把谷歌浏览器设置为默认,
linux下不要使用root权限使用xdg-open,windows下失败可以尝试在管理员权限下的cmd执行您的程序,

- windows 执行命令 `cmd /C start htttp://tech.mojotv.cn`
- linux/freebsd/openbsd/netbsd 执行命令 `xdg-open http://tech.mojotv.cn`
- mac 执行命令 `start http://tech.mojotv.cn`

## 2.代码

程序我就偷懒不写了,调用子程序就行了.go在windows下好像不需要 cmd /C,好像会自动使用shell
我们下边直接用代码展示一下

```go
import (
    "os/exec"
)
// open opens the specified URL in the default browser of the user.
func open(url string) error {
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

## 3.windows无GUI调用浏览器

```go
package main

import (
    "os/exec"
)
func main() {
    // 无GUI调用
    cmd := exec.Command("cmd", "/c", "start", "https://tech.mojotv.cn")
    cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
    cmd.Start()
}
```

## 4.参考

- [stackoverflow](https://stackoverflow.com/questions/32738188/go-how-can-i-start-the-browser-after-the-server-started-listening/32738973#32738973)
- [pkg/browser](https://github.com/pkg/browser)