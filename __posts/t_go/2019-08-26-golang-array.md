---
layout: post
title: Go教程:10-array数组
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,array数组
description:  Go语言教程,Golang教程,array数组
permalink: /:categories/:title
coverage: golang_array.png
date: 2019-08-26T17:00:54+08:00
---


数组是具有相同 唯一类型 的一组已编号且长度固定的数据项序列（这是一种同构的数据结构）;
这种类型可以是任意的原始类型例如整型,字符串或者自定义类型.数组长度必须是一个常量表达式,并且必须是一个非负整数.

声明的格式是：

```go
var identifier [len]type  
```

示例:

```go
var arr_name [5]int  
```

## 1.Array注意事项

注意事项 如果我们想让数组元素类型为任意类型的话可以使用空接口作为类型.当使用值时我们必须先做一个类型判断.

数组元素可以通过 索引（位置）来读取（或者修改）,索引从 0 开始,第一个元素索引为 0,第二个索引为 1,以此类推.（数组以 0 开始在所有类 C 语言中是相似的）.
元素的数目,也称为长度或者数组大小必须是固定的并且在声明该数组时就给出（编译时需要知道数组长度以便分配内存）;数组长度最大为 2Gb.

每个元素是一个整型值,当声明数组时所有的元素都会被自动初始化为默认值 0.

## 2.Array遍历

由于索引的存在,遍历数组的方法自然就是使用 for 结构:

```go
package main
import "fmt"

func main() {
	var arr1 [5]int

	for i:=0; i < len(arr1); i++ {
		arr1[i] = i * 2
	}

	for i:=0; i < len(arr1); i++ {
		fmt.Printf("Array at index %d is %d\n", i, arr1[i])
	}
}
```

for 循环中的条件非常重要：i < len(arr1),如果写成 i <= len(arr1) 的话会产生越界错误.

```go
for i:=0; i < len(arr1); i++｛
	arr1[i] = ...
}
```

for-range 的生成方式：

```go
for i,_:= range arr1 {
...
}
```

## 3.多维数组

数组通常是一维的,但是可以用来组装成多维数组,例如：[3][5]int,[2][2][2]float64.

内部数组总是长度相同的.Go 语言的多维数组是矩形式的,

```go
package main
const (
	WIDTH  = 1920
	HEIGHT = 1080
)

type pixel int
var screen [WIDTH][HEIGHT]pixel

func main() {
	for y := 0; y < HEIGHT; y++ {
		for x := 0; x < WIDTH; x++ {
			screen[x][y] = 0
		}
	}
}
```

## 4.将数Array递给函数

把一个大数组传递给函数会消耗很多内存.有两种方法可以避免这种现象：

1. 传递数组的指针
2. 使用数组的切片

```go
package main
import "fmt"

func main() {
	array := [3]float64{7.0, 8.5, 9.1}
	x := Sum(&array) // Note the explicit address-of operator
	// to pass a pointer to the array
	fmt.Printf("The sum of the array is: %f", x)
}

func Sum(a *[3]float64) (sum float64) {
	for _, v := range a { // derefencing *a to get back to the array is not necessary!
		sum += v
	}
	return
}
```