---
layout: post
title: Go教程:12-for-range循环迭代
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,for-range循环迭代,for-range坑
description:  Go语言教程,for-range循环迭代,for-range坑
permalink: /:categories/:title
coverage: golang_range.jpg
date: 2019-08-26T21:03:54+08:00
---

range 关键字用来遍历 list,array 或者 map.为了方便理解,可以认为 range 等效于 for earch index of.
对于 arrays 或者 slices, 将会返回整型的下标;对于 map,将会返回下一个键值对的 key.
支持返回单值或者两个值, 如果返回一个值,那么为下标,否则为下标和下标所对应的值.

## 1. for-range遍历Array/slice

第一个返回值 ix 是数组或者切片的索引,第二个是在该索引位置的值;他们都是仅在 for 循环内部可见的局部变量.
value 只是 slice1 某个索引位置的值的一个拷贝,不能用来修改 slice1 该索引位置的值.

```go
package main
import "fmt"
func main() {
    //这是我们使用range去求一个slice的和.使用数组跟这个很类似
    nums := []int{2, 3, 4}
    sum := 0
    for _, num := range nums {
        sum += num
    }
    fmt.Println("sum:", sum)
    //在数组上使用range将传入index和值两个变量.上面那个例子我们不需要使用该元素的序号,所以我们使用空白符"_"省略了.有时侯我们确实需要知道它的索引.
    for i, num := range nums {
        if num == 3 {
            fmt.Println("index:", i)
        }
    }
}
```

## 2.for-range 多维Slice/Array

通过计算行数和矩阵值可以很方便的写出如的 for 循环来：

```go
for row := range screen {
	for column := range screen[row] {
		screen[row][column] = 1
	}
}
```

## 3.for-range遍历map

range也可以用在map的键值对上
***注意 map 不是按照 key 的顺序排列的,也不是按照 value 的序排列的***

```go
package main
import "fmt"
func main() {
    //range也可以用在map的键值对上.
    kvs := map[string]string{"a": "apple", "b": "banana"}
    for k, v := range kvs {
        fmt.Printf("%s -> %s\n", k, v)
    }
}
```

## 4.for-range遍历string字符串

range也可以用来枚举Unicode字符串.第一个参数是字符的索引,第二个是字符（Unicode的值）本身.

```go
package main
import "fmt"
func main() {

    //range也可以用来枚举Unicode字符串.第一个参数是字符的索引,第二个是字符（Unicode的值）本身.
    for i, c := range "go" {
        fmt.Println(i, c)
    }
}
```

## 5.for-range的坑

在循环的过程当中,并不是每一次循环都申请一个不同的临时变量item,而且整次循环只声明一个临时变量,在循环结束后这个变量会被gc回收.
每次循环都会把Slice中的一个值赋值给item,然后输出出来

***在整个循环当中golang只会定义一个临时变量i,内存空间只有一份,每次遍历的值都会放在这个内存的空间中***

```go
var ss [5]struct{}

//第一种情况,很正常,输出0,1,2,3,4
for i := range ss {
	fmt.Println(i)
}

//第二种情况,典型的Go语言闭包,它捕获了变量i,但是要注意的是它持有的是引用不是拷贝,当for循环结束时,i=4
//所以闭包输出的结果都是4
for i := range ss {
	defer func() {
		fmt.Println(i)
	}()
}

//第三种情况,这种情况下的闭包,它并没有捕获变量i,而是通过传参的方式,这种情况下它得到的是拷贝
//所以其结果是4,3,2,1,0
for i := range ss {
	defer func(i int) {
		fmt.Println(i)
	}(i)
}
```