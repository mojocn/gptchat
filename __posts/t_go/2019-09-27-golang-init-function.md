---
layout: post
title: Go教程:25 Go初始化init函数
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,init函数初始化,init函数执行顺序
description: golang还有另外一个特殊的函数init函数,先于main函数执行,实现包级别的一些初始化操作
coverage: golang_init_function.jpeg
permalink: /:categories/:title
date: 2019-09-27T13:04:54+08:00
---

## 1. 什么是Go语言init函数

在Go中,预定义init()函数会触发执行init函数中的代码,使其在包的任何其他代码之前运行.
该代码将在import package后立即执行,并且可以在需要您的app以特定方式初始化,
例如,当您具有启动app的config或resource时.
import package 使用init函数的副作用来设置和初始化一些包的状态.
这通常用于register一个包和另一个包,以确保程序正在考虑代码的正确性.

尽管这init()是一个有用的工具,但有时会使代码难以阅读,因为难以搞清楚的所有包中的init()函数的执行.
因此,对于刚接触Go的开发人员来说,了解此功能的各个方面非常重要,
以便他们在coding时可以确保init()以清晰易懂的方式执行.

### 1.1 init函数的主要作用

1. 初始化不能采用初始化表达式初始化的变量.
   eg: 在init函数初始化rand函数的时间种子,初始化一个随机32长度app_secret字符串
2. 程序运行前的注册.在gorm 中有这样一段带代码`import _ "github.com/jinzhu/gorm/dialects/sqlite"`,相当于注册driver
3. 实现sync.Once功能.如果您要创出单例,在init中初始化是一个很好的方式.
4. `import _ "github.com/jinzhu/gorm/dialects/sqlite"` 这种方式使用go get/mod 下载其他package

### 1.2 init函数的主要特点

1. ***init函数先于main函数自动执行***,不能被其他函数调用;
2. ***init函数没有输入参数,返回值***;
3. ***每个包可以有多个init函数***;
4. ***包的每个源文件也可以有多个init函数***,这点比较特殊;
5. ***同一个包的init执行顺序,golang没有明确定义***,编程时要注意程序不要依赖这个执行顺序.
6. ***不同包的init函数按照包导入的依赖关系决定执行顺序***.

## 2. init函数在go语言中执行的顺序

![](/assets/image/golang_init_function_exec_order.png)

为了使用导入的包,首先必须将其初始化.
初始化总是以单线程执行,并且按照包的依赖关系顺序执行.这通过Golang的运行时系统控制.
正如上图所示:

- ***初始化导入的包（递归导入）***
- ***对包块中声明的变量进行计算和分配初始值***
- ***执行包中的init函数***

`main.go`

```go
package main

import "fmt"

var _ int64=s()

func init(){
    fmt.Println("开始执行init函数")
}

func s() int64{
    fmt.Println("开始初始化const/var")
    return 1
}

func main(){
    fmt.Println("开始执行main函数")
}
```

执行`go run main.go` 代码输出结果

```
$ go run play.go
开始初始化const/var
开始执行init函数
开始执行main函数
```

即使包被导入多次,初始化只需要一次.如果是多层级的import package 安装上面图示顺序执行.

## 3. init函数的Side Effects副作用

在Go中,有时希望导入软件包不是出于其内容,而是出于导入软件包时发生的副作用(Side Effects).
这通常意味着init()在导入的代码中有一条语句在其他任何代码之前执行,
从而使开发人员可以操纵其程序启动时的状态.这种技术被称为导入副作用(Side Effects).

导入副作用的一个常见用例是在代码中注册功能,
这使程序包知道程序需要使用代码的哪一部分.
在image封装中,例如,该image.Decode功能需要知道它正试图解码（其图像的格式jpg,png,gif等）,
然后才能执行.您可以通过首先导入具有init()语句副作用(Side Effects)的特定程序来完成此操作.

假设您正尝试对一个.png文件执行image.Decode.代码段如下：

```go
...
func decode(reader io.Reader) image.Rectangle {
    m, _, err := image.Decode(reader)
    if err != nil {
        log.Fatal(err)
    }
    return m.Bounds()
}
...
```

上面这对代码会被编译出来,不会报错.但是当我们decode png文件的时候程序将会报错.

要修复,我们需要先为image.Decode注册图片格式png.非常幸运的是image/png包init函数含一下声明.

image/png/reader.go

```go
func init() {
    image.RegisterFormat("png", pngHeader, Decode, DecodeConfig)
}
```

因此,如果我们import "image/png" 到我们上面的解码代码中,然后在image/png中的 `image.RegisterFormat()`函数将最先执行.
最终代码如下:

```go
...
import _ "image/png"
...
func decode(reader io.Reader) image.Rectangle {
    m, _, err := image.Decode(reader)
    if err != nil {
        log.Fatal(err)
    }
    return m.Bounds()
}
```

这将设置状态并注册我们需要的png版本image.Decode().
该注册将作为导入image/png包的副作用而执行.

您可能之前已经注意到空白标识符_(下划线)"image/png".
这是必需的,因为Go不允许您导入程序中未使用的程序包.
通过包括空白标识符,导入本身的值将被丢弃,从而仅导入的副作用得以解决.
这意味着,即使我们从不image/png在代码中调用该包,也可以出于副作用而将其导入.

了解何时需要导入软件包的副作用(import _ "your/package")非常重要.
如果没有正确注册,则程序可能会编译成功,但在运行时无法正常运行.
标准库中的软件包将在其文档中声明需要这种类型的导入.
如果编写的程序包需要导入以产生副作用,
则还应确保记录了init()正在使用的语句,以便导入程序包的用户将能够正确使用它.