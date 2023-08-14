---
layout: post
title: 安装Go和环境配置讲解
category: Golang
tags: Golang
keywords: go语言,如何安装go,
description: 安装配置Go/golang开发环境,go的安装我们也可以采用三种方式进行,从简单到复杂依次是通过系统方式安装,官方二进制包安装和源码编译安装
coverage: ginbro_coverage.jpg
---

Go 语言就在这样的环境下诞生了,它让人感觉像是 Python 或 Ruby 这样的动态语言,但却又拥有像 C 或者 Java 这类语言的高性能和安全性.

Go 语言出现的目的是希望在编程领域创造最实用的方式来进行软件开发.它并不是要用奇怪的语法和晦涩难懂的概念来从根本上推翻已有的编程语言,而是建立并改善了 C,Java,C#
中的许多语法风格.它提倡通过接口来针对面向对象编程,通过 goroutine 和 channel 来支持并发和并行编程.

因为 Go 语言还是一门相对年轻的编程语言,所以不管是在集成开发环境（IDE）还是相关的插件方面,发展都不是很成熟.不过目前还是有一些 IDE 能够较好地支持 Go 的开发,有些开发工具甚至是跨平台的,您可以在
Linux,Mac OS X 或者 Windows 下工作.

Go 语言支持以下系统：

- Linux
- FreeBSD
- Mac OS X（也称为 Darwin）
- Windows
  安装包下载地址为：[https://golang.org/dl/](https://golang.org/dl/)

如果打不开可以使用这个地址：[https://golang.google.cn/dl/](https://golang.google.cn/dl/).

## 1. 如何Go安装

和其他语言的安装类似,go的安装我们也可以采用三种方式进行,从简单到复杂依次是通过系统方式安装,官方二进制包安装和源码编译安装.

### 1.1 系统方式

不同操作系统通常都会为go提供相应的安装软件方式.这种方式很大程度上简化了安装过程,能为我们省去一些繁杂的步骤.下面分别介绍下不同系统下的安装方式：

**windows**

在windows下,软件安装通常可通过下载类似 `setup.exe/msi` 软件包来操作.按照导航的提示,不断执行 "下一步" "下一步" 即可完成.访问 [下地地址](https://golang.google.cn/dl/) 将看到如下内容：

![tech.mojotv.cn_](/assets/pic/L2ltZy9yZW1vdGUvMTQ2MDAwMDAxOTkxMTg3MQ.jpg)

选择其中的 "Microsoft Windows" 下载windows安装包.现在的系统基本都是64位的了,一般情况下不用考虑32/64位系统的问题.

下载好了安装包,点击启动执行,接下来的步骤就是按导航提示一步步操作即可.有一点要注意的是,GO的默认安装在C:GO,如果要修改默认安装路径,在见到如下界面时重新选择.

![tech.mojotv.cn_](/assets/pic/L2ltZy9yZW1vdGUvMTQ2MDAwMDAxOTkxMTg3Mg.jpg)

**ubuntu/debian**

在`debian`或`ubuntu`上,我们可使用 `apt-get` 命令安装go.比如,在Ubuntu 16.04.5 LTS系统,使用如下命令安装：

```go
sudo apt-get update // 视情况决定是否更新
sudo apt-get install golang-go
```

如果是新建的系统,建议先`update`下软件源.否则可能会因为某些源异常而无法顺利安装.

**centos/redhat**

在`centos`或`redhat`上,我们可以使用yum命令安装go.比如,在CentOS 7.5上,使用如下命令安装：

```go
$ yum epel-release
$ yum install golang
```

先下载了epel-releaes源,可防止出现yum安装golang不支持或版本太旧的问题.

**macos**

在macos上,我们可使用pkg文件或homebrew安装go.

pkg的安装方式与windows的setup.exe/msi的类似,下载软件然后按导航 "下一步" "下一步" 即可完成.

来说说如何使用homebrew安装.和yum和apt-get不同,homebrew并非mac系统自带,我们需要先安装.进入homebrew官网,页面顶部便说明了安装的方式,命令如下：

```go
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

接着安装go,命令如下：

```go
$ brew install go
```

非常简单就完成了安装.

系统安装方式的优点是简单.缺点是我们不能保证系统提供给的版本一定能满足我们的要求,比如上面ubuntu安装的go版本就较低,为go1.6.

### 1.2 二进制包(推荐)

接下来说说如何使用二进制包安装.所谓二进制包,也就是已经编译好的包.这种安装方式在不同的操作系统上步骤类似,考虑到windows用户最多,就以windows为例吧.

再次进入到下载页面,在列表可如下内容.因为我用的32位windows虚拟机,下载i386的包.

![tech.mojotv.cn_](/assets/pic/L2ltZy9yZW1vdGUvMTQ2MDAwMDAxOTkxMTg3Mw.jpg)

接着把下载的压缩包解压到某个文件夹,比如c:Program Files下,进入查看,会发现其中已经包含了新的名为go的文件夹.

至此,二进制包的方式安装就完成了.因为二进制包是已编译好的软件包,所以不同系统,CPU架构下需要下载与之相应的包.

我们或许会想,就是移动个文件夹？是的,系统安装其实也就是做这些事情,不同在于系统安装在简化了操作的同时也会针对性做一些设置,比如配置好环境变量,文件分类存放等.

### 1.3 源码编译

这种安装方式的好处是与系统无关,一切控制权都掌握在自己身上,能限制我们的只有自己的能力.

上篇文章说过,go在1.5版本已经移除了源码中全部的C代码,实现了自编译.因此,我们可以用系统已有go来编译源码,从而实现新版的安装.

前面在ubuntu下,我用apt-get安装的golang比较老的go1.6版.下面通过它来编译新版go.

下载源码,最新版源码可点击 [go1.12.2.src.tar.gz](https://dl.google.com/go/go1.12.2.src.tar.gz)
下载.这里多说几句,go的源码托管在github上,地址：[https://github.com/golang/go](https://github.com/golang/go) ,如想提前尝试新功能,可直接从github拉取最新的代码编译.这也是源码编译安装的一个好处.

源码下载完成后进入源码目录即可编译.注意,如果用虚拟机编译,要保证有充足的内存.

```go
$ tar zxvf go1.12.2.src.tar.gz       // 解压源码包
$ cd go/src
$ ./all.sh
```

执行./all.sh即可完成编译安装,也挺简单的.这个过程会耗费一旦时间,要等待会.其实这里简化了很多细节,如果想仔细研究的话,可以去阅读官方文档 install go from source.

## 2. 设置环境变量

在安装完golang后,还需了解三个环境变量,分别是GOROOT,GOPATH,PATH.下面来分别介绍一下它们的作用.

### 2.1 GOROOT

GO安装的根目录.该变量在不同的版本需要选择不同的处理方式.

在 GO 1.10 之前,我们需要视不同安装方式决定是否手动配置.比如源码编译安装,安装时会有默认设置.而采用二进制包安装,在windows系统中,推荐安装位置为C:GO,在Linux,freeBSD,OS
X系统,推荐安装在/usr/local/go下.如果要自定义安装位置,必须手动设置GOROOT.如果采用系统方式安装,这一切已经帮我们处理好了.

关于这个话题,推荐阅读：you-dont-need-to-set-goroot和分析源码安装go的过程.

在 GO 1.10 及以后,这个变量已经不用我们设置了,它会根据go工具集的位置,即相对go tool的位置来动态决定GOROOT的值.说简单点,其实就是go命令决定GOROOT的位置.

关于这个话题,推荐阅读：[use os.Executable to find GOROOT](https://go-review.googlesource.com/c/go/+/42533/)
和 [github go issues 25002](http://blog.studygolang.com/2013/01/%E5%88%86%E6%9E%90%E6%BA%90%E7%A0%81%E5%AE%89%E8%A3%85go%E7%9A%84%E8%BF%87%E7%A8%8B/).

### 2.2 PATH

各个操作系统都存在的环境变量,用于指定系统可执行命令的默认查找路径,在不写完整路径情况下执行命令.

以Windows为例,我之前把go安装在 C:Program Filesgo目录下,即GOROOT为C:Program Filesgo,那么PATH变量可追加上C:Program Filesgobin.

### 2.3 GOPATH(1.21版本之后GOPATH被废弃)

如果有朋友了解python,可以将其类比为python的环境变量PYTHONPATH,用来设置我们的工作目录,即编写代码的地方.包也都是从GOPATH设置的路径中寻找.

在go 1.8之前,该变量必须手动设置.go 1.8及之后,如果没有设置,默认在$HOME/go目录下,即您的用户目录中的go目录下.

### 2.4 如何设置环境变量(shell相关)

介绍完三个变量,以我的mac为例介绍下设置方式吧.

类unix系统环境变量的设置方式都类似.使用export命令设置环境变量,并将命令加入到/etc/profile,该文件会在开启shell控制台的情况下执行.具体操作命令如下：

```go
$ sudo vim /etc/profile
...
export GOROOT=/usr/local/go         // 默认位置可不用设置,1.10版本后也可以不设置
export PATH=$PATH:$GOROOT/bin
export GOPATH=/Users/polo/work/go   // 可设置多个目录
```

经过以上步骤,环境变量配置完成,如果要立刻启用环境变量,我们需要重启下控制台.接着我们可以用go env看一下变量的配置情况.

```go
$ go env
GOARCH="amd64"
GOBIN="/usr/local/go/bin"
...
GOPATH="/Users/polo/Public/Work/go"
...
GOROOT="/usr/local/go"
```

## 3. 推荐目录结构

再简单介绍下go的目录结构.以windows为例,进入C:Program Filesgo将看到如下内容.

![tech.mojotv.cn_](/assets/pic/L2ltZy9yZW1vdGUvMTQ2MDAwMDAxOTkxMTg3NA.jpg)

介绍几个比较主要的目录：

* api,里面包含所有API列表,好像IDE使用了里面的信息;
* bin,里面是一些go的工具命令,主要是go,gofmt,godoc,命令使用方法后面介绍
* doc,go的使用文档,可以让我们在没有网络的情况下也可以阅读;
* src,主要是一些源码,如golang的编译器,各种工具集以及标准库的源码,

## 4. 入门main.go代码

介绍到这里已经差不多了,接着来写一个简单的例子,即经典的Hello World.

首先,创建一个名为hello.go的文件,后缀必须为.go,内容如下：

```go
package main

import "fmt"

func main(){
    fmt.Println("Hello World")
}
```

上面的代码主要由几部分组成,分别是

* `package main`,包声明,go中的文件必须属于某个包,main较为特殊,是程序入口所在;
* `import "fmt"`,导入fmt包,这是一种引入包的方式,接下来就可以使用fmt提供的函数变量;
* `func main() {}`,func关键字函数定义,main是函数名,在main包中为程序的入口;
* fmt.Println,main函数中的代码块,表示调用fmt提供的Println函数打印 字符串"Hello World"
  接下来,我们可以使用 go run 执行下这段代码,如下：

```go
$ go run hello.go
Hello World
```

执行输出 "Hello World".




