---
layout: post
title: Go进阶21:Goland 6条Tips让编程更有效率
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,IDE,Goland 6条Tips让编程更有效率
description:  Go语言教程,Golang教程,Goland 6条Tips让编程更有效率
permalink: /go/:title
coverage: code_fast.png
date: 2019-09-01T09:45:54+08:00
---

作为一个重度使用Jetbrains IDE 全家桶的用户.
这里我有几条可以加速您开发速度,减少您Paste/Copy敲打键盘的Tips.

## 1.快速实现 Interface

操作步骤:

1. 光标移动到struct 名称上
2. Alt/Option + Enter
3. 选择Implement Interface ... Control+I
4. 搜索您需要实现的interface

![](/assets/image/goland__implement_interface.gif)

## 2.快速抽象 Interface

操作步骤:

1. 右键 struct 名称
2. 选择 Refactor->Extract->Interface
3. 选择要抽象的方法,填写interface名称

![](/assets/image/goland_extract_interface.gif)

## 3.快速填充Struct

操作步骤:
1.把您的光标放在`{}`中间
2.Alt/Option + Enter
3.选择Fill Struct 或者 Fill Struct Recursively(递归填充)

![](/assets/image/goland_fill_struct.gif)

## 4.快速struct工厂方法

操作步骤:

1. 光标移动到struct 名称上
2. Alt/Option + Enter
3. Generate Constructor
4. 选择属性

![](/assets/image/goland_struct_generate.gif)

## 5.快速生成TestCase文件

需要`go get golang.org/x/tools/imports` `go get github.com/cweill/gotests`支持

操作步骤:

1. 光标移动到Method/Function上
2. Command/Control+Shift+T

![](/assets/image/goland_test_generate.gif)

## 6.Live Template 让代码飞起来

实时代码模板只是为了让我们更加高效的写一些固定模式的代码,以提高编码效率,同时也可以增加个性化.
调用常规的实时代码模板主要是通过两个快捷键：Tab 和 Ctrl + J.虽然 IntelliJ IDEA 支持修改此对应的快捷键,但是默认大家都是这样使用的,所以没有特别原因就不要去改
该两个快捷键的使用方法：在输入模板的缩写名称后按 Tab 键,即立即生成预设语句.如果按 Ctrl + J 则会先提示与之匹配的实时代码模板介绍,然后还需按 Enter 才可完成预设语句的生成

![](/assets/image/goland_live_template.gif)
