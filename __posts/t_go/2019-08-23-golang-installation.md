---
layout: post
title: Go教程:02-Go环境安装
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Go语言windows/.macOS/linux/raspberryPi环境安装
description:  Go语言开发环境linux/windows/mac按章
permalink: /:categories/:title
coverage: golang_tutorial_coverage.jpg
ref_: 'https://www.javatpoint.com/go-tutorial'
---

Go语言windows/.macOS/linux/raspberryPi开发环境安装是编程的第一步,也是最简单的.
现在我们就就开始安装最新的go语言开发环境.这篇文章的时候go版本号`1.12.9` [最新的下载页面](https://golang.google.cn/dl/)

从Go 1.13开始,go命令默认使用Go模块镜像和Go运行的校验和数据库来下载和验证模块. 有关这些服务的隐私信息,请参阅https://proxy.golang.org/privacy ;
有关 配置详细信息, 请参阅 go命令文档,包括如何禁用这些服务器或使用不同的服务器.

windows和mac安装最为简单

## windows msi安装Go语言环境

- 下载安装包msi文件 `https://dl.google.com/go/go1.12.9.windows-amd64.msi`, `1.12.9` 您可以替换成您想要的版本
- 下载完成之后双击`go1.12.9.windows-amd64.msi`安装文件,同意协议,选择安装路径,**勾选自动给您添加环境变量**
- 检查go是否安装成功, 在`git-bash`或者`powershell`或者`CMD`中敲入 `go env`
- 墙内用户设置环境变量`goproxy` 为`https://goproxy.io` 或者 `https://mirrors.aliyun.com/goproxy/`

## .macOS pkg安装Go语言环境

- 下载安装包pkg文件 `https://dl.google.com/go/go1.12.9.darwin-amd64.pkg`, `1.12.9` 您可以替换成您想要的版本
- 下载完成之后双击`go1.12.9.darwin-amd64.pkg`安装文件,同意协议,选择安装路径,**勾选自动给您添加环境变量**
- 检查go是否安装成功, 在`terminal`中敲入 `go env`
- 墙内用户设置环境变量`goproxy` 为`https://goproxy.io` 或者 `https://mirrors.aliyun.com/goproxy/`
  `vim ~/.bashrc` 或者 `vim /etc/profile` 在文件最后添加 `export GOPROXY=https://goproxy.io` 或者 `export GOPROXY=https://mirrors.aliyun.com/goproxy/`
  `:wq` 命令保持文件, 在终端中执行 `source /etc/profile` 或者 `source ~/.bashrc`

## linux/centos/ubuntu 二进制装Go语言环境

下载安装二进制安装包

```bash
VERSION='1.12.9';#设置go语言版本 指定您的版本
OS=linux # 可选值 linux darwin
ARCH=amd64 #可选值 但是必须与您的操作系统匹配 amd64, 386, arm (树莓派raspberryPi3), arm64, s390x, ppc64le
GZFILE="go$VERSION.$OS-$ARCH.tar.gz" # 下载的安装名称包含arch
wget "https://dl.google.com/go/${GZFILE}";
rm -rf /usr/local/go; # 删除旧的go安装文件
tar -C /usr/local -xzf $GZFILE; #解压文件到 /usr/local/go目录中
```

墙内用户设置环境变量`goproxy` 为`https://goproxy.io` 或者 `https://mirrors.aliyun.com/goproxy/`
`vim ~/.bashrc` 或者 `vim /etc/profile` 在文件最后添加 `export GOPROXY=https://goproxy.io` 或者 `export GOPROXY=https://mirrors.aliyun.com/goproxy/`
`:wq` 命令保持文件, 在终端中执行 `source /etc/profile` 或者 `source ~/.bashrc`

当然以上命令也使用于macOS系统但是要选择适合的arch 操作系统

## windows 设置goproxy教程,下载墙外的go依赖包

在Windows Powershell中,您可以执行以下命令.

```powershell
# Enable the go modules feature
$env:GO111MODULE=on
# Set the GOPROXY environment variable
# 或者设置成阿里云的镜像 https://mirrors.aliyun.com/goproxy/
$env:GOPROXY=https://goproxy.io

```

现在,当您构建并运行应用程序时,go将通过`goproxy`代理获取依赖项.

如果您的Go版本> = 1.13,则`GOPRIVATE`环境变量控制go命令认为哪些模块是私有的（不公开）,因此不应使用代理或校验和数据库.例如：
go version > = 1.13

```
go env -w GOPROXY=https://goproxy.io,direct
# Set environment variable allow bypassing the proxy for selected modules
# 设置.corp.example.com 包名的依赖不使用goproxy代理
go env -w GOPRIVATE=*.corp.example.com
```
