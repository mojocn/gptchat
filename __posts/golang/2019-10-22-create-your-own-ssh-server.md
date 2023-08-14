---
layout: post
title: "Go进阶35:Go语言自定义自己的SSH-Server"
category: Golang
tags: Go进阶 
keywords: Go语言教程,Golang教程,Go语言自定义自己的SSH-Server
description: "Go语言自定义的SSH-Server处理自己的业务逻辑,SSH是一种网络协议,用于计算机之间的加密登录"
coverage: golang_ssh_server.png
permalink: /go/:title
date: 2019-10-22T15:07:45+08:00
---

## 1. 什么是SSH?

***SSH是一种网络协议,用于计算机之间的加密登录.***

如果一个用户从本地计算机,使用SSH协议登录另一台远程计算机,我们就可以认为,这种登录是安全的,即使被中途截获,密码也不会泄露.

互联网通信早期都是明文通信,一旦被截获,内容就暴露无疑.
1995年,芬兰学者Tatu Ylonen设计了SSH协议,将登录信息全部加密,成为互联网安全的一个基本解决方案,迅速在全世界获得推广,
目前已经成为Linux系统的标准配置.

### 1.1 使用Go语言 `golang.org/x/crypto/ssh` 包

golang.org/x/crypto/ssh 包下载 `go get -u golang.org/x/crypto/ssh`.

下面的代码展示我们如何在golang代码登陆到SSH. 一下代码制作代码功能展示之用,
没有解决terminal window size 问题和怎么传入ssh 登陆参数的问题.实际使用中有缺陷,通过 tab 补全时并不能正确显示.

更完整教程相见 [golang-ssh-01:执行远程命令](/2019/05/22/golang-ssh-session)

```go
package main
import (
    "golang.org/x/crypto/ssh"
    "log"
    "os"
)
func handlerErr(err error, msg string) {
    if err != nil {
        log.Fatalf("%s error: %v", msg, err)
    }   
}   
func main() {
    //ssh 服务地址home.mojotv.cn:22
    client, err := ssh.Dial("tcp", "home.mojotv.cn:22", &ssh.ClientConfig{
        User: "test007",//ssh 用户名
        Auth: []ssh.AuthMethod{ssh.Password("test007")},  //ssh 密码
    })  
    handlerErr(err, "dial")
    session, err := client.NewSession()
    handlerErr(err, "ssh session 创建")
    defer session.Close()
    
    //当前机器的terminal 连接到ssh-session的为终端
    session.Stdout = os.Stdout
    session.Stderr = os.Stderr
    session.Stdin = os.Stdin
    // 配置pty
    modes := ssh.TerminalModes{
        ssh.ECHO:          0,  
        ssh.TTY_OP_ISPEED: 14400,
        ssh.TTY_OP_OSPEED: 14400,
    }  
    //这里设置的固定的terminal size 25x100
    //当terminal 窗口尺寸改变的时候 会导致终端显示错位
    err = session.RequestPty("xterm", 25, 80, modes)
    handlerErr(err, "请求PTY为终端")

    err = session.Shell()
    handlerErr(err, "开始 shell")

    err = session.Wait()
    handlerErr(err, "执行完毕")
}
```

## 2. Go语言自定义自己的SSH-Server

以下代码来自我的开源项目中的一个功能模块.
[mojocn/sshfortress Go语言SSH-Web堡垒机](https://github.com/mojocn/sshfortress)

主要代码来自这个文件[sshfortress/fssh/server.go](https://github.com/mojocn/sshfortress/blob/master/fssh/server.go)

### 2.1 创建private key 验证HostKey

```go
import (
	"fmt"
	"github.com/gliderlabs/ssh"
	gossh "golang.org/x/crypto/ssh"
	"io"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sshfortress/util"
)

//创建key 来验证 host public
func createOrLoadKeySigner() (gossh.Signer, error) {
	//key 保存到 系统temp 目录
	keyPath := filepath.Join(os.TempDir(), "fssh.rsa")
	//如果key 不存在则 执行 ssh-keygen 创建
	if _, err := os.Stat(keyPath); os.IsNotExist(err) {
		os.MkdirAll(filepath.Dir(keyPath), os.ModePerm)
		//执行 ssh-keygen 创建 key
		stderr, err := exec.Command("ssh-keygen", "-f", keyPath, "-t", "rsa", "-N", "").CombinedOutput()
		output := string(stderr)
		if err != nil {
			return nil, fmt.Errorf("Fail to generate private key: %v - %s", err, output)
		}
	}
	//读取文件内容
	privateBytes, err := ioutil.ReadFile(keyPath)
	if err != nil {
		return nil, err
	}
	//生成ssh.Signer
	return gossh.ParsePrivateKey(privateBytes)
}

```

### 2.2 SSH-Server的handler

homeHandler 主要答应 APP 彩色文本信息( [Go进阶19:如何开发多彩动感的终端UI应用](/tutorial/golang-term-tty-pty-vt100) ).
进行SSH代理登陆,动态监听terminal size 变化. 连接本地ssh到远程ssh-session-pty伪终端.
详细功能见代码中的注释.

```go
import (
	"fmt"
	"github.com/gliderlabs/ssh"
	gossh "golang.org/x/crypto/ssh"
	"io"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sshfortress/util"
)


func homeHandler(s ssh.Session) {
	//tty 控制码打印彩色文字
	//mojotv.cn/tutorial/golang-term-tty-pty-vt100
	io.WriteString(s, fmt.Sprintf("\x1b[31;47mmojotv.cn sshfortress 堡垒机 自定义SSH, 当前登陆用户名: %s\x1b[0m\n", s.User()))

	ptyReq, winCh, isPty := s.Pty()
	if !isPty {
		io.WriteString(s, "不是PTY请求.\n")
		s.Exit(1)
		return
	}
	sshConf, err := util.NewSshClientConfig("test007", "test007", "password", "", "")
	if err != nil {
		io.WriteString(s, err.Error())
		s.Exit(1)
		return
	}
	//连接远程服务器SSH
	conn, err := gossh.Dial("tcp", "home.mojotv.cn:22", sshConf)
	if err != nil {
		io.WriteString(s, "unable to connect: "+err.Error())
		s.Exit(1)
		return
	}
	defer conn.Close()
	// 创建远程ssh session
	fss, err := conn.NewSession()
	if err != nil {
		io.WriteString(s, "unable to create fss: "+err.Error())
		s.Exit(1)
		return
	}
	defer fss.Close()

	// 配置terminal
	modes := gossh.TerminalModes{
		gossh.ECHO:          1,     // disable echoing
		gossh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		gossh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}
	// 请求为终端
	if err := fss.RequestPty(ptyReq.Term, ptyReq.Window.Height, ptyReq.Window.Width, modes); err != nil {
		io.WriteString(s, "request for pseudo terminal failed: "+err.Error())
		s.Exit(1)
		return
	}
	//监听终端size window 变化
	go func() {
		for win := range winCh {
			err := fss.WindowChange(win.Height, win.Width)
			if err != nil {
				io.WriteString(s, "windows size changed: "+err.Error())
				s.Exit(1)
				return
			}
		}
	}()

	//linux 一切接文件 io, 连接stdin stdout stderr
	//连接为终端到server
	fss.Stderr = s
	fss.Stdin = s
	fss.Stdout = s
	if err := fss.Shell(); err != nil {
		io.WriteString(s, "failed to start shell: "+err.Error())
		s.Exit(1)
		return
	}
	fss.Wait()
}

```

### 2.3 启动Go语言SSH-Server

设置SSH-Server的监听端口,和处理Request的handler.
其次您可以自己定义Key登陆的用户校验机制,结合自己数据库开发出更加服务的SSH-Server应用.
可以开发出自己ssh 聊天服务,自己ssh 贪吃蛇服务...

```go

import (
	"fmt"
	"github.com/gliderlabs/ssh"
	gossh "golang.org/x/crypto/ssh"
	"io"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sshfortress/util"
)

func Run() {
	hostKeySigner, err := createOrLoadKeySigner()
	if err != nil {
		log.Fatal(err)
	}
	s := &ssh.Server{
		Addr:    ":88",
		Handler: homeHandler, //
		//PublicKeyHandler:
		//PasswordHandler: passwordHandler,   不需要密码验证
	}
	s.AddHostKey(hostKeySigner)
	log.Fatal(s.ListenAndServe())
}

func passwordHandler(ctx ssh.Context, password string) bool {
	//check password and username
	//user := ctx.User()
	// 可以结合DB数据库定义用户验证用户登陆
	return true
	//return model.FsshUserAuth(user, password)
}
```

## 3. 项目运行效果

### 3.1 编译项目

````bash
git clone https://github.com/mojocn/sshfortress.git
# 这个项目需要gcc windows 用户需要自己安装gcc 
cd sshfortress && go build
# cmd 代码 https://github.com/mojocn/sshfortress/blob/master/cmd/fssh.go
./sshfortress fssh
# ssh 服务开启在88端口  https://github.com/mojocn/sshfortress/blob/master/cmd/fssh.go
````

### 3.2 登陆到自定义的SSH-Server

登陆到88端口自定义的SSH服务
`ssh mojotv.cn@localhost -p 88`

终端输出结果如下

```bash
EricZhou@mojotv.cn MINGW64 /
$ ssh mojotv.cn@localhost -p 88
mojotv.cn sshfortress 堡垒机 自定义SSH, 当前登陆用户名: mojotv.cn
Linux homePi 4.14.98-v7+ #1200 SMP Tue Feb 12 20:27:48 GMT 2019 armv7l

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Tue Oct 22 14:19:55 2019 from 218.30.116.184
Could not chdir to home directory /home/test007: No such file or directory
$ ls
127.0.0.1:3306  demoFE    fssh.rsa.pub  lib         mnt                      root  sys  www
bin             dev       ginbroRock    lost+found  nginx_default_site.conf  run   tmp
boot            etc       gopath        media       opt                      sbin  usr
data            fssh.rsa  home          miwifi      proc                     srv   var
$ whoami
test007
$

```

## 4. 相关文档和项目

- [Go进阶52:开发扩展SSH的使用领域和功能](/golang/ssh-pty-im)
- [Go语言websocket + xterm.js + SSH 网页堡垒机](/2019/05/27/xtermjs-go)
- [Mojotv.cn Go语言 SSH-Web 堡垒机](https://github.com/mojocn/sshfortress)
- [Golang SSH 执行远程命令教程 ](/2019/05/22/golang-ssh-session)
- [Golang 富文本 Terminal](/tutorial/golang-term-tty-pty-vt100)
- [SSH 聊天服务](https://github.com/shazow/ssh-chat)
- [SSH 贪吃蛇](http://sshtron.zachlatta.com/)