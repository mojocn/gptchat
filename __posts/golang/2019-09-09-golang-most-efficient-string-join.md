---
layout: post
title: Go进阶26:Go语言高性能字符串拼接
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,Go语言高性能字符串拼接
description:  Go语言教程,Golang教程,Go语言高性能字符串拼接
permalink: /go/:title
coverage: golang_string.jpg
date: 2019-09-09T20:27:54+08:00
---

这是一篇关于stackoverflow热门问题的文章 [How to efficiently concatenate strings](https://stackoverflow.com/questions/1760757/how-to-efficiently-concatenate-strings/47798475#47798475)
Go里面string是最基础的类型,是一个只读类型,针对他的每一个操作都会创建一个新的string

所以,如果我在不知道结果是多少长字符串的情况下不断的连接字符串,怎么样的方式是最好的呢?

## 1. 方法一:使用strings.Builder

从Go 1.10(2018)版本开始可以使用[ strings.Builder](https://golang.google.cn/pkg/strings/#Builder),
> A Builder is used to efficiently build a string using Write methods. It minimizes memory copying.
> The zero value is ready to use. Do not copy a non-zero Builder.

`strings.Builder` 使用 `Write` 方法来高效的构造字符串. 它使用内存最小,它使用零值,它不拷贝零值.
注意:***不要拷贝strings.Builder的值,如果您要使用strings.Builder值请使用pointer***
使用方法,代码如下:

```go
package main

import (
    "strings"
    "fmt"
)

func main() {
    var str strings.Builder

    for i := 0; i < 1000; i++ {
        str.WriteString("a")
    }

    fmt.Println(str.String())
}
```

## 2. 方法二:使用bytes.Buffer

在201X年之前使用`bytes`包的`Buffer`它实现了`io.Writer`的接口,使用他来拼接字符串.他的事件复杂度`O(n)`.

```go
package main

import (
    "bytes"
    "fmt"
)

func main() {
    var buffer bytes.Buffer

    for i := 0; i < 1000; i++ {
        buffer.WriteString("a")
    }

    fmt.Println(buffer.String())
}
```

## 3. 方法三:使用go语言内置函数copy

Go内建函数copy:`func copy(dst, src []Type) int`,
用于将源slice的数据（第二个参数）,复制到目标slice（第一个参数）.
返回值为拷贝了的数据个数,是len(dst)和len(src)中的最小值.

```go
package main

import (
    "bytes"
    "fmt"
)

func main() {
    bs := make([]byte, 1000)
    bl := 0
   for n := 0; n < 1000; n++ {
        bl += copy(bs[bl:], "a")
    }
    fmt.Println(string(bs))
}
```

## 4. 方法四:使用go语言内置函数append

append主要用于给某个切片（slice）追加元素,
如果该切片存储空间（cap）足够,就直接追加,长度（len）变长;如果空间不足,就会重新开辟内存,并将之前的元素和新的元素一同拷贝进去,
第一个参数为切片,后面是该切片存储元素类型的可变参数,

```go
package main

import (
    "bytes"
    "fmt"
)

func main() {
    bs := make([]byte, 1000)
   for n := 0; n < 1000; n++ {
        bs = append(bs,'a')
    }
    fmt.Println(string(bs))
}
```

## 5. 方法五: 使用字符串+运算

```go
package main

import (
    "fmt"
)

func main() {
    var result string

    for i := 0; i < 1000; i++ {
            result += "a"
    }

    fmt.Println(result)
}


``` 

## 6. 方法六: strings.Repeat

strings.Repeat 将 count 个字符串 s 连接成一个新的字符串

```go
package main

import (
	"fmt"
	"strings"
)

func main()  {
	fmt.Println(strings.Repeat("x",1000))
}

```

***strings.Repeat它的底层调用的是strings.Builder,提前分配了内存.***

```go
// Repeat returns a new string consisting of count copies of the string s.
//
// It panics if count is negative or if
// the result of (len(s) * count) overflows.
func Repeat(s string, count int) string {
	if count == 0 {
		return ""
	}

	// Since we cannot return an error on overflow,
	// we should panic if the repeat will generate
	// an overflow.
	// See Issue golang.org/issue/16237
	if count < 0 {
		panic("strings: negative Repeat count")
	} else if len(s)*count/count != len(s) {
		panic("strings: Repeat count causes overflow")
	}

	n := len(s) * count
	var b Builder
	b.Grow(n)
	b.WriteString(s)
	for b.Len() < n {
		if b.Len() <= n/2 {
			b.WriteString(b.String())
		} else {
			b.WriteString(b.String()[:n-b.Len()])
			break
		}
	}
	return b.String()
}
```

## 7. Benchmark

[string_benchmark.go](/tutorials/strings_test.go)

```go
package main

import (
	"bytes"
	"strings"
	"testing"
)

const (
	sss = "https://mojotv.cn"
	cnt = 10000
)

var (
	bbb      = []byte(sss)
	expected = strings.Repeat(sss, cnt)
)
//使用 提前初始化  内置 copy函数
func BenchmarkCopyPreAllocate(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		bs := make([]byte, cnt*len(sss))
		bl := 0
		for i := 0; i < cnt; i++ {
			bl += copy(bs[bl:], sss)
		}
		result = string(bs)
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}
//使用 提前初始化  内置append 函数
func BenchmarkAppendPreAllocate(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		data := make([]byte, 0, cnt*len(sss))
		for i := 0; i < cnt; i++ {
			data = append(data, sss...)
		}
		result = string(data)
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}
//使用 提前初始化 bytes.Buffer
func BenchmarkBufferPreAllocate(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		buf := bytes.NewBuffer(make([]byte, 0, cnt*len(sss)))
		for i := 0; i < cnt; i++ {
			buf.WriteString(sss)
		}
		result = buf.String()
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}

//使用 strings.Repeat 本质是pre allocate + strings.Builder
func BenchmarkStringRepeat(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		result = strings.Repeat(sss,cnt)
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}
//使用 内置copy
func BenchmarkCopy(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		data := make([]byte, 0, 64) // same size as bootstrap array of bytes.Buffer
		for i := 0; i < cnt; i++ {
			off := len(data)
			if off+len(sss) > cap(data) {
				temp := make([]byte, 2*cap(data)+len(sss))
				copy(temp, data)
				data = temp
			}
			data = data[0 : off+len(sss)]
			copy(data[off:], sss)
		}
		result = string(data)
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}
//使用 内置append
func BenchmarkAppend(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		data := make([]byte, 0, 64)
		for i := 0; i < cnt; i++ {
			data = append(data, sss...)
		}
		result = string(data)
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}
//使用 bytes.Buffer
func BenchmarkBufferWriteBytes(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		var buf bytes.Buffer
		for i := 0; i < cnt; i++ {
			buf.Write(bbb)
		}
		result = buf.String()
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}
//使用 strings.Builder write bytes
func BenchmarkStringBuilderWriteBytes(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		var buf strings.Builder
		for i := 0; i < cnt; i++ {
			buf.Write(bbb)
		}
		result = buf.String()
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}
//使用 string buffer write string
func BenchmarkBufferWriteString(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		var buf bytes.Buffer
		for i := 0; i < cnt; i++ {
			buf.WriteString(sss)
		}
		result = buf.String()
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}


// 使用string 加号
func BenchmarkStringPlusOperator(b *testing.B) {
	var result string
	for n := 0; n < b.N; n++ {
		var str string
		for i := 0; i < cnt; i++ {
			str += sss
		}
		result = str
	}
	b.StopTimer()
	if result != expected {
		b.Errorf("unexpected result; got=%s, want=%s", string(result), expected)
	}
}


```

执行`  go test -bench=. -benchmem ` 输出结果:

```bash
$ go test -bench=. -benchmem
goos: windows
goarch: amd64
BenchmarkCopyPreAllocate-8                 10000            117600 ns/op          344065 B/op          2 allocs/op
BenchmarkAppendPreAllocate-8               20000             75300 ns/op          344065 B/op          2 allocs/op
BenchmarkBufferPreAllocate-8               20000             97149 ns/op          344065 B/op          2 allocs/op
BenchmarkStringRepeat-8                   100000             18349 ns/op          172032 B/op          1 allocs/op
BenchmarkCopy-8                            10000            152417 ns/op          862307 B/op         13 allocs/op
BenchmarkAppend-8                          10000            157210 ns/op         1046405 B/op         23 allocs/op
BenchmarkBufferWriteBytes-8                10000            173207 ns/op          862374 B/op         14 allocs/op
BenchmarkStringBuilderWriteBytes-8         10000            155715 ns/op          874468 B/op         24 allocs/op
BenchmarkBufferWriteString-8               10000            165700 ns/op          862373 B/op         14 allocs/op
BenchmarkStringPlusOperator-8                 20          84450010 ns/op        885204590 B/op     10037 allocs/op
PASS
ok      _/D_/code/tech.mojotv.cn/tutorials      18.797s
```

下面着重解释下说出的结果,看到函数后面的-8了吗？这个表示运行时对应的`GOMAXPROCS`的值.
接着的10000表示运行for循环的次数,也就是调用被测试代码的次数,最后的`174799 ns/op`表示每次需要话费174799纳秒.
`14 allocs/op`表示每次执行分配了32字节内存.

## 8. 结论:

如果合并大量重复的字符串请使用`strings.Repeat`, 如果要合并不同的字符串,且图方便建议使用***string.Builder + Write bytes/string***.

- 1.使用strings.Repeat效率最高,从strings.Repeat源码它是提前分配内存,使用strings.Builder.所以他的效率更高 18379 ns/op,大约是其他的1/10.
- 2.其次使用strings.Buffer 提前分配内存 120803 ns/op
- 3.使用 `+` 连接字符串效率最低 87599885 ns/op
- 4.Buffer Write bytes 和 Buffer Write string 几乎没有差别,因为在Go语言中 string 就是 []byte.
