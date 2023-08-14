---
layout: post
title: Go教程:14-array-slice-list区别和场景
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,array-slice-list区别和使用场景,数组,切片,链表的区别,使用场景
description:  Go语言教程,Golang教程,array-slice-list区别和使用场景,数组,切片,链表的区别和使用场景
permalink: /:categories/:title
coverage: golang_list.png
date: 2019-08-28T15:18:54+08:00
---

array 和 slice 看似相似,却有着极大的不同,但他们之间还有着千次万缕的联系 slice 是引用类型,是 array 的引用,相当于动态数组,
这些都是 slice 的特性,但是 slice 底层如何表现,内存中是如何分配的,特别是在程序中大量使用 slice 的情况下,怎样可以高效使用 slice？
今天借助 Go 的 unsafe 包来探索 array 和 slice 的各种奥妙

## 1. Array数组概念

数组是具有相同 唯一类型 的一组已编号且长度固定的数据项序列（这是一种同构的数据结构）;
这种类型可以是任意的原始类型例如整型,字符串或者自定义类型.
数组长度必须是一个常量表达式,并且必须是一个非负整数.
数组长度也是数组类型的一部分,所以[5]int和[10]int是属于不同类型的.数组的编译时值初始化是按照数组顺序完成的.

Array数组要点:

- 一组已编号且长度固定的数据项序列
- 类型可以是任意的原始类型例如整型,字符串或者自定义类型
- 数组长度必须是一个常量表达式,并且必须是一个非负整数
- 数组长度也是数组类型的一部分
- 使用 make 来创建

之前的疑问,为什么数组不能用 make 创建？ 上面分析了解到数组操作是在编译时转换成对应指令的,
而 make 是在运行时处理（特殊状态下会做编译器优化,make可以被优化,下面 slice 分析时来讲

## 2. Slice切片

切片（slice）是对数组一个连续片段的引用（该数组我们称之为相关数组,通常是匿名的）,
所以切片是一个引用类型（因此更类似于 C/C++ 中的数组类型,或者 Python 中的 list 类型）.这个片段可以是整个数组,
或者是由起始和终止索引标识的一些项的子集.
需要注意的是,终止索引标识的项不包括在切片内.切片提供了一个相关数组的动态窗口.

## 3. Array 和 Slice之间的关系

***切片（slice）是对数组(slice)一个连续片段的引用***（该数组我们称之为相关数组,通常是匿名的）

***优点 因为切片是引用,所以它们不需要使用额外的内存并且比使用数组更有效率,所以在 Go 代码中 切片比数组更常用.***

## 4. Array 和 slice 的区别

声明数组时,方括号内写明了数组的长度或者...,声明slice时候,方括号内为空
作为函数参数时,数组传递的是数组的副本,而slice传递的是指针.

## 5. container/list Go标准库链表

Go的标准包container中包含了常用的容器类型,包括conatiner/list,container/heap,container/ring.本篇介绍conatiner/list.

conatiner/list实现了一个双向链表.使用起来与其他语言的动态列表非常相似

```go
package main

import (
    "container/list"
    "fmt"
)

func main() {
    nums := list.New()
    nums.PushBack(1)
    nums.PushBack(2)
    nums.PushBack(3)
    for e := nums.Front(); e != nil; e = e.Next() {
        fmt.Println(e.Value)
    }
}
```

## 6. 为何不用动态链表实现slice

首先拷贝一断连续的内存是很快的,假如不想发生拷贝,也就是用动态链表,那您就没有连续内存.
此时随机访问开销会是：链表 O(N), 2倍增长块链 O(LogN),二级表一个常数很大的O(1).
问题不仅是算法上开销,还有内存位置分散而对缓存高度不友好,这些问题i在连续内存方案里都是不存在的.除非您的应用是狂append然后只顺序读一次,否则优化写而牺牲读都完全不 make sense.
而就算您的应用是严格顺序读,缓存命中率也通常会让您的综合效率比拷贝换连续内存低.

对小 slice 来说,连续 append 的开销更多的不是在 memmove, 而是在分配一块新空间的
memory allocator 和之后的 gc 压力（这方面对链表更是不利）.所以,当您能大致知道所需的最大空间（在大部分时候都是的）时,
在make的时候预留相应的 cap 就好.如果所需的最大空间很大而每次使用的空间量分布不确定,那您就要在浪费内存和耗 CPU 在 allocator + gc 上做权衡.

Go 在 append 和 copy 方面的开销是可预知+可控的,应用上简单的调优有很好的效果.
这个世界上没有免费的动态增长内存,各种实现方案都有设计权衡

## 6. Array Slice 链表使用场景

- 固定长度或者已知长度使用Array,性能更优
- 不定长度需要append...大部分情况下使用slice
- 当程序要求slice的容量超大并且需要频繁的更改slice的内容时,就不应该用slice,改用list更合适.
  
