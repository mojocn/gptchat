---
layout: post
title: Go进阶23:Go指针返回值的劣势(译)
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,Go指针返回值的劣势
description:  Go语言教程,Golang教程,Go指针返回值的劣势,通常情况下我们最好还是function-return-value,大size的struct推荐使用pointer返回
permalink: /go/:title
coverage: golang_pointer.jpg
date: 2019-09-03T12:37:54+08:00
---

作为以为年迈的C语言程序员,我很纠结,function-return-pointer是很正常的事情.但是我认为function-return-pointer是非常糟糕的行为.
***通常情况下我们最好还是function-return-value.***
您们将看到我能够证明在go语言中function-return-value比function-return-pointer更优.
[原文地址bad_go_pointer_returns](https://philpearl.github.io/post/bad_go_pointer_returns/)

## 1. 定义可变大小的结构体

我将定义一个我可以轻松改变大小的结构.结构的内容是一个数组：我可以通过改变数组的大小来改变结构的大小.

```go
const bigStructSize = 10

type bigStruct struct {
	a [bigStructSize]int
}
```

## 2. 定义结构体function-return-value和function-return-pointer

接下来,我将创建一些goroutine来构建此结构的不同容量.一个将它作为return pointer,另一个作为return value.

```go
 func newBigStruct() bigStruct {
	var b bigStruct
	for i := 0; i < bigStructSize; i++ {
		b.a[i] = i
	}
	return b
}

func newBigStructPtr() *bigStruct {
	var b bigStruct
	for i := 0; i < bigStructSize; i++ {
		b.a[i] = i
	}
	return &b
}
```

## 3. 编写Benckmark Test Case

我将编写几个benchmark来衡量get和use这些结构所需的时间.
我将对结构中的值进行简单的计算,因此编译器不会仅仅只优化返回值.

```go
func BenchmarkStructReturnValue(b *testing.B) {
	b.ReportAllocs()

	t := 0
	for i := 0; i < b.N; i++ {
		v := newBigStruct()
		t += v.a[0]
	}
}

func BenchmarkStructReturnPointer(b *testing.B) {
	b.ReportAllocs()

	t := 0
	for i := 0; i < b.N; i++ {
		v := newBigStructPtr()
		t += v.a[0]
	}
}
```

## 4. bigStructSize 10 测试

当bigStructSize设置为10,function-return-value的速度大约比function-return-pointer快两倍.

在使用指针的情况下,必须在堆上分配内存,这将花费大约25ns,然后设置数据（设置值在值返回和指针返回情况下应该花费大约相同的时间）,
然后将指针写入堆栈以返回struct给调用者.

在值的情况下,没有堆内存分配,但必须将整个结构复制到堆栈以将其返回给调用者.

在此size的struct情况下,复制堆栈上的数据的开销小于分配内存的开销.

```go
BenchmarkStructReturnValue-8  	100000000	15.4 ns/op	 0 B/op	0 allocs/op
BenchmarkStructReturnPointer-8	50000000	36.5 ns/op	80 B/op	1 allocs/op
```

## 4. bigStructSize 100 测试

当我们将bigStructSize变为100时,结构现在包含100个整数,ns/op绝对值的差距会增加,尽管指针情况的ns/op百分比增加更少.

```go
BenchmarkStructReturnValue-8  	20000000	105 ns/op	  0 B/op	0 allocs/op
BenchmarkStructReturnPointer-8	10000000	185 ns/op	896 B/op	1 allocs/op
```

## 4. bigStructSize 1000 测试

如果我们在结构中尝试bigStructSize变为1000时,那么返回指针会更快吗？

```go
BenchmarkStructReturnValue-8  	2000000	 830 ns/op	   0 B/op	0 allocs/op
BenchmarkStructReturnPointer-8	1000000	1401 ns/op	8192 B/op	1 allocs/op
```

## 4. bigStructSize 10000 测试

还是更糟糕.10,000又会是怎么样？

```go
BenchmarkStructReturnValue-8  	100000	13332 ns/op	    0 B/op	0 allocs/op
BenchmarkStructReturnPointer-8	200000	11032 ns/op	81920 B/op	1 allocs/op
```

最后,在我们的struct中有10,000个int,返回指针的struct更快.经过一些进一步的调查,我的笔记本电脑上的平衡点似乎是2700.

## 5. Benchmark Profile

我很不清楚为什么1000整数的差异如此之大.让我们看一下benchmark profile！

### 5.1 Benchmark Profile 值返回

```bash
go test -bench BenchmarkStructReturnValue -run ^$ -cpuprofile cpu2.prof
go tool pprof  post.test cpu2.prof 
(pprof) top
Showing nodes accounting for 2.25s, 100% of 2.25s total
      flat  flat%   sum%        cum   cum%
     2.09s 92.89% 92.89%      2.23s 99.11%  github.com/philpearl/blog/content/post.newBigStruct
     0.14s  6.22% 99.11%      0.14s  6.22%  runtime.newstack
     0.02s  0.89%   100%      0.02s  0.89%  runtime.nanotime
         0     0%   100%      2.23s 99.11%  github.com/philpearl/blog/content/post.BenchmarkStructReturnValue
         0     0%   100%      0.02s  0.89%  runtime.mstart
         0     0%   100%      0.02s  0.89%  runtime.mstart1
         0     0%   100%      0.02s  0.89%  runtime.sysmon
         0     0%   100%      2.23s 99.11%  testing.(*B).launch
         0     0%   100%      2.23s 99.11%  testing.(*B).runN
```

在值返回的情况下,几乎所有工作都在newBigStruct中进行.这一切都非常直观.

### 5.1 Benchmark Profile 指针返回

如果我们分析指针测试会怎么样？

```bash
go test -bench BenchmarkStructReturnPointer -run ^$ -cpuprofile cpu.prof
go tool pprof post.test cpu.prof 
(pprof) top
Showing nodes accounting for 2690ms, 93.08% of 2890ms total
Dropped 28 nodes (cum <= 14.45ms)
Showing top 10 nodes out of 67
      flat  flat%   sum%        cum   cum%
    1110ms 38.41% 38.41%     1110ms 38.41%  runtime.pthread_cond_signal
     790ms 27.34% 65.74%      790ms 27.34%  runtime.pthread_cond_wait
     300ms 10.38% 76.12%      300ms 10.38%  runtime.usleep
     200ms  6.92% 83.04%      200ms  6.92%  runtime.pthread_cond_timedwait_relative_np
      80ms  2.77% 85.81%       80ms  2.77%  runtime.nanotime
      60ms  2.08% 87.89%      140ms  4.84%  runtime.sweepone
      50ms  1.73% 89.62%       50ms  1.73%  runtime.pthread_mutex_lock
      40ms  1.38% 91.00%      150ms  5.19%  github.com/philpearl/blog/content/post.newBigStructPtr
      30ms  1.04% 92.04%       40ms  1.38%  runtime.gcMarkDone
      30ms  1.04% 93.08%       40ms  1.38%  runtime.scanobject
```

在指针放回情况下,输出log要复杂得多,而且还有很多function使用了大量的CPU资源.只有约5％的时间花在newBigStructPtr上设置结构.
相反,Go运行时中有大量时间花费在处理线程和锁以及垃圾收集上.返回指针的底层函数很快,但分配指针所带来的包袱是一个巨大的开销.

## 6.结论:通常情况下使用value返回

现在这种情况非常简单.数据被创建然后立即被丢弃,因此垃圾收集器将面临巨大的负担.
如果返回数据的生命周期更长,则结果可能会非常不同.

- ***通常情况下我们最好还是return value***
- ***生命时间短的struct return pointer是不推荐的***
- ***大size的struct推荐使用pointer返回***

相关文章[什么时候使用指针Pointer](https://tech.mojotv.cn/tutorial/pointer)