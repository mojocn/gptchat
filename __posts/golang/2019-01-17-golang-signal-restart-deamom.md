---
layout: post
title: Go进阶13:signal处理和优雅退出守护进程
category: Golang
tags: Go进阶
description: 我们在生产环境下运行的系统要求优雅退出,即程序接收退出通知后,会有机会先执行一段清理代码,将收尾工作做完后再真正退出.我们采用系统Signal来 通知系统退出,即kill pragram-pid.我们在程序中针对一些系统信号设置了处理函数,当收到信号后,会执行相关清理程序或通知各个子进程做自清理.
keywords: golang,signal,graceful,优雅退出
score: 5.0
coverage: golang_signal.jpg
published: true
---

## 1.Golang中的信号处理

我们在生产环境下运行的系统要求优雅退出,即程序接收退出通知后,会有机会先执行一段清理代码,将收尾工作做完后再真正退出.我们采用系统Signal来 通知系统退出,即kill
pragram-pid.我们在程序中针对一些系统信号设置了处理函数,当收到信号后,会执行相关清理程序或通知各个子进程做自清理.kill -9强制杀掉程序是不能被接受的,那样会导致某些处理过程被强制中断,留下无法恢复的现场,导致消息被破坏,影响下次系统启动运行.

最近用Golang实现的一个代理程序也需要优雅退出,因此我尝试了解了一下Golang中对系统Signal的处理方式,这里和大家分享.Golang
的系统信号处理主要涉及os包,os.signal包以及syscall包.其中最主要的函数是signal包中的Notify函数：

`func Notify(c chan<- os.Signal, sig …os.Signal)`

该函数会将进程收到的系统Signal转发给channel c.转发哪些信号由该函数的可变参数决定,如果您没有传入sig参数,那么Notify会将系统收到的所有信号转发给c.如果您像下面这样调用Notify：

`signal.Notify(c, syscall.SIGINT, syscall.SIGUSR1, syscall.SIGUSR2)`

则Go只会关注您传入的Signal类型,其他Signal将会按照默认方式处理,大多都是进程退出.因此您需要在Notify中传入您要关注和处理的Signal类型,也就是拦截它们,提供自定义处理函数来改变它们的行为.

### 信号类型

个平台的信号定义或许有些不同.下面列出了POSIX中定义的信号.
Linux 使用34-64信号用作实时系统中.
命令 man signal 提供了官方的信号介绍.
在POSIX.1-1990标准中定义的信号列表

<table>

<thead>

<tr>

<th style="text-align:left">信号</th>

<th style="text-align:left">值</th>

<th style="text-align:left">动作</th>

<th style="text-align:left">说明</th>

</tr>

</thead>

<tbody>

<tr>

<td style="text-align:left">SIGHUP</td>

<td style="text-align:left">1</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">终端控制进程结束(终端连接断开)</td>

</tr>

<tr>

<td style="text-align:left">SIGINT</td>

<td style="text-align:left">2</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">用户发送INTR字符(Ctrl+C)触发</td>

</tr>

<tr>

<td style="text-align:left">SIGQUIT</td>

<td style="text-align:left">3</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">用户发送QUIT字符(Ctrl+/)触发</td>

</tr>

<tr>

<td style="text-align:left">SIGILL</td>

<td style="text-align:left">4</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">非法指令(程序错误,试图执行数据段,栈溢出等)</td>

</tr>

<tr>

<td style="text-align:left">SIGABRT</td>

<td style="text-align:left">6</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">调用abort函数触发</td>

</tr>

<tr>

<td style="text-align:left">SIGFPE</td>

<td style="text-align:left">8</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">算术运行错误(浮点运算错误,除数为零等)</td>

</tr>

<tr>

<td style="text-align:left">SIGKILL</td>

<td style="text-align:left">9</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">无条件结束程序(不能被捕获,阻塞或忽略)</td>

</tr>

<tr>

<td style="text-align:left">SIGSEGV</td>

<td style="text-align:left">11</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">无效内存引用(试图访问不属于自己的内存空间,对只读内存空间进行写操作)</td>

</tr>

<tr>

<td style="text-align:left">SIGPIPE</td>

<td style="text-align:left">13</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">消息管道损坏(FIFO/Socket通信时,管道未打开而进行写操作)</td>

</tr>

<tr>

<td style="text-align:left">SIGALRM</td>

<td style="text-align:left">14</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">时钟定时信号</td>

</tr>

<tr>

<td style="text-align:left">SIGTERM</td>

<td style="text-align:left">15</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">结束程序(可以被捕获,阻塞或忽略)</td>

</tr>

<tr>

<td style="text-align:left">SIGUSR1</td>

<td style="text-align:left">30,10,16</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">用户保留</td>

</tr>

<tr>

<td style="text-align:left">SIGUSR2</td>

<td style="text-align:left">31,12,17</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">用户保留</td>

</tr>

<tr>

<td style="text-align:left">SIGCHLD</td>

<td style="text-align:left">20,17,18</td>

<td style="text-align:left">Ign</td>

<td style="text-align:left">子进程结束(由父进程接收)</td>

</tr>

<tr>

<td style="text-align:left">SIGCONT</td>

<td style="text-align:left">19,18,25</td>

<td style="text-align:left">Cont</td>

<td style="text-align:left">继续执行已经停止的进程(不能被阻塞)</td>

</tr>

<tr>

<td style="text-align:left">SIGSTOP</td>

<td style="text-align:left">17,19,23</td>

<td style="text-align:left">Stop</td>

<td style="text-align:left">停止进程(不能被捕获,阻塞或忽略)</td>

</tr>

<tr>

<td style="text-align:left">SIGTSTP</td>

<td style="text-align:left">18,20,24</td>

<td style="text-align:left">Stop</td>

<td style="text-align:left">停止进程(可以被捕获,阻塞或忽略)</td>

</tr>

<tr>

<td style="text-align:left">SIGTTIN</td>

<td style="text-align:left">21,21,26</td>

<td style="text-align:left">Stop</td>

<td style="text-align:left">后台程序从终端中读取数据时触发</td>

</tr>

<tr>

<td style="text-align:left">SIGTTOU</td>

<td style="text-align:left">22,22,27</td>

<td style="text-align:left">Stop</td>

<td style="text-align:left">后台程序向终端中写数据时触发</td>

</tr>

</tbody>

</table>

### 在SUSv2和POSIX.1-2001标准中的信号列表:

<table>

<thead>

<tr>

<th style="text-align:left">信号</th>

<th style="text-align:left">值</th>

<th style="text-align:left">动作</th>

<th style="text-align:left">说明</th>

</tr>

</thead>

<tbody>

<tr>

<td style="text-align:left">SIGTRAP</td>

<td style="text-align:left">5</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">Trap指令触发(如断点,在调试器中使用)</td>

</tr>

<tr>

<td style="text-align:left">SIGBUS</td>

<td style="text-align:left">0,7,10</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">非法地址(内存地址对齐错误)</td>

</tr>

<tr>

<td style="text-align:left">SIGPOLL</td>

<td style="text-align:left"></td>

<td style="text-align:left">Term</td>

<td style="text-align:left">Pollable event (Sys V). Synonym for SIGIO</td>

</tr>

<tr>

<td style="text-align:left">SIGPROF</td>

<td style="text-align:left">27,27,29</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">性能时钟信号(包含系统调用时间和进程占用CPU的时间)</td>

</tr>

<tr>

<td style="text-align:left">SIGSYS</td>

<td style="text-align:left">12,31,12</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">无效的系统调用(SVr4)</td>

</tr>

<tr>

<td style="text-align:left">SIGURG</td>

<td style="text-align:left">16,23,21</td>

<td style="text-align:left">Ign</td>

<td style="text-align:left">有紧急数据到达Socket(4.2BSD)</td>

</tr>

<tr>

<td style="text-align:left">SIGVTALRM</td>

<td style="text-align:left">26,26,28</td>

<td style="text-align:left">Term</td>

<td style="text-align:left">虚拟时钟信号(进程占用CPU的时间)(4.2BSD)</td>

</tr>

<tr>

<td style="text-align:left">SIGXCPU</td>

<td style="text-align:left">24,24,30</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">超过CPU时间资源限制(4.2BSD)</td>

</tr>

<tr>

<td style="text-align:left">SIGXFSZ</td>

<td style="text-align:left">25,25,31</td>

<td style="text-align:left">Core</td>

<td style="text-align:left">超过文件大小资源限制(4.2BSD)</td>

</tr>

</tbody>

</table>

    第1列为信号名;
    第2列为对应的信号值,需要注意的是,有些信号名对应着3个信号值,这是因为这些信号值与平台相关,将man手册中对3个信号值的说明摘出如下,the first one is usually valid for alpha and sparc, the middle one for i386, ppc and sh, and the last one for mips.
    第3列为操作系统收到信号后的动作,Term表明默认动作为终止进程,Ign表明默认动作为忽略该信号,Core表明默认动作为终止进程同时输出core dump,Stop表明默认动作为停止进程.
    第4列为对信号作用的注释性说明,浅显易懂,这里不再赘述.
    需要特别说明的是,SIGKILL和SIGSTOP这两个信号既不能被应用程序捕获,也不能被操作系统阻塞或忽略.

## 2. kill pid与kill -9 pid的区别

kill pid的作用是向进程号为pid的进程发送SIGTERM（这是kill默认发送的信号）,该信号是一个结束进程的信号且可以被应用程序捕获.若应用程序没有捕获并响应该信号的逻辑代码,则该信号的默认动作是kill掉进程.这是终止指定进程的推荐做法.

kill -9
pid则是向进程号为pid的进程发送SIGKILL（该信号的编号为9）,从本文上面的说明可知,SIGKILL既不能被应用程序捕获,也不能被阻塞或忽略,其动作是立即结束指定进程.通俗地说,应用程序根本无法“感知”SIGKILL信号,它在完全无准备的情况下,就被收到SIGKILL信号的操作系统给干掉了,显然,在这种“暴力”情况下,应用程序完全没有释放当前占用资源的机会.事实上,SIGKILL信号是直接发给init进程的,它收到该信号后,负责终止pid指定的进程.在某些情况下（如进程已经hang死,无法响应正常信号）,就可以使用kill
-9来结束进程.

若通过kill结束的进程是一个创建过子进程的父进程,则其子进程就会成为孤儿进程（Orphan Process）,这种情况下,子进程的退出状态就不能再被应用进程捕获（因为作为父进程的应用程序已经不存在了）,不过应该不会对整个linux系统产生什么不利影响.

## 3. 应用程序如何优雅退出

Linux Server端的应用程序经常会长时间运行,在运行过程中,可能申请了很多系统资源,也可能保存了很多状态,在这些场景下,我们希望进程在退出前,可以释放资源或将当前状态dump到磁盘上或打印一些重要的日志,也就是希望进程优雅退出（exit
gracefully）.

从上面的介绍不难看出,优雅退出可以通过捕获SIGTERM来实现.具体来讲,通常只需要两步动作：

- 注册SIGTERM信号的处理函数并在处理函数中做一些进程退出的准备.信号处理函数的注册可以通过signal()或sigaction()
  来实现,其中,推荐使用后者来实现信号响应函数的设置.信号处理函数的逻辑越简单越好,通常的做法是在该函数中设置一个bool型的flag变量以表明进程收到了SIGTERM信号,准备退出.
- 在主进程的main()中,通过类似于while(!bQuit)的逻辑来检测那个flag变量,一旦bQuit在signal handler function中被置为true,则主进程退出while()
  循环,接下来就是一些释放资源或dump进程当前状态或记录日志的动作,完成这些后,主进程退出.

## 4. Go中的Signal发送和处理

- golang中对信号的处理主要使用os/signal包中的两个方法：
- notify方法用来监听收到的信号
- stop方法用来取消监听

#### 1.监听全部信号

```go
 package main

    import (
        "fmt"
        "os"
        "os/signal"
    )

    // 监听全部信号
    func main()  {
        //合建chan
        c := make(chan os.Signal)
        //监听所有信号
        signal.Notify(c)
        //阻塞直到有信号传入
        fmt.Println("启动")
        s := <-c
        fmt.Println("退出信号", s)
    }
```

启动
go run example-1.go
启动

ctrl+c退出,输出
退出信号 interrupt

kill pid 输出
退出信号 terminated

#### 2.监听指定信号

```go
 package main

    import (
        "fmt"
        "os"
        "os/signal"
        "syscall"
    )

    // 监听指定信号
    func main()  {
        //合建chan
        c := make(chan os.Signal)
        //监听指定信号 ctrl+c kill
        signal.Notify(c, os.Interrupt, os.Kill, syscall.SIGUSR1, syscall.SIGUSR2)
        //阻塞直到有信号传入
        fmt.Println("启动")
        //阻塞直至有信号传入
        s := <-c
        fmt.Println("退出信号", s)
    }

```

启动
go run example-2.go
启动

ctrl+c退出,输出
退出信号 interrupt

kill pid 输出
退出信号 terminated

kill -USR1 pid 输出
退出信号 user defined signal 1

kill -USR2 pid 输出
退出信号 user defined signal 2

#### 3.优雅退出go守护进程

```go
 package main

    import (
        "fmt"
        "os"
        "os/signal"
        "syscall"
        "time"
    )

    // 优雅退出go守护进程
    func main()  {
        //创建监听退出chan
        c := make(chan os.Signal)
        //监听指定信号 ctrl+c kill
        signal.Notify(c, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT, syscall.SIGUSR1, syscall.SIGUSR2)
        go func() {
            for s := range c {
                switch s {
                case syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT:
                    fmt.Println("退出", s)
                    ExitFunc()
                case syscall.SIGUSR1:
                    fmt.Println("usr1", s)
                case syscall.SIGUSR2:
                    fmt.Println("usr2", s)
                default:
                    fmt.Println("other", s)
                }
            }
        }()

        fmt.Println("进程启动...")
        sum := 0
        for {
            sum++
            fmt.Println("sum:", sum)
            time.Sleep(time.Second)
        }
    }

    func ExitFunc()  {
        fmt.Println("开始退出...")
        fmt.Println("执行清理...")
        fmt.Println("结束退出...")
        os.Exit(0)
    }

```

kill -USR1 pid 输出
usr1 user defined signal 1

kill -USR2 pid
usr2 user defined signal 2

kill pid
退出 terminated
开始退出...
执行清理...
结束退出...

执行输出

```bash
go run example-3.go
进程启动...
sum: 1
sum: 2
sum: 3
sum: 4
sum: 5
sum: 6
sum: 7
sum: 8
sum: 9
usr1 user defined signal 1
sum: 10
sum: 11
sum: 12
sum: 13
sum: 14
usr2 user defined signal 2
sum: 15
sum: 16
sum: 17
退出 terminated
开始退出...
执行清理...
结束退出...
```

## 5. 参考

- http://www.cnblogs.com/jkkkk/p/6180016.html
- http://blog.csdn.net/zzhongcy/article/details/50601079
- https://www.douban.com/note/484935836/
- https://gist.github.com/reiki4040/be3705f307d3cd136e85#file-signal-go-L1

