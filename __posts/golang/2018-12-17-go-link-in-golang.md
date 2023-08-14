---
layout: post
title: Go进阶02:隐藏技能go:linkname
category: Golang
tags: Go进阶
description: go:linkname引导编译器将当前(私有)方法或者变量在编译时链接到指定的位置的方法或者变量,第一个参数表示当前方法或变量,第二个参数表示目标方法或变量,因为这关指令会破坏系统和包的模块化,因此在使用时必须导入unsafe
keywords: golang,go语言,go:link
date: 2018-12-26T13:19:54+08:00
---

## 什么是go:linkname

指令的格式如下：

`//go:linkname hello github.com/lastsweetop/testlinkname/hello.hellofunc`

`go:linkname`引导编译器将当前(私有)方法或者变量在编译时链接到指定的位置的方法或者变量,第一个参数表示当前方法或变量,第二个参数表示目标方法或变量,因为这关指令会破坏系统和包的模块化,因此在使用时必须导入unsafe

## 为什么要用go:linkname

这个指令不经常用,最好也不要用,但理解这个指令可以帮助您理解核心包的很多代码.在标准库中是为了可以使用另一个包的unexported的方法或者变量,在敲代码的时候是不可包外访问的,但是运行时用这个命令hack了一下,就变得可以访问.

最大的作用就是 定向可访问.

示例

```go

// Provided by package runtime.
func hellofunc() string

func Greet() string {
    return hellofunc()
}
```

`Greet()`去访问一个没有方法体的方法`hellofunc(`),IDE一般会提示错误,看到这个之后您就会明白了,这一般是另外一个包有`go:linkname`的链接

我们再看链接的函数：

```go
//go:linkname hello github.com/lastsweetop/testlinkname/hello.hellofunc
func hello() string {
    return "private.hello()"
}
```

第一个参数表示当前方法或变量,第二个参数表示需要建立链接方法,变量的路径

在这里例子中`hello()`只能被`hello.hellofunc`这里作为链接调用,其他地方是无法访问到这个方法的,只能调用包装过的`Greet`方法.这个链接过程是在编译时完成的.

## 注意点

`go:linkname`可以跨包使用

跨包使用时,目标方法或者变量必须导入有方法体的包,这个编译器才可以识别到链接

`import _ "github.com/lastsweetop/testlinkname/private"`

`go build`无法编译`go:linkname`,必须用单独的compile命令进行编译,因为go build会加上-complete参数,这个参数会检查到没有方法体的方法,并且不通过.

### [源代码地址](https://github.com/mojocn/testlinkname)