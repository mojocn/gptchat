---
layout: post
title: "Go进阶43:channel使用案例(译)"
category: Golang
tags: Go进阶 
keywords: "golang channel buffer notification select case"
description: "channel使用案例"
coverage: golang_channel_coverage.jpeg
permalink: /go/:title
date: 2020-07-13T17:06:00+08:00
---

在读这篇文章之前,请先阅读 [Golang中的channel](https://go101.org/article/channel.html) 这篇文章,这篇文章会更加具体的介绍Channel的Type和Value. 新入门的Gopher需要阅读之前的文章和这篇文章多次,
以掌握Golang channel编程.

这篇文章将展示多种channel使用的案例.希望本文您掌握:

1. 使用Go Channel 可以轻松愉快的进行异步和并发编程.
2. 与其他一些语言（例如actor模型 和async / await模式）中使用的同步解决方案相比,channel同步技术具有更广泛的用途和更加灵活.

请注意,本文旨在显示尽可能多的channel使用案例. 我们应该知道,
channel并不是Go中支持的唯一并发同步技术,并且在某些情况下,channel可能不是最佳解决方案.请阅读atomic operations 和 其他一些同步技术 ,以获取Go中更多的并发同步技术.

## 1. 把 Channel 当作 Futures/Promises 使用

Future/Promise 被很多其他流行的语言使用. 他们广泛的被使用在网络Requests和Responses.

### 1.1 Receive-only channel

在下面的示例中, `sumSquares`函数的两个参数获取是同时的. 两个channel receive 会阻塞,直到channel send操作执行. 参数获取时间大概需要3s而不是6s.

```go
package main

import (
	"time"
	"math/rand"
	"fmt"
)

func longTimeRequest() <-chan int32 {
	r := make(chan int32)

	go func() {
		// 模拟任务花费时间
		time.Sleep(time.Second * 3)
		r <- rand.Int31n(100)
	}()

	return r
}

func sumSquares(a, b int32) int32 {
	return a*a + b*b
}

func main() {
	rand.Seed(time.Now().UnixNano())
	a, b := longTimeRequest(), longTimeRequest()
	fmt.Println(sumSquares(<-a, <-b))
}
```

### 1.2 Send-only channels

上一个示例相同,`sumSquares`函数的两个参数获取是同时的. 不同的是上一个示例中 `longTimeRequest` 方法 return 一个 receive-only channel,
这示例`longTimeRequest`把 send-only channels 作为参数.

```go
package main

import (
	"time"
	"math/rand"
	"fmt"
)

func longTimeRequest(r chan<- int32)  {
	// 模拟耗时任务
	time.Sleep(time.Second * 3)
	r <- rand.Int31n(100)
}

func sumSquares(a, b int32) int32 {
	return a*a + b*b
}

func main() {
	rand.Seed(time.Now().UnixNano())

	ra, rb := make(chan int32), make(chan int32)
	go longTimeRequest(ra)
	go longTimeRequest(rb)

	fmt.Println(sumSquares(<-ra, <-rb))
}
```

实际上我们不需要2个channels来传输结果.使用一个channel也是可以的.

```go
...
	// 可以是缓冲channel 也可以不是
	results := make(chan int32, 2)
	go longTimeRequest(results)
	go longTimeRequest(results)

	fmt.Println(sumSquares(<-results, <-results))
}
```

这个数据聚合,下面将专门介绍

### 1.3 第一个响应获胜(the first response wins)

这是上一个示例中仅使用一个channel变量的增强.
有时,可以从多个来source接收一条数据,以避免高延迟.
在许多因素的影响下,这些来source的响应花费的时间可能相差很大.
即使对于特定的source,其响应持续时间也不是恒定的.
为了使响应时间尽可能短,我们可以在单独的goroutine中向每个source发送请求.仅第一个响应结构被使用,其他较慢的响应结果将被丢弃.
注意,如果有N个源,则通信channel的capicity必须至少为N-1,避免丢弃的结果永远阻塞goroutine.

```go
package main

import (
	"fmt"
	"time"
	"math/rand"
)

func source(c chan<- int32) {
	ra, rb := rand.Int31(), rand.Intn(3) + 1
	// Sleep 1s/2s/3s.
	time.Sleep(time.Duration(rb) * time.Second)
	c <- ra
}

func main() {
	rand.Seed(time.Now().UnixNano())

	startTime := time.Now()
	// c must be a buffered channel.
	c := make(chan int32, 5)
	for i := 0; i < cap(c); i++ {
		go source(c)
	}
	// Only the first response will be used.
	rnd := <- c
	fmt.Println(time.Since(startTime))
	fmt.Println(rnd)
}
```

还有其他一些方法,可以通过使用 `select` 和 one-capacity-bufferd channel来实现.其他方式将在下面介绍.

### 1.4更多请求-响应变体

可以对参数和结果channel进行缓冲,以便响应端无需wait请求端取出传输的值.

有时,不能保证请求会被返回有效值.由于各种原因,可能会返回错误.对于这种情况,我们可以使用类似struct的类型 `struct{v T; err error}`或 空白接口类型作为channel元素类型.

有时,由于某些原因,响应可能需要比预期到达更长的时间,或者永远不会到达.我们可以使用下面介绍的超时机制来处理这种情况.

有时,可能会从响应端返回一系列值,这是下面稍后提到的一种数据流机制.

## 2. 使用Channel进行通知

通知可以被视为特殊请求/响应,其中响应的值并不重要.
通常,我们将空白结构类型`struct{}` 用作通知channel的元素类型,因为类型的大小struct{}为零,因此的值`struct{}`不会消耗内存.

### 2.1 通过向channel发送值进行一对一通知

如果没有要从channel接收的值,则该channel上的下一个接收操作将阻塞,直到另一个goroutine将值发送到该channel.
因此,我们可以将值发送到channel,以通知另一个正在等待从同一channel接收值的goroutine.

在以下示例中,该channel done 用作执行通知的signal channel.

```go
package main

import (
	"crypto/rand"
	"fmt"
	"os"
	"sort"
)

func main() {
	values := make([]byte, 32 * 1024 * 1024)
	if _, err := rand.Read(values); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	done := make(chan struct{}) // 可以是缓存channel 也可以不是

	// goroutine 排序
	go func() {
		sort.Slice(values, func(i, j int) bool {
			return values[i] < values[j]
		})
		// Notify sorting is done.
		done <- struct{}{}
	}()

	// do some other things ...

	<- done // waiting here for notification
	fmt.Println(values[0], values[len(values)-1])
}
```

### 2.2 通过从channel接收值进行一对一通知

如果channel的值缓冲区队列已满（未缓冲channel的缓冲区队列始终已满）,则该channel上的发送操作将阻塞,直到另一个goroutine从该channel接收到值为止.
因此,我们可以从一个channel接收一个值,以通知另一个正在等待将值发送到同一channel的goroutine.通常,该channel应为无缓冲channel.

与上一个示例中介绍的方式相比,使用这种通知方式的方式要少得多.

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	done := make(chan struct{})
		// The capacity of the signal channel can
		// also be one. If this is true, then a
		// value must be sent to the channel before
		// creating the following goroutine.

	go func() {
		fmt.Print("Hello")
		// Simulate a workload.
		time.Sleep(time.Second * 2)

		// Receive a value from the done
		// channel, to unblock the second
		// send in main goroutine.
		<- done
	}()

	// Blocked here, wait for a notification.
	done <- struct{}{}
	fmt.Println(" world!")
}
```

实际上,channel接收或发送值以进行通知之间没有根本区别.当速度较慢的人通知速度较快的人时,可以将它们都概括.

### 2.3 N对1和1对N通知

通过稍微扩展上述两个用例,很容易进行N对1和1对N通知.

```go
package main

import "log"
import "time"

type T = struct{}

func worker(id int, ready <-chan T, done chan<- T) {
	<-ready // block here and wait a notification
	log.Print("Worker#", id, " starts.")
	// Simulate a workload.
	time.Sleep(time.Second * time.Duration(id+1))
	log.Print("Worker#", id, " job done.")
	// Notify the main goroutine (N-to-1),
	done <- T{}
}

func main() {
	log.SetFlags(0)

	ready, done := make(chan T), make(chan T)
	go worker(0, ready, done)
	go worker(1, ready, done)
	go worker(2, ready, done)

	// Simulate an initialization phase.
	time.Sleep(time.Second * 3 / 2)
	// 1-to-N notifications.
	ready <- T{}; ready <- T{}; ready <- T{}
	// Being N-to-1 notified.
	<-done; <-done; <-done
}
```

实际上,在本小节中介绍的进行1-to-N和N-to-1通知的方法在实践中并不常用.
在实践中,我们经常使用 `sync.WaitGroup` N对1的通知,而我们通过封闭渠道进行1对N的通知.请阅读下一部分以了解详细信息.

#### 通过close channel 广播（1-To-N）通知

上一小节显示的进行1-to-N通知的方法实际上很少使用,因为有更好的方法.通过利用可以从close channel 接收到无限值的功能,我们可以close channel以广播通知.

通过最后一个小节中的示例,我们可以`ready <- struct{}{}`用一个channel关闭操作替换上一个示例中的三个channel发送操作 ,close(ready) 以进行1-to-N通知.

```go
...
	close(ready) // broadcast notifications
...
```

当然,我们也可以close channel 以进行一对一通知.实际上,这是Go中最常用的通知方式.

可以从close channel 接收无限值的功能将在下面介绍的许多其他用例中使用.

### 2.4 计时器：预定通知

使用channel来实现一次性计时器很容易.自定义的一次性计时器实现：

```go
package main

import (
	"fmt"
	"time"
)

func AfterDuration(d time.Duration) <- chan struct{} {
	c := make(chan struct{}, 1)
	go func() {
		time.Sleep(d)
		c <- struct{}{}
	}()
	return c
}

func main() {
	fmt.Println("Hi!")
	<- AfterDuration(time.Second)
	fmt.Println("Hello!")
	<- AfterDuration(time.Second)
	fmt.Println("Bye!")
}
```

事实上,After在功能time标准库提供相同的功能,具有更高效的实现.我们应该改用那个函数使代码看起来干净.

请注意,`<-time.After(aDuration)`将使当前goroutine进入阻塞状态,但不会使`time.Sleep(aDuration)`函数调用.

使用`<-time.After(aDuration)`通常用在下面将要引入的超时机制使用.

## 3.channel用作互斥锁

上面的示例之一已提到one-capacity-buffered channel可以用作互斥锁.
实际上,尽管此类互斥锁的效率不如`sync`标准软件包中提供的互斥锁,但此类channel也可用作多时间二进制信号量（也称为互斥锁）.

使用one-capacity-buffered channel作为互斥锁有两种方式.

- 通过发送锁定,通过接收锁定.
- 通过接收锁定,通过发送解锁.
  以下是锁定发送示例.

```go
package main

import "fmt"

func main() {
	// The capacity must be one.
	mutex := make(chan struct{}, 1)

	counter := 0
	increase := func() {
		mutex <- struct{}{} // lock
		counter++
		<-mutex // unlock
	}

	increase1000 := func(done chan<- struct{}) {
		for i := 0; i < 1000; i++ {
			increase()
		}
		done <- struct{}{}
	}

	done := make(chan struct{})
	go increase1000(done)
	go increase1000(done)
	<-done; <-done
	fmt.Println(counter) // 2000
}
```

下面是一个通过接收锁定的示例.它只是显示了基于上述“锁定发送”示例的修改部分.

```go
...
func main() {
	mutex := make(chan struct{}, 1)
	mutex <- struct{}{} // this line is needed.

	counter := 0
	increase := func() {
		<-mutex // lock
		counter++
		mutex <- struct{}{} // unlock
	}
...
```

## 4.Channel 用作计数信号量

Buffered Channel 可用作 计数信号量.
计数信号量可以看作是multi-owner locks.如果channel的容量为N,则可以将其视为可以同时最多拥有N所有者的锁.
二进制信号量（互斥体）是特殊的计数信号量,每个二进制信号量在任何时候最多可以拥有一个所有者.

计数信号量通常用于强制执行最大数量的并发请求.

就像使用channel作为互斥锁一样,也有两种方式来获取channel信号量的所有权.
通过发送获取所有权,通过接收释放.
通过接收获取所有权,通过发送释放.
通过从渠道接收价值来获取所有权的示例.

```go
package main

import (
	"log"
	"time"
	"math/rand"
)

type Seat int
type Bar chan Seat

func (bar Bar) ServeCustomer(c int) {
	log.Print("customer#", c, " enters the bar")
	seat := <- bar // need a seat to drink
	log.Print("++ customer#", c, " drinks at seat#", seat)
	time.Sleep(time.Second * time.Duration(2 + rand.Intn(6)))
	log.Print("-- customer#", c, " frees seat#", seat)
	bar <- seat // free seat and leave the bar
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// the bar has 10 seats.
	bar24x7 := make(Bar, 10)
	// Place seats in an bar.
	for seatId := 0; seatId < cap(bar24x7); seatId++ {
		// None of the sends will block.
		bar24x7 <- Seat(seatId)
	}

	for customerId := 0; ; customerId++ {
		time.Sleep(time.Second)
		go bar24x7.ServeCustomer(customerId)
	}

	// sleeping != blocking
	for {time.Sleep(time.Second)}
}
```

在上面的示例中,只有每个都有座位的顾客才能喝酒.因此,在任何给定时间,将有多达十个顾客在喝酒.

函数中的最后一个for循环main是避免程序退出.有一种更好的方法可以完成这项工作,下面将介绍.

在上面的示例中,尽管在任何给定时间将有最多十个顾客在喝酒,但酒吧可能同时服务十个以上顾客.一些客户正在等待免费座位.
尽管每个客户goroutine消耗的资源比系统线程少得多,但是大量goroutine消耗的总资源却不可忽略.因此,最好仅在有空位的情况下创建客户goroutine.

```go
... // same code as the above example
func (bar Bar) ServeCustomerAtSeat(c int, seat Seat) {
	log.Print("customer#", c, " drinks at seat#", seat)
	time.Sleep(time.Second * time.Duration(2 + rand.Intn(6)))
	log.Print("<- customer#", c, " frees seat#", seat)
	bar <- seat // free seat and leave the bar
}

func main() {
	rand.Seed(time.Now().UnixNano())

	bar24x7 := make(Bar, 10)
	for seatId := 0; seatId < cap(bar24x7); seatId++ {
		bar24x7 <- Seat(seatId)
	}

	for customerId := 0; ; customerId++ {
		time.Sleep(time.Second)
		// Need a seat to serve next customer.
		seat := <- bar24x7
		go bar24x7.ServeCustomerAtSeat(customerId, seat)
	}
	for {time.Sleep(time.Second)}
}
```

在上述优化版本中,最多将同时存在十个实时客户goroutine.

通过发送获取所有权的方式相对来说比较简单.没有放置座位的步骤.

```go
package main

import (
	"log"
	"time"
	"math/rand"
)

type Customer struct{id int}
type Bar chan Customer

func (bar Bar) ServeCustomer(c Customer) {
	log.Print("++ customer#", c.id, " starts drinking")
	time.Sleep(time.Second * time.Duration(3 + rand.Intn(16)))
	log.Print("-- customer#", c.id, " leaves the bar")
	<- bar // leaves the bar and save a space
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// The bar can serve most 10 customers
	// at the same time.
	bar24x7 := make(Bar, 10)
	for customerId := 0; ; customerId++ {
		time.Sleep(time.Second * 2)
		customer := Customer{customerId}
		// Wait to enter the bar.
		bar24x7 <- customer
		go bar24x7.ServeCustomer(customer)
	}
	for {time.Sleep(time.Second)}
}
```

## 5.对话 (Ping-Pong)

两个goroutine可以通过一个channel进行对话.以下是将打印一系列斐波那契数字的示例.

```go
package main

import "fmt"
import "time"
import "os"

type Ball uint64

func Play(playerName string, table chan Ball) {
	var lastValue Ball = 1
	for {
		ball := <- table // get the ball
		fmt.Println(playerName, ball)
		ball += lastValue
		if ball < lastValue { // overflow
			os.Exit(0)
		}
		lastValue = ball
		table <- ball // bat back the ball
		time.Sleep(time.Second)
	}
}

func main() {
	table := make(chan Ball)
	go func() {
		table <- 1 // throw ball on table
	}()
	go Play("A:", table)
	Play("B:", table)
}

```

## 6.channel封装在Channel中

有时,我们可以将一个channel类型用作另一个channel类型的元素类型.
在以下示例中,`chan chan<- int`是channel类型,元素类型是仅发送`channel`类型`chan<- int`.

```go
package main

import "fmt"

var counter = func (n int) chan<- chan<- int {
	requests := make(chan chan<- int)
	go func() {
		for request := range requests {
			if request == nil {
				n++ // increase
			} else {
				request <- n // take out
			}
		}
	}()

	// Implicitly converted to chan<- (chan<- int)
	return requests
}(0)

func main() {
	increase1000 := func(done chan<- struct{}) {
		for i := 0; i < 1000; i++ {
			counter <- nil
		}
		done <- struct{}{}
	}

	done := make(chan struct{})
	go increase1000(done)
	go increase1000(done)
	<-done; <-done

	request := make(chan int, 1)
	counter <- request
	fmt.Println(<-request) // 2000
    // print 2000
}
```

尽管对于上面指定的示例,此处的封装实现可能不是最有效的方法,但用例对于某些其他情况可能是有用的.

## 7.检查channel的长度和容量

我们可以使用内置函数 `len` 和 `cap` 检查channel的长度和容量.
但是,我们很少在实践中这样做.我们很少使用该len函数检查channel长度的原因是该len函数调用返回后channel的长度可能已更改 .
我们很少使用该cap功能检查channel容量的原因是channel的容量通常是已知的或不重要的.

但是,在某些情况下,我们需要使用这两个功能.例如,有时候,我们想接收所有在非close channel中缓冲的值c,
没有一个channel将不再向其发送值,那么我们可以使用以下代码接收剩余值.

```go
// Assume the current goroutine is the only
// goroutine tries to receive values from
// the channel c at present.
for len(c) > 0 {
	value := <-c
	// use value ...
}
```

我们还可以使用下面介绍的try-receive机制来完成相同的工作.两种方法的效率几乎相同.
try-receive机制的优点是,当前的goroutine不需要成为唯一的接收goroutine.

有时,goroutine可能希望将一些值写入buffered channel, c直到它已满,而没有在最后进入阻塞状态,并且goroutine是channel的唯一发送方,
那么我们可以使用以下代码来完成此工作.

```go
for len(c) < cap(c) {
	c <- aValue
}
```

当然,我们还可以使用下面介绍的try-send机制来完成相同的工作.

## 8.永远阻塞当前的Goroutine

select机制是Go中的独特功能.它为并发编程带来了许多模式和技巧.
关于select机制的代码执行规则,请阅读Go中的文章频道.

我们可以使用一个空白的选择块`select{}` 来永远阻止当前的goroutine.这是选择机制的最简单用例.
实际上,`for {time.Sleep(time.Second)}` 上述示例中的某些用法可以替换为`select{}`.

通常,`select{}`用于防止主goroutine退出,因为如果主goroutine退出,则整个程序也会退出.

一个例子：

```go
package main

import "runtime"

func DoSomething() {
	for {
		// do something ...

		runtime.Gosched() // avoid being greedy
	}
}

func main() {
	go DoSomething()
	go DoSomething()
	select{}
}
```

顺便说一下,还有其他一些方法 可以使goroutine永远保持在阻塞状态.但是select{}方法是最简单的.

## 9.尝试发送和尝试接收

select{} default分支且仅一个case分支称为一个try-send或try-receive channel的操作,这取决于以下的channel 操作 case keyword是channel
发送或接收操作.
如果case关键字后面的操作是send-action,则将该select块称为尝试send操作.如果发送操作将阻塞,则default分支将被执行（发送失败）,否则,发送将成功,并且唯一的case分支将被执行.
如果case关键字后面的操作是receive-action,则将该select块称为try-receive操作.如果接收操作将阻塞,则default分支将被执行（接收失败）,否则,接收成功且唯一的case分支将被执行.
try-send 和 try-receive 操作永远不会阻塞.

标准的Go编译器对try-send和try-receive选择块进行了特殊的优化,它们的执行效率比多案例选择块要高得多.

以下是显示尝试发送和尝试接收工作方式的示例.

```go
package main

import "fmt"

func main() {
	type Book struct{id int}
	bookshelf := make(chan Book, 3)

	for i := 0; i < cap(bookshelf) * 2; i++ {
		select {
		case bookshelf <- Book{id: i}:
			fmt.Println("succeeded to put book", i)
		default:
			fmt.Println("failed to put book")
		}
	}

	for i := 0; i < cap(bookshelf) * 2; i++ {
		select {
		case book := <-bookshelf:
			fmt.Println("succeeded to get book", book.id)
		default:
			fmt.Println("failed to get book")
		}
	}
}
```

上面程序的输出：

```bash
succeed to put book 0
succeed to put book 1
succeed to put book 2
failed to put book
failed to put book
failed to put book
succeed to get book 0
succeed to get book 1
succeed to get book 2
failed to get book
failed to get book
failed to get book
```

以下小节将显示更多的尝试发送和尝试接收用例.

### 9.1检查channel是否关闭而不阻塞当前goroutine

假设可以保证没有值被send到channel,我们可以使用以下代码（同时安全地）检查channel是否已经关闭,而不会阻塞当前的goroutine,
其中T元素类型对应的channel类型

```go
func IsClosed(c chan T) bool {
	select {
	case <-c:
		return true
	default:
	}
	return false
}
```

Go并发编程中普遍使用检查channel是否关闭的方法来检查通知是否到达.通知将通过在另一个goroutine中关闭channel来发送.

### 9.2峰值/突发限制

我们可以通过组合使用channel来计数信号量和尝试发送/尝试接收来实现峰值限制.峰值限制（或突发限制）通常用于限制并发请求的数量而不会阻塞任何请求.

以下是“ 将channel用作计数信号量”部分中最后一个示例的修改版本 .

```go
...
	// Can serve most 10 customers at the same time
	bar24x7 := make(Bar, 10)
	for customerId := 0; ; customerId++ {
		time.Sleep(time.Second)
		customer := Consumer{customerId}
		select {
		case bar24x7 <- customer: // try to enter the bar
			go bar24x7.ServeConsumer(customer)
		default:
			log.Print("customer#", customerId, " goes elsewhere")
		}
	}
...
```

### 9.3实现first response wins的用例的另一种方法

如上所述,我们可以将选择机制（尝试发送）与容量为一个（至少）一个缓冲channel的缓冲channel一起使用,以实现“第一响应获胜”用例.例如,

```go
package main

import (
	"fmt"
	"math/rand"
	"time"
)

func source(c chan<- int32) {
	ra, rb := rand.Int31(), rand.Intn(3)+1
	// Sleep 1s, 2s or 3s.
	time.Sleep(time.Duration(rb) * time.Second)
	select {
	case c <- ra:
	default:
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// The capacity should be at least 1.
	c := make(chan int32, 1)
	for i := 0; i < 5; i++ {
		go source(c)
	}
	rnd := <-c // only the first response is used
	fmt.Println(rnd)
}
```

请注意,上例中使用的channel容量必须至少为一个,以便在接收方/请求方未及时准备好时不会错过第一次发送.

### 9.4实现 first response wins 用例的第三种方法

对于先赢的用例,如果源数量少（例如,两个或三个）,则可以使用select代码块同时接收源响应.例如,

```go
package main

import (
	"fmt"
	"math/rand"
	"time"
)

func source() <-chan int32 {
	// c must be a buffered channel.
	c := make(chan int32, 1)
	go func() {
		ra, rb := rand.Int31(), rand.Intn(3)+1
		time.Sleep(time.Duration(rb) * time.Second)
		c <- ra
	}()
	return c
}

func main() {
	rand.Seed(time.Now().UnixNano())

	var rnd int32
	// Blocking here until one source responses.
	select{
	case rnd = <-source():
	case rnd = <-source():
	case rnd = <-source():
	}
	fmt.Println(rnd)
}
```

注意：如果以上示例中使用的channel是未缓冲的channel,则在执行select 代码块后,将永远挂有两个goroutines .这是内存泄漏的情况.

当前小节和最后小节介绍的两种方法也可以用于进行N对1通知.

### 9.5超时Timeout

在某些请求响应方案中,由于各种原因,请求可能需要很长时间才能响应,有时甚至永远都不会响应.对于这种情况,
我们应该使用超时解决方案将错误消息返回给客户端.这样的超时解决方案可以通过`select{}`来实现.

以下代码显示了如何发出超时请求.

```go
func requestWithTimeout(timeout time.Duration) (int, error) {
	c := make(chan int)
	// May need a long time to get the response.
	go doRequest(c)

	select {
	case data := <-c:
		return data, nil
	case <-time.After(timeout):
		return 0, errors.New("timeout")
	}
}
```

### 9.6Ticker

我们可以使用try-send机制实现ticker.

```go
package main

import "fmt"
import "time"

func Tick(d time.Duration) <-chan struct{} {
	// The capacity of c is best set as one.
	c := make(chan struct{}, 1)
	go func() {
		for {
			time.Sleep(d)
			select {
			case c <- struct{}{}:
			default:
			}
		}
	}()
	return c
}

func main() {
	t := time.Now()
	for range Tick(time.Second) {
		fmt.Println(time.Since(t))
	}
}
```

实际上,Tick在time 标准包中有一个功能提供了相同的功能,具有更加高效的实现.我们应该改用该函数来使代码看起来干净并高效地运行.

### 9.7限速

以上部分之一显示了如何使用try-send进行峰值限制.我们还可以使用try-send来进行速率限制（借助于自动报价器）.
在实践中,限制速率通常是为了避免配额过多和资源枯竭.

下面显示了从官方Go Wiki借用的此类示例 .在此示例中,在任何一分钟的持续时间内处理的请求数将不超过200.

```go
package main

import "fmt"
import "time"

type Request interface{}
func handle(r Request) {fmt.Println(r.(int))}

const RateLimitPeriod = time.Minute
const RateLimit = 200 // most 200 requests in one minute

func handleRequests(requests <-chan Request) {
	quotas := make(chan time.Time, RateLimit)

	go func() {
		tick := time.NewTicker(RateLimitPeriod / RateLimit)
		defer tick.Stop()
		for t := range tick.C {
			select {
			case quotas <- t:
			default:
			}
		}
	}()

	for r := range requests {
		<-quotas
		go handle(r)
	}
}

func main() {
	requests := make(chan Request)
	go handleRequests(requests)
	// time.Sleep(time.Minute)
	for i := 0; ; i++ {requests <- i}
}
```

实际上,我们经常将速率限制和峰值/突发限制一起使用.

### 9.8Switches

从Go中的文章渠道中,我们了解到向nil channel发送值或从nil channel接收值都是阻塞操作.
利用这一事实,我们可以更改代码块case操作中涉及的channel,select以影响代码块中的分支选择select.

以下是使用选择机制实现的另一个乒乓示例.在此示例中,select块中涉及的两个channel变量之一是nil.
在case相应的零channel分支将不会选择肯定.我们可以认为此类case分支机构处于关闭状态.
在每个循环步骤结束时,将case切换两个分支的开/关状态.

```go
package main

import "fmt"
import "time"
import "os"

type Ball uint8
func Play(playerName string, table chan Ball, serve bool) {
	var receive, send chan Ball
	if serve {
		receive, send = nil, table
	} else {
		receive, send = table, nil
	}
	var lastValue Ball = 1
	for {
		select {
		case send <- lastValue:
		case value := <- receive:
			fmt.Println(playerName, value)
			value += lastValue
			if value < lastValue { // overflow
				os.Exit(0)
			}
			lastValue = value
		}
		// Switch on/off.
		receive, send = send, receive
		time.Sleep(time.Second)
	}
}

func main() {
	table := make(chan Ball)
	go Play("A:", table, false)
	Play("B:", table, true)
}
```

以下是另一个（非并行）示例,它更简单并且还降低了切换效果.1212...运行时将打印此示例.在实践中它没有太大用处.此处显示的目的只是为了学习.

```go
package main

import "fmt"
import "time"

func main() {
	for c := make(chan struct{}, 1); true; {
		select {
		case c <- struct{}{}:
			fmt.Print("1")
		case <-c:
			fmt.Print("2")
		}
		time.Sleep(time.Second)
	}
}
```

### 9.9控制代码执行可能性权重

我们可以case在select代码块中复制一个分支,以增加相应代码的执行可能性.

```go
package main

import "fmt"

func main() {
	foo, bar := make(chan struct{}), make(chan struct{})
	close(foo); close(bar) // for demo purpose
	x, y := 0.0, 0.0
	f := func(){x++}
	g := func(){y++}
	for i := 0; i < 100000; i++ {
		select {
		case <-foo: f()
		case <-foo: f()
		case <-bar: g()
		}
	}
	fmt.Println(x/y) // about 2
}
```

该f函数被调用的可能性约为该g函数的两倍.

### 9.10从动态案例数中选择

尽管select块中的分支数量是固定的,但是我们可以使用reflect 标准包中提供的功能在运行时构造一个select{}.
动态创建的select{}可以具有任意数量的案例分支.但是请注意,反射方式比固定方式效率低.

的reflect标准包还提供 TrySend和TryRecv功能来实现一个情况加默认选择块.

## 10.数据流操作

本节将通过使用channel介绍一些数据流操纵用例.

通常,数据流应用程序包含许多模块.不同的模块执行不同的工作.每个模块可能拥有一个或多个工作程序（goroutine）,
它们同时执行为该模块指定的相同工作.这是实践中一些模块作业示例的列表：
数据生成/收集/加载.
数据提供/保存.
数据计算/分析.
数据验证/过滤.
数据汇总/划分
数据组成/分解.
数据重复/扩散.
模块中的工作人员可以从其他几个模块接收数据作为输入,
并发送数据以将其他模块用作输出.换句话说,模块既可以是数据使用者,也可以是数据产生者.
仅将数据发送到其他模块但从其他模块不接收数据的模块称为仅生产者模块.仅从其他一些模块接收数据但从不向其他模块发送数据的模块称为仅用户模块.

许多模块共同构成一个数据流系统.

下面将显示一些数据流模块工作程序的实现.这些实现是出于解释目的,因此它们非常简单并且效率不高.

数据生成/收集/加载
有各种各样的仅生产者模块.仅限生产者的模块工作者可以产生数据流
通过加载文件,读取数据库或爬网.
通过从软件系统或各种硬件收集各种指标.
通过生成随机数.
等等
在这里,我们以一个随机数生成器为例.生成器函数返回一个结果,但不接受任何参数.

```go
import (
	"crypto/rand"
	"encoding/binary"
)

func RandomGenerator() <-chan uint64 {
	c := make(chan uint64)
	go func() {
		rnds := make([]byte, 8)
		for {
			_, err := rand.Read(rnds)
			if err != nil {
				close(c)
				break
			}
			c <- binary.BigEndian.Uint64(rnds)
		}
	}()
	return c
}
```

实际上,随机数生成器是一个multiply future/promise

数据生产者可以随时关闭输出流channel以结束数据生成.

### 10.1资料汇整

数据聚合模块工作程序将相同数据类型的多个数据流聚合为一个流.假设数据类型为int64,则以下函数将任意数量的数据流聚合为一个.

```go
func Aggregator(inputs ...<-chan uint64) <-chan uint64 {
	out := make(chan uint64)
	for _, in := range inputs {
		in := in // this line is essential
		go func() {
			for {
				out <- <-in // <=> out <- (<-in)
			}
		}()
	}
	return out
}
```

更好的实现应考虑输入流是否已关闭.（对于以下其他模块工作程序实现也有效.）

```go
func Aggregator(inputs ...<-chan uint64) <-chan uint64 {
	output := make(chan uint64)
	var wg sync.WaitGroup
	for _, in := range inputs {
		wg.Add(1)
		in := in // this line is essential
		go func() {
			for {
				x, ok := <-in
				if ok {
					output <- x
				} else {
					wg.Done()
				}
			}
		}()
	}
	go func() {
		wg.Wait()
		close(output)
	}()
	return output
}
```

如果聚合数据流的数量很少（两个或三个）,则可以使用select块来聚合这些数据流.

```go
// Assume the number of input stream is two.
...
	output := make(chan uint64)
	go func() {
		inA, inB := inputs[0], inputs[1]
		for {
			select {
			case v := <- inA: output <- v
			case v := <- inB: output <- v
			}
		}
	}
...
```

### 10.2 资料分割

数据划分模块工作程序的作用与数据聚合模块工作程序的相反.实施部门工作人员很容易,但是实际上,部门工作人员不是很有用,很少使用.

```go
func Divisor(input <-chan uint64, outputs ...chan<- uint64) {
	for _, out := range outputs {
		out := out // this line is essential
		go func() {
			for {
				out <- <-input // <=> out <- (<-input)
			}
		}()
	}
}
```

### 10.3数据构成

数据合成工作人员将来自不同输入数据流的几条数据合并为一条数据.

以下是组合工作程序示例,其中uint64 一个流中的两个值和uint64另一个流中的一个值组成一个新uint64值.当然,实际上,这些流channel元素类型通常是不同的.

```go
func Composer(inA, inB <-chan uint64) <-chan uint64 {
	output := make(chan uint64)
	go func() {
		for {
			a1, b, a2 := <-inA, <-inB, <-inA
			output <- a1 ^ b & a2
		}
	}()
	return output
}
```

### 10.4 数据分解

数据分解是数据合成的逆过程.分解工作器函数实现采用一个输入数据流参数,并返回多个数据流结果.这里没有显示用于数据分解的示例.

#### 数据复制/扩散

数据重复（扩散）可以看作是特殊的数据分解.一条数据将被复制,每个复制的数据将被发送到不同的输出数据流.

一个例子：

 ```go
func Duplicator(in <-chan uint64) (<-chan uint64, <-chan uint64) {
	outA, outB := make(chan uint64), make(chan uint64)
	go func() {
		for {
			x := <-in
			outA <- x
			outB <- x
		}
	}()
	return outA, outB
}
```

#### 数据计算/分析

数据计算和分析模块的功能各不相同,并且每个模块都很具体.通常,这种模块的辅助功能将每条输入数据转换为另一条输出数据.

为了简单演示,这里显示一个工作程序示例,该示例反转每个传输uint64值的每个位.

```go
func Calculator(in <-chan uint64, out chan uint64) (<-chan uint64) {
	if out == nil {
		out = make(chan uint64)
	}
	go func() {
		for {
			x := <-in
			out <- ^x
		}
	}()
	return out
}
```

#### 数据验证/过滤

数据验证或过滤模块丢弃流中的某些已传输数据.例如,以下工作函数会丢弃所有非素数.

```go
import "math/big"

func Filter(input <-chan uint64, output chan uint64) <-chan uint64 {
	if output == nil {
		output = make(chan uint64)
	}
	go func() {
		bigInt := big.NewInt(0)
		for {
			x := <-input
			bigInt.SetUint64(x)
			if bigInt.ProbablyPrime(1) {
				output <- x
			}
		}
	}()
	return output
}
```

#### 数据提供/保存

通常,数据服务或保存模块是数据流系统中的最后一个或最后一个输出模块.这里只是提供了一个简单的工作程序,它打印从输入流接收到的每条数据.

```go
import "fmt"

func Printer(input <-chan uint64) {
	for {
		x, ok := <-input
		if ok {
			fmt.Println(x)
		} else {
			return
		}
	}
}
```

#### 数据流系统组装

现在,让我们使用上述模块工作器功能来组装多个数据流系统.组装数据流系统只是为了创建一些不同模块的工作程序,并为每个工作程序指定输入流.

数据流系统示例1（线性管道）：

```go
package main

... // the worker functions declared above.

func main() {
	Printer(
		Filter(
			Calculator(
				RandomGenerator(),
			),
		),
	)
}
```

下图描述了上述数据流系统.
`Random Number Generator --> Calculator --> Filter --> Printer`
数据流系统示例2（有向无环图管线）：

```go
package main

... // the worker functions declared above.

func main() {
	filterA := Filter(RandomGenerator(), nil)
	filterB := Filter(RandomGenerator(), nil)
	filterC := Filter(RandomGenerator(), nil)
	filter := Aggregator(filterA, filterB, filterC)
	calculatorA := Calculator(filter, nil)
	calculatorB := Calculator(filter, nil)
	calculator := Aggregator(calculatorA, calculatorB)
	Printer(calculator)
}
```

下图描述了上述数据流系统.
![](/assets/image/channel_flow.png)
更复杂的数据流拓扑可以是任意图.例如,数据流系统可能具有多个最终输出.但是,实际上很少使用具有循环图拓扑的数据流系统.

从以上两个示例中,我们发现使用channel构建数据流系统非常简单直观.

从最后一个示例中,我们可以发现,借助聚合器,可以很容易地为指定模块的工人数量实现扇入和扇出.

实际上,我们可以使用简单的渠道来代替聚合器的角色.例如,以下示例将两个聚合器替换为两个channel.

```go
package main

... // the worker functions declared above.

func main() {
	c1 := make(chan uint64, 100)
	Filter(RandomGenerator(), c1) // filterA
	Filter(RandomGenerator(), c1) // filterB
	Filter(RandomGenerator(), c1) // filterC
	c2 := make(chan uint64, 100)
	Calculator(c1, c2) // calculatorA
	Calculator(c1, c2) // calculatorB
	Printer(c2)
}
```

下图描述了修改后的数据流系统.
![](/assets/image/channel_flow2.png)
上面对数据流系统的解释对如何关闭数据流没有太多考虑.请阅读本文以获取有关如何正常关闭频道的说明.

## 原文地址

- [https://go101.org/article/channel-use-cases.html](https://go101.org/article/channel-use-cases.html)
- 资料 [https://ednsquare.com/story/anatomy-of-channels-in-go-concurrency-in-go------QbvWYy](https://ednsquare.com/story/anatomy-of-channels-in-go-concurrency-in-go------QbvWYy)