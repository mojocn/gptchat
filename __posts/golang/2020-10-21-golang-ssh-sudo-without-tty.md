---
layout: post
title: "Go进阶51:抱歉，您必须拥有一个终端来执行 sudo "
category: Golang
tags: Go进阶 
keywords: 'golang,ssh,sudo'
description: 'sudo：抱歉，您必须拥有一个终端来执行 sudo,sudo: sorry, you must have a tty to run sudo'
coverage: golang_ssh_tty_sudo.webp
permalink: /:categories/:title
date: 2020-10-21T13:04:54+08:00
---

## 1.背景

```go
import (
	"bytes"
	"fmt"
	"golang.org/x/crypto/ssh"
	"log"
	"time"
)

func runCmd(cfg *ssh.ClientConfig, sshAddr, cmdLine string) error {
	client, err := ssh.Dial("tcp", sshAddr, cfg)
	if err != nil {
		return fmt.Errorf("ssh连接目标%s失败:%v", sshAddr, err)
	}
	defer client.Close()
    //create session
	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("开启session addr:%s失败:%v", sshAddr, err)
	}
	// 设置termnial tty
	modes := ssh.TerminalModes{
		ssh.ECHO:          1,     // enable echoing
		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}
	err = session.RequestPty("xterm", 24, 80, modes)
	if err != nil {
		return fmt.Errorf("设置TTY:%s失败:%v", sshAddr, err)
	}
	defer session.Close()

    //stdout stderr
	var b, eb bytes.Buffer
	session.Stdout = &b
	session.Stderr = &eb
	err = session.Run(cmdLine)
	log.Printf("HOST:[%s]  CMD:[%s] Err:[%v] OUT:[%s] OUT_Err:[%s]\n", sshAddr, cmdLine, err, b.String(), eb.String())
	if err != nil {
		return fmt.Errorf("ssh执行cmd:[ %s ]失败:%v", cmdLine, err)
	}
	return nil
}

```

执行上面代码会出现错误如下

```bash
sudo: sorry, you must have a tty to run sudo
sudo：抱歉，您必须拥有一个终端来执行 sudo
```

运行以上代码在一些linux
机器上会出错, [https://unix.stackexchange.com/questions/122616/why-do-i-need-a-tty-to-run-sudo-if-i-can-sudo-without-a-password](https://unix.stackexchange.com/questions/122616/why-do-i-need-a-tty-to-run-sudo-if-i-can-sudo-without-a-password)
> That's probably because your /etc/sudoers file (or any file it includes) has:
> Defaults requiretty
> ...which makes sudo require a TTY. Red Hat systems (RHEL, Fedora...) have been known to require a TTY in default sudoers file. That provides no real security benefit and can be
> safely removed.

Red Hat have acknowledged the problem and it will be removed in future releases.

## 2.解决方案一

编辑 `/etc/sudoers` 文件，将`Default requiretty`注释掉.

`sudo vim /etc/sudoers`  `#Default requiretty` 注释掉 `Default requiretty` 一行

## 3.解决方案二

如果使用ssh 远程执行 cmd, 在`ssh` 后面加上 `-t` 参数就可以了.  `-t` 代表使用TTY(伪终端).

> If changing the configuration of the server is not an option, as a work-around for that mis-configuration, you could use the -t or -tt options to ssh which spawns a
> pseudo-terminal on the remote side, but beware that it has a number of side effects.
> -tt is meant for interactive use. It puts the local terminal in raw mode so that you interact with the remote terminal. That means that if ssh I/O is not from/to a terminal, that
> will have side effects. For instance, all the input will be echoed back, special terminal characters (^?, ^C, ^U) will cause special processing; on output, LFs will be converted to
> CRLFs... (see this answer to Why is this binary file being changed? for more details.
> To minimise the impact, you could invoke it as:

`ssh -tt host 'stty raw -echo; sudo ...' < <(cat)`

## 4.解决方案三(推荐)

在你的golang代码中增加tty的配置代码

```go
	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("开启session addr:%s失败:%v", sshAddr, err)
	}
	// Set up terminal modes
	modes := ssh.TerminalModes{
		ssh.ECHO:          1,     // enable echoing
		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}
	err = session.RequestPty("xterm", 24, 80, modes)
	if err != nil {
		return fmt.Errorf("设置TTY:%s失败:%v", sshAddr, err)
	}
	defer session.Close()
```

完整代码

```go
import (
	"bytes"
	"fmt"
	"golang.org/x/crypto/ssh"
	"log"
	"time"
)
func runCmd(cfg *ssh.ClientConfig, sshAddr, cmdLine string) error {
	client, err := ssh.Dial("tcp", sshAddr, cfg)
	if err != nil {
		return fmt.Errorf("ssh连接目标%s失败:%v", sshAddr, err)
	}
	defer client.Close()


	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("开启session addr:%s失败:%v", sshAddr, err)
	}
	// 设置 session的 tty 配置
	modes := ssh.TerminalModes{
		ssh.ECHO:          1,     // enable echoing
		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}
	err = session.RequestPty("xterm", 24, 80, modes)
	if err != nil {
		return fmt.Errorf("设置TTY:%s失败:%v", sshAddr, err)
	}
	defer session.Close()

	// stdout stderr
	var b, eb bytes.Buffer
	session.Stdout = &b
	session.Stderr = &eb
	err = session.Run(cmdLine)
	log.Printf("HOST:[%s]  CMD:[%s] Err:[%v] OUT:[%s] OUT_Err:[%s]\n", sshAddr, cmdLine, err, b.String(), eb.String())
	if err != nil {
		return fmt.Errorf("ssh执行cmd:[ %s ]失败:%v", cmdLine, err)
	}
	return nil
}
```

- [Go进阶52:开发扩展SSH的使用领域和功能](/golang/ssh-pty-im)

## 5. 相关文章

- [Go进阶52:开发扩展SSH的使用领域和功能](/golang/ssh-pty-im)
- [Go语言websocket + xterm.js + SSH 网页堡垒机](/2019/05/27/xtermjs-go)
- [Mojotv.cn Go语言 SSH-Web 堡垒机](https://github.com/mojocn/sshfortress)
- [Golang SSH 执行远程命令教程 ](/2019/05/22/golang-ssh-session)
- [Golang 富文本 Terminal](/tutorial/golang-term-tty-pty-vt100)
