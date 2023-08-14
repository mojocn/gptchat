---
layout: post
title: Go教程:11-slice切片
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,slice切片
description:  Go语言教程,Golang教程,slice切片
permalink: /:categories/:title
coverage: golang_slice.png
date: 2019-08-26T18:30:54+08:00
---

Go 语言切片是对数组的抽象.
Go 数组的长度不可改变,在特定场景中这样的集合就不太适用,
Go中提供了一种灵活,功能强悍的内置类型切片("动态数组"),与数组相比切片的长度是不固定的,可以追加元素,在追加时可能使切片的容量增大.

切片（slice）是对数组一个连续片段的引用（该数组我们称之为相关数组,通常是匿名的）,
所以切片是一个引用类型（因此更类似于 C/C++ 中的数组类型,或者 Python 中的 list 类型）.
这个片段可以是整个数组,或者是由起始和终止索引标识的一些项的子集.需要注意的是,终止索引标识的项不包括在切片内.切片提供了一个相关数组的动态窗口.

## 1.定义切片

您可以声明一个未指定大小的数组来定义切片,切片不需要说明长度.

```go
var identifier []type

```

或使用make()函数来创建切片:

```go
var slice1 []type = make([]type, len)

也可以简写为

slice1 := make([]type, len)
```

也可以指定容量,其中capacity为可选参数.

```go
make([]T, length, capacity)
```

这里 len 是数组的长度并且也是切片的初始长度.

## 2.将切片传递给函数

如果您有一个函数需要对数组做操作,您可能总是需要把参数声明为切片.当您调用该函数时,把数组分片,创建为一个 切片引用并传递给该函数.这里有一个计算数组元素和的方法:

```go
func sum(a []int) int {
	s := 0
	for i := 0; i < len(a); i++ {
		s += a[i]
	}
	return s
}

func main() {
	var arr = [5]int{0, 1, 2, 3, 4}
	sum(arr[:])
}
```

## 3.用 make() 创建一个切片

当相关数组还没有定义时,我们可以使用 make() 函数来创建一个切片 同时创建好相关数组：`var slice1 []type = make([]type, len)`.

也可以简写为 `slice1 := make([]type, len)`,这里 `len` 是数组的长度并且也是 `slice` 的初始长度.

所以定义 `s2 := make([]int, 10)`,那么 `cap(s2) == len(s2) == 10`.

make 接受 2 个参数：元素的类型以及切片的元素个数.

如果您想创建一个 slice1,它不占用整个数组,而只是占用以 len 为个数个项,那么只要：`slice1 := make([]type, len, cap)`.

make 的使用方式是：`func make([]T, len, cap)`,其中 cap 是可选参数.

所以下面两种方法可以生成相同的切片:

```go
make([]int, 50, 100)
new([100]int)[0:50]
```

下图描述了使用 make 方法生成的切片的内存结构：![](images/7.2_fig7.2.1.png?raw=true)

示例 7.8 [make_slice.go](examples/chapter_7/make_slice.go)

```go
package main
import "fmt"

func main() {
	var slice1 []int = make([]int, 10)
	// load the array/slice:
	for i := 0; i < len(slice1); i++ {
		slice1[i] = 5 * i
	}

	// print the slice:
	for i := 0; i < len(slice1); i++ {
		fmt.Printf("Slice at %d is %d\n", i, slice1[i])
	}
	fmt.Printf("\nThe length of slice1 is %d\n", len(slice1))
	fmt.Printf("The capacity of slice1 is %d\n", cap(slice1))
}
```

输出：

	Slice at 0 is 0  
	Slice at 1 is 5  
	Slice at 2 is 10  
	Slice at 3 is 15  
	Slice at 4 is 20  
	Slice at 5 is 25  
	Slice at 6 is 30  
	Slice at 7 is 35  
	Slice at 8 is 40  
	Slice at 9 is 45  
	
	The length of slice1 is 10  
	The capacity of slice1 is 10  

因为字符串是纯粹不可变的字节数组,它们也可以被切分成 切片.

## 4.new() 和 make() 的区别

看起来二者没有什么区别,都在堆上分配内存,但是它们的行为不同,适用于不同的类型.

- new(T) 为每个新的类型T分配一片内存,初始化为 0 并且返回类型为\*T的内存地址：这种方法 **返回一个指向类型为 T,值为 0 的地址的指针**,它适用于值类型如数组和结构体（参见第 10
  章）;它相当于 `&T{}`.
- make(T) **返回一个类型为 T 的初始值**,它只适用于3种内建的引用类型：切片,map 和 channel（参见第 8 章,第 13 章）.

换言之,new 函数分配内存,make 函数初始化;下

```go
var p *[]int = new([]int) // *p == nil; with len and cap 0
p := new([]int)
```

在第二幅图中, `p := make([]int, 0)` ,切片 已经被初始化,但是指向一个空的数组.

以上两种方式实用性都不高.下面的方法：

```go
var v []int = make([]int, 10, 50)
```

或者

```go
v := make([]int, 10, 50)
```

这样分配一个有 50 个 int 值的数组,并且创建了一个长度为 10,容量为 50 的 切片 v,该 切片 指向数组的前 10 个元素.

## 5.多维 切片

和数组一样,切片通常也是一维的,但是也可以由一维组合成高维.通过分片的分片（或者切片的数组）,长度可以任意动态变化,所以 Go 语言的多维切片可以任意切分.而且,内层的切片必须单独分配（通过
make 函数）.

## 6.bytes 包

类型 `[]byte` 的切片十分常见,Go 语言有一个 bytes 包专门用来解决这种类型的操作方法.

bytes 包和字符串包十分类似.而且它还包含一个十分有用的类型 Buffer:

```go
import "bytes"

type Buffer struct {
	...
}
```

这是一个长度可变的 bytes 的 buffer,提供 Read 和 Write 方法,因为读写长度未知的 bytes 最好使用 buffer.

Buffer 可以这样定义：`var buffer bytes.Buffer`.

或者使用 new 获得一个指针：`var r *bytes.Buffer = new(bytes.Buffer)`.

或者通过函数：`func NewBuffer(buf []byte) *Buffer`,创建一个 Buffer 对象并且用 buf 初始化好;NewBuffer 最好用在从 buf 读取的时候使用.

**通过 buffer 串联字符串**

类似于 Java 的 StringBuilder 类.

在下面的代码段中,我们创建一个 buffer,通过 `buffer.WriteString(s)` 方法将字符串 s 追加到后面,最后再通过 `buffer.String()` 方法转换为 string：

```go
var buffer bytes.Buffer
for {
	if s, ok := getNextString(); ok { //method getNextString() not shown here
		buffer.WriteString(s)
	} else {
		break
	}
}
fmt.Print(buffer.String(), "\n")
```

这种实现方式比使用 `+=` 要更节省内存和 CPU,尤其是要串联的字符串数目特别多的时候.

## 6.切片Slice与数组Array的区别

1. 切片不是数组,但是切片底层指向数组
2. 切片本身长度是不一定的因此不可以比较,数组是可以的.
3. 切片是变长数组的替代方案,可以关联到指向的底层数组的局部或者全部.
4. 切片是引用传递（传递指针地址),而数组是值传递（拷贝值）
5. 切片可以直接创建,引用其他切片或数组创建
6. 如果多个切片指向相同的底层数组,其中一个值的修改会影响所有的切片

## 7.Append/Copy切片Slice

正如我们已经知道数组的长度是固定的,它的长度不能增加. 切片是动态的,使用 append 可以将新元素追加到切片上.append 函数的定义是

`func append（s[]T,x ... T）[]T`

append可以直接在切片尾部追加元素,也可以将一个切片追加到另一个切片尾部.

```go
package main

import "fmt"

func main() {
   var numbers []int
   printSlice(numbers)

   /* 允许追加空切片 */
   numbers = append(numbers, 0)
   printSlice(numbers)

   /* 向切片添加一个元素 */
   numbers = append(numbers, 1)
   printSlice(numbers)

   /* 同时添加多个元素 */
   numbers = append(numbers, 2,3,4)
   printSlice(numbers)

   /* 创建切片 numbers1 是之前切片的两倍容量*/
   numbers1 := make([]int, len(numbers), (cap(numbers))*2)

   /* 拷贝 numbers 的内容到 numbers1 */
   copy(numbers1,numbers)
   printSlice(numbers1)   
}

func printSlice(x []int){
   fmt.Printf("len=%d cap=%d slice=%v\n",len(x),cap(x),x)
}
```

