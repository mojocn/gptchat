---
layout: post
title: Go教程:23 string转换int类型方法对比
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,字符串string转换integer/int
description:  Go语言教程,Golang教程,字符串string转换integer/int
permalink: /go/:title
coverage: golang_fight.png
date: 2019-09-23T16:55:54+08:00
---

Go语言时一个强类型的语言,但是强类型的语言有也强类型的语言的烦恼.这个烦恼就是类型转换,
接下来我们就讲解一下怎么把 string 类型变量转换成 integer 类型变量.

## 1. 性能最佳的方式: strconv.ParseInt(...)

strconv 包实现了字符串与数字（整数,浮点数等）之间的互相转换.
strconv.ParseInt（）的bitSize参数不会将字符串转换为您选择的类型,
而只是在此处将结果限制为特定的“位”,如果想要得到您要的int类型必须手动转换类型.

- 转换成十进制int64`strconv.ParseInt("2345",10,64)`
- 转换成八进制int32`strconv.ParseInt("0xFF",0,32)`
- 转换成16进制int64`strconv.ParseInt("FF",16,64)`

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	fmt.Println(strconv.ParseInt("-12", 10, 0)) // -12 <nil>
	fmt.Println(strconv.ParseInt("0xFF", 0, 0)) // 255 <nil>
	fmt.Println(strconv.ParseInt("FF", 16, 0))  // 255 <nil>
	fmt.Println(strconv.ParseUint("12", 10, 0))  // 12 <nil>
	
	fmt.Println(strconv.ParseInt("0xFF", 10, 0)) // 0 strconv.ParseInt: parsing "0xFF": invalid syntax
	fmt.Println(strconv.ParseUint("-12", 10, 0)) // 0 strconv.ParseUint: parsing "-12": invalid syntax
}
```

输结果

```bash
-12 <nil>
255 <nil>
255 <nil>
12 <nil>
0 strconv.ParseInt: parsing "0xFF": invalid syntax
0 strconv.ParseUint: parsing "-12": invalid syntax
```

## 2. 最灵活性的方法: fmt.Sscanf(...)

fmt.Sscanf为格式字符串提供了更大的灵活性,
您可以在输入中指定数字格式（例如宽度,基数等）以及其他额外的字符string,

这对于解析包含数字的自定义字符串非常有用,例如,如果以"id:00123"您有前缀的形式提供输入,
"id:"并且数字固定为5位数字,如果较短则用零填充,这很容易解析,如下所示：

```go
s := "id:00123"

var i int
if _, err := fmt.Sscanf(s, "id:%5d", &i); err == nil {
    fmt.Println(i) // Outputs 123
}
```

## 3. 性能还行的方法: strconv.Atoi(...)

strconv 包实现了字符串与数字（整数,浮点数等）之间的互相转换.
很多朋友都不知道Atoi代表什么意思, A 就是ASCII, i就是integer,所以Atoi= ASCII to integer.
ItoA= Integer to ASCII.

实际上strconv.Atoi 还是调用 strconv.ParseInt

```go
package main
//xiaorui.cc      
import (
    "strconv"
)
 
func main() {
    i, err := strconv.Atoi("8888")
    if err != nil {
        panic(err)
    }
    i += 3
    println(i)
      
    s := strconv.Itoa(333)
    s += "3"
    println(s)
}
```

## 4. 三种方法benchmark

atoi_test.go

```go
package main

import "fmt"
import "strconv"
import "testing"

var num = 8568452
var numstr = "8568452"
//测试 strconv.ParseInt
func BenchmarkStrconvParseInt(b *testing.B) {
  num64 := int64(num)
  for i := 0; i < b.N; i++ {
    x, err := strconv.ParseInt(numstr, 10, 64)
    if x != num64 || err != nil {
      b.Error(err)
    }
  }
}
//测试 strconv.Atoi
func BenchmarkAtoi(b *testing.B) {
  for i := 0; i < b.N; i++ {
    x, err := strconv.Atoi(numstr)
    if x != num || err != nil {
      b.Error(err)
    }
  }
}
//测试 fmt.Sscan
func BenchmarkFmtSscan(b *testing.B) {
  for i := 0; i < b.N; i++ {
    var x int
    n, err := fmt.Sscanf(numstr, "%d", &x)
    if n != 1 || x != num || err != nil {
      b.Error(err)
    }
  }
}
```

执行benchmark: `go test -bench=. atoi_test.go`
ns/op 代表每次操作消耗多少纳秒.

```go
BenchmarkStrconvParseInt-8      100000000           17.1 ns/op
BenchmarkAtoi-8                 100000000           19.4 ns/op
BenchmarkFmtSscan-8               2000000          693   ns/op
PASS
ok      command-line-arguments  5.797s
```