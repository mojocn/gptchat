---
layout: post
title: Go教程:17-make和new的区别
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,struct什么时候使用指针
description:  Go语言教程,Golang教程,struct什么时候使用指针,Go语言保留着C中值和指针的区别,但是对于指针繁琐用法进行了大量的简化,引入引用的概念
permalink: /:categories/:title
coverage: golang_make_new_coverage.png
date: 2019-08-29T15:50:54+08:00
---

Go 语言中的 new 和 make 一直是新手比较容易混淆的东西,
咋一看很相似.不过解释两者之间的不同也非常容易. 他们所做的事情,和应用的类型也不相同.
二者都是用来分配空间.

Go语言中new和make是内建的两个函数,主要用来创建分配类型内存.
在我们定义生成变量的时候,可能会觉得有点迷惑,其实他们的规则很简单,下面我们就通过一些示例说明他们的区别和使用.

## 1. new

new(T) 为一个 T 类型新值分配空间并将此空间初始化为 T 的零值,返回的是新值的地址,也就是 T 类型的指针 *T,该指针指向 T 的新分配的零值.

new要点

- 内置函数 new 分配空间.
- 传递给new 函数的是一个类型,不是一个值.
- 返回值是 指向这个新分配的零值的指针.

## 2. make

make(T, args) 返回的是初始化之后的 T 类型的值,这个新值并不是 T 类型的零值,也不是指针 *T,是经过初始化之后的 T 的引用.
make 也是内建函数,您可以从 http://golang.org/pkg/builtin/#make 看到它,
它的函数原型 比 new 多了一个（长度）参数,返回值也不同.

***make 只能用于 slice,map,channel 三种类型***,
并且只能是这三种对象. 和 new 一样,第一个参数是 类型,不是一个值.
但是make 的返回值就是这个类型（即使一个引用类型）,而不是指针.具体的返回值,依赖具体传入的类型.

## 3. 总结

- new(T) 返回 T 的指针 *T 并指向 T 的零值.
- make(T) 返回的初始化的 T,只能用于 slice,map,channel,要获得一个显式的指针,使用new进行分配,或者显式地使用一个变量的地址.
- new 函数分配内存,make函数初始化;

下图给出了区别：

![new和make的区别](/assets/image/golang_make_new.webp)

new和make区别代码:

```go
package main

import "fmt"

func main() {
    p := new([]int) //p == nil; with len and cap 0
    fmt.Println(p)

    v := make([]int, 10, 50) // v is initialed with len 10, cap 50
    fmt.Println(v)

    /*********Output****************
        &[]
        [0 0 0 0 0 0 0 0 0 0]
    *********************************/

    (*p)[0] = 18        // panic: runtime error: index out of range
                        // because p is a nil pointer, with len and cap 0
    v[1] = 18           // ok
    
}
```