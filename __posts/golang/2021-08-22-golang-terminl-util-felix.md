---
layout: post 
title: "Go进阶54:Go语言命令行工具 bytegang/felix"
category: Golang 
tags: Go进阶 
keywords: 'golang,ssh,sudo' 
description: 'go命令行工具,支持RDP,ssh-server' 
coverage: felix_devops.png 
permalink: /:categories/:title 
date: 2021-08-22T11:58:54+08:00
---

## 1.解决疼点

几年前我就开发一个类似的开源工具 [mojocn/felix](https://github.com/mojocn/felix), 这个工具随着时间的推移很多功能都已经废弃,
因为工作的原因,逐渐的失去了更新和迭代的动力.

1. [bytegang/felix](https://github.com/bytegang/felix) : [bytegang/sshd](https://github.com/bytegang/sshd) 这个lib的应用实现
2. [bytegang/felix](https://github.com/bytegang/felix) : 日常工作的工具集合,可以替代 xshell sftp工具,远程桌面
3. [bytegang/felix](https://github.com/bytegang/felix) : [bytegang/sshd](https://github.com/bytegang/sshd) 教程demo, 你可以开发公司内部自己研的堡垒机

## 2. 架构

![架构图](/assets/image/felix_sshd_arch.png)
因为dao使用的是gorm,所以你可以选择其他的SQL数据库,(SQL数据库YYDS).

代码由3部分组成

1. [bytegang/pb](https://github.com/bytegang/pb) 定义通讯数据接口
2. [bytegang/sshd](https://github.com/bytegang/sshd) lib 具体实现功能,提供调用函数
3. [bytegang/felix](https://github.com/bytegang/felix) lib 具体实现功能,更多的是demo

## 3. felix 安装教程

使用 `go install` 安装

```shell
go install -u github.com/bytegang/felix
# 添加环境变量到 PATH
# vim /etc/profile
# $GOBIN https://cloud.tencent.com/developer/article/1656263
# 添加行  export PATH=$PATH:$GOBIN  
# source /etc/profile
# 执行 felix -h
```

## 4. 使用教程视频

```shell
➜  ~ felix -h
这个工具是以我的儿子的英文名字命名的

Usage:
  felix [flags]
  felix [command]

Available Commands:
  asset       通过命令行来管理登录SSH
  completion  generate the autocompletion script for the specified shell
  dns         修改google-dns
  help        Help about any command
  music       scan music files
  nes         扫描.nes文件生成静态文件和json index
  qnl         显示全部七牛文件里表
  qnrm        其牛删除文件
  qnu         七牛上传(文件中转站,比scp更加方便)
  rpc         启动RPC服务
  scan-music  scan music files 生产音乐index.json
  sshd        启动SSH-server
  version     显示版本信息
  web         打开网页编辑SQLite3数据,和其他的一些操作,windows操作性不兼容代替功能

Flags:
  -h, --help      help for felix
  -V, --verbose   verbose
  -v, --version   show binary build information

Use "felix [command] --help" for more information about a command.

```

### 4.1 使用视频

<iframe src="//player.bilibili.com/player.html?aid=547533424&bvid=BV1fq4y1M78R&cid=394265765&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

### 4.2 felix SFTP 和命令行

<iframe src="//player.bilibili.com/player.html?aid=207568897&bvid=BV1uh411q7ir&cid=394285096&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

## 5. 代码仓库

- [bytegang/felix](https://github.com/bytegang/felix)
- [bytegang/sshd](https://github.com/bytegang/sshd)
- [bytegang/pb](https://github.com/bytegang/felix)