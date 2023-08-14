---
layout: post
title: golang-ssh-01:执行远程命令
category: Golang
tags: ssh Go进阶
description: 远程执行命令有什么用？为什么要远程执行命令？ 如果您只有2,3台服务器需要管理的时候,远程执行命令确实没有没多大作用,您可以登录到每台服务器上去完成各种操作. 当您的服务器大于3台的时候,远程执行的命令的方式就可以大大提高您的生产力了.
keywords: shell-code后门,go黑客,go后门,golang unsafe
date: 2019-05-22T13:19:54+08:00
score: 5.0
coverage: golang_ssh00.png
published: true
---

## 前言

远程执行命令有什么用？为什么要远程执行命令？ 如果您只有2,3台服务器需要管理的时候,远程执行命令确实没有没多大作用,您可以登录到每台服务器上去完成各种操作.
当您的服务器大于3台的时候,远程执行的命令的方式就可以大大提高您的生产力了.

如果您有一个可以远程执行命令的工具,那么就可以像操作单台机器那样操作多台机器,机器越多,效率提高的越多. 远程执行命令最常用的方法就是利用 SSH 协议,将命令发送到远程机器上执行,并获取返回结果.

## 代码

连接包含了认证,可以使用 `password` 或者 `sshkey` 2种方式来认证.下面的示例为了简单,使用了密码认证的方式来完成连接.

```go
package main

import (
	"fmt"
	"github.com/mitchellh/go-homedir"
	"golang.org/x/crypto/ssh"
	"io/ioutil"
	"log"
	"time"
)

func main(){
	sshHost := "home.xxx.cn"
	sshUser := "x"
	sshPassword := "xxxxxx"
	sshType := "password"//password 或者 key
	sshKeyPath := ""//ssh id_rsa.id 路径"
	sshPort := 22


	//创建sshp登陆配置
	config := &ssh.ClientConfig{
		Timeout:         time.Second,//ssh 连接time out 时间一秒钟, 如果ssh验证错误 会在一秒内返回
		User:            sshUser,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), //这个可以, 但是不够安全
		//HostKeyCallback: hostKeyCallBackFunc(h.Host),
	}
	if sshType == "password" {
		config.Auth = []ssh.AuthMethod{ssh.Password(sshPassword)}
	} else {
		config.Auth = []ssh.AuthMethod{publicKeyAuthFunc(sshKeyPath)}
	}



	//dial 获取ssh client
	addr := fmt.Sprintf("%s:%d", sshHost, sshPort)
	sshClient, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		log.Fatal("创建ssh client 失败",err)
	}
	defer sshClient.Close()


	//创建ssh-session
	session, err := sshClient.NewSession()
	if err != nil {
		log.Fatal("创建ssh session 失败",err)
	}
	defer session.Close()
	//执行远程命令
	combo,err := session.CombinedOutput("whoami; cd /; ls -al;echo https://github.com/libragen/felix")
	if err != nil {
		log.Fatal("远程执行cmd 失败",err)
	}
	log.Println("命令输出:",string(combo))

}

func publicKeyAuthFunc(kPath string) ssh.AuthMethod {
	keyPath, err := homedir.Expand(kPath)
	if err != nil {
		log.Fatal("find key's home dir failed", err)
	}
	key, err := ioutil.ReadFile(keyPath)
	if err != nil {
		log.Fatal("ssh key file read failed", err)
	}
	// Create the Signer for this private key.
	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		log.Fatal("ssh key signer failed", err)
	}
	return ssh.PublicKeys(signer)
}

```

## 代码详解

### 1 配置`ssh.ClientConfig`

- 建议TimeOut自定义一个比较端的时间
- 自定义`HostKeyCallback` 如果像简便就使用 `ssh.InsecureIgnoreHostKey`回调, 这种方式不是很安全
- `publicKeyAuthFunc` 如果使用`key`登陆 就需要着用这个函数量读取`id_rsa`私钥,当然您可以自定义这个访问让他支持字符串

### 2 `ssh.Dial`创建ssh客户端

拼接字符串得到ssh连接地址,同时不要忘记 defer client.Close()

### 3 `sshClient.NewSession` 创建session 会话

- 可以自定义stdin,stdout
- 可以创建pty
- 可以SetEnv

### 3 执行命令 `CombinedOutput` `run` ...

打印结果

```bash
2019/05/21 18:39:22 命令输出: pi
总用量 91
drwxr-xr-x  23 root root  4096 5月  20 11:13 .
drwxr-xr-x  23 root root  4096 5月  20 11:13 ..
drwxr-xr-x   2 root root  4096 4月   8 17:51 bin
drwxr-xr-x   6 root root  2560 1月   1  1970 boot
drwxr-xr-x  14 root root  3280 5月  21 12:17 dev
drwxr-xr-x  87 root root  4096 5月  17 09:57 etc
drwxr-xr-x   4 root root  4096 5月  17 09:56 home
drwxr-xr-x  16 root root  4096 4月   8 17:58 lib
drwx------   2 root root 16384 4月   8 18:24 lost+found
drwxr-xr-x   2 root root  4096 4月   8 17:37 media
drwxr-xr-x   2 root root  4096 4月  18 22:18 miwifi
drwxr-xr-x   2 root root  4096 4月   8 17:37 mnt
-rw-r--r--   1 root root  2787 4月  19 10:42 nginx_default_site.conf
drwxr-xr-x   3 root root  4096 4月   8 17:48 opt
dr-xr-xr-x 139 root root     0 1月   1  1970 proc
drwx------   6 root root  4096 5月  20 11:12 root
drwxr-xr-x  24 root root   760 5月  21 18:39 run
drwxr-xr-x   2 root root  4096 4月  19 13:48 sbin
drwxr-xr-x   2 root root  4096 4月   8 17:37 srv
dr-xr-xr-x  12 root root     0 5月  21 18:25 sys
drwxrwxrwt   8 root root  4096 5月  21 18:35 tmp
drwxr-xr-x  10 root root  4096 4月   8 17:37 usr
drwxr-xr-x  12 root root  4096 4月  19 10:10 var
drwxrwxrwx   3 root root  4096 4月  19 10:35 www
https://github.com/libragen/felix

```

## 高级用法

- [Go进阶52:开发扩展SSH的使用领域和功能](/golang/ssh-pty-im)
- [crypto/ssh 官方文档example](https://godoc.org/golang.org/x/crypto/ssh#pkg-examples)
- 使用命令行快速远程执行cmd [github.com/libragen/felix/ssh](https://github.com/libragen/felix/blob/master/flx/ssh.go)
- golang ssh 转websocket [ssh2ws](https://github.com/libragen/felix/tree/master/ssh2ws)
- golang ssh [自动输入sudo密码 line 50](https://github.com/libragen/felix/blob/master/flx/ternimal.go)