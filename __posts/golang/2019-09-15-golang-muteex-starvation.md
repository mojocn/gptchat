---
layout: post
title: Go进阶27:Go语言Mutex Starvation(译)
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,mutex starvation lock
description:  Go语言教程,Golang教程,在Golang中进行开发时,互斥锁可能会遇到Starvation问题,因为它一直试图获得一个永远无法获得的锁
permalink: /go/:title
coverage: golang_mutex.png
date: 2019-09-15T18:22:54+08:00
---

在Golang中进行开发时,互斥锁可能会遇到Starvation问题,因为它一直试图获得一个永远无法获得的锁.
> computer science, resource starvation is a problem encountered in concurrent computing where a process is perpetually denied necessary resources to process its work.
> Starvation may be caused by errors in a scheduling or mutual exclusion algorithm,
> but can also be caused by resource leaks, and can be intentionally caused via a denial-of-service attack such as a fork bomb.


在计算机科学中,资源Starvation是并发计算中遇到的问题,其中进程永远被剥夺了处理其工作所必需的资源.
Starvation可能是由调度或互斥算法中的错误引起的,但也可能是由资源泄漏引起的,也可能是故意通过拒绝服务攻击引起的,例如fork轰炸.

## 1. Starvation

为了说明一个Mutex Starvation,我们引用[Russ Cox的关于讨论mutex改进的例子](https://github.com/golang/go/issues/13086)：

```go
func main() {
	done := make(chan bool, 1)
	var mu sync.Mutex

	// goroutine1
	go func() {
		for {
			select {
			case <-done:
				return
			default:
				mu.Lock()
				time.Sleep(100 * time.Microsecond)
				mu.Unlock()
			}
		}
	}()

	// goroutine2
	for i := 0; i < 10; i++ {
		time.Sleep(100 * time.Microsecond)
		mu.Lock()
		mu.Unlock()
	}
	done <- true
}
```

这个示例代码是基于两个goroutines：

- goroutine1: 长时间保持锁并短暂地释放锁
- goroutine2: 暂地保持锁并长时间的释放锁

两者都有100ms的周期,但由于goroutine1不断请求锁定,我们可以预期它会更频繁地获得锁定.
上面代码是一个使用Go 1.8实现分布式锁的示例,循环迭代为10次,结果如下

```bahs
Lock acquired per goroutine:
g1: 7200216
g2: 10
```

goroutine2已经获得了10次锁,而goroutine1获得了超过七百万次.
让我们来分析一下这里发生了什么.

## 2. 发生什么

首先,goroutine1将获得锁并休眠100ms.当goroutine2尝试获取锁时,
它将被添加到锁的队列 - FIFO顺序 - 并且goroutine将进入等待状态：

图1:锁的获取

![](/assets/image/golang_mutex_01.png)

然后,当goroutine1完成其工作时,它将释放锁.这将通知队列唤醒goroutine2.
goroutine2将被标记为可运行,并且正在等待Go Scheduler在一个线程上运行：

图2:goroutine2被唤醒

![](/assets/image/golang_mutex_02.png)

但是,当goroutine2等待运行时,goroutine1将再次请求锁定：

图3:goroutine2等待运行

![](/assets/image/golang_mutex_03.png)

当goroutine2尝试获取锁定时,它将看到已经暂定并将进入等待模式,如图2所示：

图4:goroutine2再次试图获取锁

![](/assets/image/golang_mutex_04.png)

goroutine2对锁的获取将取决于它在线程上运行的时间点.
现在问题已经确定,让我们回顾一下可能的解决方案.

## 3. Barging VS Handoff VS Spinning

有许多方法可以处理互斥锁,例如：

### 3.1 ***Barging模式***

这旨在提高吞吐量.当锁被释放时,它将唤醒第一个等待者并将锁给第一个进入的请求或这个唤醒的等待者：

Barging模式

![Barging模式](/assets/image/golang_mutex_05.png)

这就是Go 1.8的设计和反映我们之前看到的结果.

### 3.2 ***Handoff模式***

锁释放后,互斥锁将保持锁定,直到第一个等待者准备好.它会降低吞吐量,
因为即使另一个goroutine准备好获取锁定,也会保持锁定：

Handoff模式

![Handoff模式](/assets/image/golang_mutex_06.png)

我们可以在Linux内核的mutex中找到这个逻辑：
Mutex Starvation是可能的,因为mutex_lock（）允许锁窃取,其中运行（或乐观spinning）任务优先于唤醒等待者而获取锁.
锁窃取是一项重要的性能优化,因为等待等待者唤醒并获得运行时间可能需要很长时间,在此期间每个人都会在锁定时停止.
[...]这重新引入了一些等待时间,因为一旦我们进行了切换,我们必须等待等待者再次醒来.

在我们的例子中,Mutex handoff 将完美地平衡两个goroutines之间的锁定分布,但会降低性能,因为它会强制第一个goroutine等待锁定,即使它没有被等待.

### 3.3 ***Spinning模式***

如果 mutex与 spinlock 不同,它可以加入一些逻辑.当服务员的队列为空或应用程序大量使用互斥锁时,Spinning可能很有用.
Parking 和 unparking goroutines是有成本的,可能比等待下一次锁定获取Spinning慢：

Spinning模式

![](/assets/image/golang_mutex_07.png)

Go 1.8也使用了这种策略.当尝试获取已经保持的锁时,如果本地队列为空并且处理器的数量大于1,则goroutine将spinning几次,使用一个处理器spinning将仅阻止该程序.
spinning后,goroutine将停放.在程序密集使用锁的情况下,它充当快速路径.
有关如何设计锁定的更多信息 -barging, handoff, spinlock,Filip Pizlo撰写了一篇必读文章[“Locking in WebKit”](https://webkit.org/blog/6161/locking-in-webkit/).

## 4. Starvation模式

在Go 1.9之前,Go正在结合barging 和 spinning 模式.
在版本1.9中,Go通过添加新的starvation模式解决了上面提到的问题,
该模式将导致在解锁模式期间进行切换.
所有等待锁定超过一毫秒的goroutine,也称为有界等待goroutine,将被标记为starvation.当标记为starvation时,解锁方法现在将锁直接交给第一个等待者.工作流程如下：

starvation mode

![](/assets/image/golang_mutex_08.png)

在starvation模式下也会停用spinning,因为传入的goroutine将无法获得为下一个等待者保留的锁定.

我们使用Go 1.9和新的饥饿模式运行上面示例代码结果如下：
每个goroutine获得的锁的数量：

```go
Lock acquired per goroutine:
g1: 57
g2: 10
```

结果现在更加公平.现在,我们可能想知道当互斥锁没有处于starvation状态时,
这个新的控制层是否会对其他情况产生影响.
正如我们在封装中的基准测试（Go 1.8 vs. Go 1.9）中所看到的,
其他情况下性能没有下降（性能随着处理器数量的不同而略有变化）：

```go
Cond32-610.9μs±2％10.9μs±2％~ 
MutexUncontended-6 2.97ns±0％2.97ns±0％~ 
Mutex-6 122ns±6％122ns±2％~ 
MutexSlack-6 149ns±3％142ns±3 ％-4.63％
MutexWork-6 136ns±3％140ns±5％~ 
MutexWorkSlack-6 152ns±0％138ns±2％-9.21％
MutexNoSpin-6 150ns±1％152ns±0％+ 1.50％
MutexSpin-6 726ns±0 ％730ns±1％~ 
RWMutexWrite100-6 40.6ns±1％40.9ns±1％+ 0.91％
RWMutexWrite10-6 37.1ns±0％37.0ns±1％~ 
RWMutexWorkWrite100-6 133ns±1％134ns±1％+ 1.01％
RWMutexWorkWrite10-6 152ns±0％152ns±0％〜
```

原文地址[https://medium.com/a-journey-with-go/go-mutex-and-starvation-3f4f4e75ad50](https://medium.com/a-journey-with-go/go-mutex-and-starvation-3f4f4e75ad50)
