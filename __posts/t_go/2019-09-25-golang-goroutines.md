---
layout: post
title: Go教程:24 Go协程Goroutines
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,Goroutine,mutex,waitGroup,Atomic
description:  Goroutine是一个简单的模型：它是一个函数,与其他Goroutines并发执行且共享相同地址空间.
coverage: goroutine.jpg
permalink: /:categories/:title
date: 2019-09-25T11:42:54+08:00
---

## 1. 什么是 Go Goroutines?

Goroutine是一个简单的模型：它是一个函数,与其他Goroutines并发执行且共享相同地址空间.
Goroutines的通常用法是根据需要创建尽可能多的Groutines,成百上千甚至上万的.
创建这么多 goroutines势必要付出不菲的代价？
一个操作系统线程使用固定大小的内存作为它的执行栈,
当线程数增多时,线程间切换的代价也是相当的高.
这也是每处理一个request就创建一个新线程的服务程序方案被诟病的原因.

不过Goroutine完全不同.它们由Go运行时初始化并调度,操作系统根本看不到Goroutine的存在.
所有的goroutines都是活着的,并且以多路复用的形式运行于操作系统为应用程序分配的少数几个线程上.
创建一个Goroutine并不需要太多内存,只需要8K的栈空间 (在Go 1.3中这个Size发生了变化).
它们根据需要在堆上分配和释放内存以实现自身的增长.

### 1.1 在Go语言中创建Goroutines

要将函数作为goroutine运行,请调用以go作为为前缀的函数.这是示例代码块：

```go
sum()     // 普通的求和函数同步的调用
go sum()  // Goroutine 异步执行求和函数,不需要等待它执行完毕
```

go 关键字,使函数调用立即返回,而函数在后台启动一个goroutine和程序的其余部分运行继续执行.
每个Golang程序的`main func`都是使用goroutine启动的,因此每个Golang程序至少运行一个goroutine.

## 2.goroutines创建

在每次调用函数 responseSize 之前添加了go关键字.
三个responseSize goroutine程序同时启动,并且同时进行了对http.Get的三次调用.
该程序不会等到一个响应返回后才发出下一个Request.
结果,使用goroutines可以更快地打印出三种response size.

```go
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

func responseSize(url string) {
	fmt.Println("Step1: ", url)
	response, err := http.Get(url)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Step2: ", url)
	defer response.Body.Close()

	fmt.Println("Step3: ", url)
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Step4: ", len(body))
}

func main() {
	go responseSize("https://mojotv.cn")
	go responseSize("https://segmentfault.com/u/mojotech/articles")
	go responseSize("https://www.zhihu.com/people/ericzhou-91/posts")
	time.Sleep(10 * time.Second)
}
```

我们已经在main函数中添加了time.Sleep的函数调用,这可以防止在responseSize goroutine完成之前main goroutine exit.
调用time.Sleep(10 * time.Second)将使main goroutine睡眠10秒钟.

当您运行上述程序时,您可能会看到以下输出：

```bash
GOROOT=C:\Go #gosetup
GOPATH=C:\Users\mojotv\go #gosetup
C:\Go\bin\go.exe build -o C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe C:/mojotv.cn/main.go #gosetup
C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe #gosetup
Step1:  https://mojotv.cn
Step1:  https://www.zhihu.com/people/ericzhou-91/posts
Step1:  https://segmentfault.com/u/mojotech/articles
Step2:  https://mojotv.cn
Step3:  https://mojotv.cn
Step4:  86764
Step2:  https://segmentfault.com/u/mojotech/articles
Step3:  https://segmentfault.com/u/mojotech/articles
Step4:  3803
Step2:  https://www.zhihu.com/people/ericzhou-91/posts
Step3:  https://www.zhihu.com/people/ericzhou-91/posts
Step4:  459636
```

## 3.Goroutine WaitGroup

sync包的WaitGroup类型,用于等待程序从main function 启动的所有goroutine执行完毕.
WaitGroup使用一个指定goroutine数量的计数器,并且Wait阻止程序执行,直到WaitGroup计数器为零.

`ADD`方法用于添加计数器到WaitGroup.
使用defer语句调度WaitGroup 的`Done`方法以减少WaitGroup计数器.
WaitGroup类型的`Wait`方法等待程序完成所有goroutine.

在main func 内部调用Wait方法,该方法将阻止执行,直到WaitGroup计数器的值为零为止,并确保所有goroutine都已执行.

```go
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"sync"
)

// WaitGroup 用来等待程序执行完成全部的goroutine
var wg sync.WaitGroup

func responseSize(url string) {
	// 调用waitGroup的done函数,告知全部goroutine都执行完成
	defer wg.Done()

	fmt.Println("第一步: ", url)
	response, err := http.Get(url)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("第二步: ", url)
	defer response.Body.Close()

	fmt.Println("第三步: ", url)
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("第四步: ", len(body))
}

func main() {
	// 因为有三个goroutine 添加计数3
	wg.Add(3)
	fmt.Println("开始执行Goroutines")

	go responseSize("https://mojotv.cn")
	go responseSize("https://segmentfault.com/u/mojotech/articles")
	go responseSize("https://www.zhihu.com/people/ericzhou-91/posts")

	// 等待goroutine 执行完毕
	wg.Wait()
	fmt.Println("程序执行完毕")
}
```

当您运行上述程序时,您可能会看到以下输出：

```bash
GOROOT=C:\Go #gosetup
GOPATH=C:\Users\mojotv\go #gosetup
C:\Go\bin\go.exe build -o C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe C:/mojotv.cn/main.go #gosetup
C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe #gosetup
开始执行Goroutines
第一步:  https://www.zhihu.com/people/ericzhou-91/posts
第一步:  https://mojotv.cn
第一步:  https://segmentfault.com/u/mojotech/articles
第二步:  https://mojotv.cn
第三步:  https://mojotv.cn
第四步:  86764
第二步:  https://segmentfault.com/u/mojotech/articles
第三步:  https://segmentfault.com/u/mojotech/articles
第四步:  3806
第二步:  https://www.zhihu.com/people/ericzhou-91/posts
第三步:  https://www.zhihu.com/people/ericzhou-91/posts
第四步:  459765
程序执行完毕
```

## 4.Goroutines传值

从goroutine中获取值的最自然的方法是 channel.channel是连接并发goroutine的管道.
您可以将值从一个goroutine发送到channel中,然后将这些值接收到另一个goroutine中或通过同步function接收.

```go
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"sync"
)

// WaitGroup 用来等待程序执行完成全部的goroutine
var wg sync.WaitGroup

func responseSize(url string, nums chan int) {
	// 调用waitGroup的done函数,告知全部goroutine都执行完成
	defer wg.Done()

	response, err := http.Get(url)
	if err != nil {
		log.Fatal(err)
	}
	defer response.Body.Close()
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Fatal(err)
	}
	// 传递值到无缓存channel
	nums <- len(body)
}

func main() {
	nums := make(chan int) // 声明无缓存的channel
	wg.Add(1)
	go responseSize("https://mojotv.cn", nums)
	fmt.Println(<-nums) // Read the value from unbuffered channel
	wg.Wait()
	close(nums) // Closes the channel
}
```

当您运行上述程序时,您可能会看到以下输出：

```bash
GOROOT=C:\Go #gosetup
GOPATH=C:\Users\mojotv\go #gosetup
C:\Go\bin\go.exe build -o C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe C:/mojotv.cn/main.go #gosetup
C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe #gosetup
86764

Process finished with exit code 0
```

## 5.Goroutine暂停和开始

使用通道,我们可以暂停和继续执行goroutine.
Channel通过充当Goroutine之间的管道处理来通信.

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var i int

func work() {
	time.Sleep(250 * time.Millisecond)
	i++
	fmt.Println(i)
}

func routine(command <-chan string, wg *sync.WaitGroup) {
	defer wg.Done()
	var status = "开始"
	for {
		select {
		case cmd := <-command:
			fmt.Println(cmd)
			switch cmd {
			case "Stop":
				return
			case "Pause":
				status = "暂停"
			default:
				status = "开始"
			}
		default:
			if status == "开始" {
				work()
			}
		}
	}
}

func main() {
	var wg sync.WaitGroup
	wg.Add(1)
	command := make(chan string)
	go routine(command, &wg)

	time.Sleep(1 * time.Second)
	command <- "暂停"

	time.Sleep(1 * time.Second)
	command <- "开始"

	time.Sleep(1 * time.Second)
	command <- "停止"

	wg.Wait()
}
```

运行上面的程序时,您可以看到以下输出：

```bash
GOROOT=C:\Go #gosetup
GOPATH=C:\Users\mojotv\go #gosetup
C:\Go\bin\go.exe build -o C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe C:/mojotv.cn/main.go #gosetup
C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe #gosetup
1
2
3
4
暂停
5
6
7
8
开始
9
10
11
12
停止
13
14
Process finished with exit code 2
```

## 6.Goroutine和Atomic

Race Condition中文翻译是竞争条件,是指多个进程或者线程并发访问和操作同一数据且执行结果与访问发生的特定顺序有关的现象.
争用条件是由于对共享资源的不同步访问而引起的,并试图同时读取和写入该资源.

Atomic函数提供了用于同步访问整数和指针的低级锁定机制.原子功能通常用于修复竞争条件.

sync包下的atomic中的函数通过锁定对共享资源的访问来提供支持同步goroutine的支持.

```go

package main

import (
	"fmt"
	"runtime"
	"sync"
	"sync/atomic"
)

var (
	counter int32          // 计数器可以被所有的goroutine ++
	wg      sync.WaitGroup // wg 等待全部goroutine 都执行完毕
)

func main() {
	wg.Add(3) // 设置计数3 为下面三个goroutines

	go increment("Python")
	go increment("Java")
	go increment("Golang")

	wg.Wait() // Wait for the goroutines to finish.
	fmt.Println("计数:", counter)

}

func increment(name string) {
	defer wg.Done() // 任务调度告诉main goroutine 这个goroutine 执行完毕

	for range name {
		atomic.AddInt32(&counter, 1)
		runtime.Gosched() // Gosched生成处理器,允许其他goroutine运行.它不会挂起当前的goroutine,因此执行将自动恢复
	}
}
```

Atomic包中的AddInt32函数通过强制一次只能执行一个goroutine,并完成此加法操作来后同步整数值.
当goroutine尝试调用任何Atomic函数时,它们会自动与所引用的变量同步.

运行上面的程序时,您可以看到以下输出：

```
$ go run -race main.go
计数: 16
```

请注意,如果将代码行`atomic.AddInt32(＆counter,1)`替换为`counter ++`,那么您将看到以下输出：

```
$ go run -race main.go
==================
WARNING: DATA RACE
Read at 0x000000606290 by goroutine 7:
  main.increment()
      C:/mojotv.cn/main.go:32 +0x7a

Previous write at 0x000000606290 by goroutine 6:
  main.increment()
      C:/mojotv.cn/main.go:32 +0x94

Goroutine 7 (running) created at:
  main.main()
      C:/mojotv.cn/main.go:19 +0xa8

Goroutine 6 (finished) created at:
  main.main()
      C:/mojotv.cn/main.go:18 +0x7b
==================
计数: 16
Found 1 data race(s)
exit status 66
```

## 7.Goroutine 和 Mutex

互斥锁是传统的并发程序对共享资源进行访问控制的主要手段.它由标准库代码包sync中的Mutex结构体类型代表.
sync.Mutex类型(确切地说,是*sync.Mutex类型)只有两个公开方法——Lock和Unlock.
顾名思义,前者被用于锁定当前的互斥量,而后者则被用来对当前的互斥量进行解锁.

```go

package main

import (
	"fmt"
	"sync"
)

var (
	counter int32          // 技术器可以被全部goroutine操作.
	wg      sync.WaitGroup // wg 等待全部goroutine 都执行完毕
	mutex   sync.Mutex     // mutex 定义代码关键section
)

func main() {
	wg.Add(3) //

	go increment("mojotv.cn")
	go increment("Eric Zhou")
	go increment("Golang")

	wg.Wait() // Wait for the goroutines to finish.
	fmt.Println("Counter:", counter)

}

func increment(lang string) {
	defer wg.Done() // 调度器告诉main goroutine 此goroutine执行完毕

	for i := 0; i < 3; i++ {
		mutex.Lock()
		{
			fmt.Println(lang)
			counter++
		}
		mutex.Unlock()
	}
}
```

由对Lock()和Unlock()的调用可以防止针对计数器变量的操作.运行上面的程序时,您可以看到以下输出：

```
GOROOT=C:\Go #gosetup
GOPATH=C:\Users\mojotv\go #gosetup
C:\Go\bin\go.exe build -o C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe C:/mojotv.cn/main.go #gosetup
C:\Users\mojotv\Documents\GitHub\awesomeProject\go_build_main_go.exe -race #gosetup
Golang
Golang
Golang
mojotv.cn
mojotv.cn
mojotv.cn
Eric Zhou
Eric Zhou
Eric Zhou
计数器: 9

Process finished with exit code 0
```

