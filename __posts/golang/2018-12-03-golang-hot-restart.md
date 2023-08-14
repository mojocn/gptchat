---
layout: post
title: golang hotfix热更新详解
category: Golang
tags: golang
date: 2018-12-26T13:19:54+08:00
description: 软件的热更新就是指在保持系统正常运行的情况下对系统进行更新升级.常见的情况有：系统服务升级,修复现有逻辑,服务配置更新等.
---

## 1,什么是热更新

网络上有这么一个例子来形容热更新,我觉得很形象很贴切：

> 一架行驶在高速上的大卡车,行驶过程中突然遭遇爆胎,热更新则是要求在不停车的情况下将车胎修补好,且补胎过程中卡车需要保持正常行驶.

软件的热更新就是指在保持系统正常运行的情况下对系统进行更新升级.常见的情况有：系统服务升级,修复现有逻辑,服务配置更新等.

## 2,热更新原理

先来看下Nginx热更新是如何做的？  
Nginx支持运行中接收信号,方便开发者控制进程.

- 1）首先备份原有的Nginx二进制文件,并用新编译好的Nginx二进制文件替换旧的
- 2）然后向master进程发送`USR2`信号.此时Nginx进程会启动一个新版本Nginx,该新版本Nginx进程会发起一个新的master进程与work进程.即此时会有两个Nginx实例在运行,一起处理新来的请求.
- 3）再向原master进程发送`WINCH`信号,它会逐渐关闭相关work进程,此时原master进程仍保持监听新请求但不会发送至其下work进程,而是交给新的work进程
- 4）最后等到所有原work进程全部关闭,向原master进程发送`QUIT`信号,终止原master进程,至此,完成Nginx热升级.

**注**：在*nix系统中,信号（Signal）是一种进程间通信机制,它给应用程序提供一种异步的软件中断,使应用程序有机会接受其他程序或终端发送的命令(即信号).

同样地,golang热更新也可以采取类似的处理.如上篇所述,都是利用用户自定义信号`USR2`.

**注**：Plugin包方式的golang热更新本文暂不讨论.

## 3,热更新实现

golang热更新可以细分为服务热『更新』（即热升级,类比Nginx的restart命令）与配置文件热更新（类比Nginx的reload命令）.接下来从实现细节处依次讨论.

### 3.1 服务热更新

大致流程如下：

- 1）golang服务进程运行时监听`USR2`信号
- 2）进程收到`USR2`信号后,fork子进程（启动新版本服务）,并将当前socket句柄等进程环境交给它
- 3）新进程开始监听socket请求
- 4）等待旧服务连接停止

主要代码示例如下：  
监听`USR2`信号

```go

    func (a *app) signalHandler(wg *sync.WaitGroup) {
        ch := make(chan os.Signal, 10)
        signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM, syscall.SIGUSR2)
        for {
            sig := <-ch
            switch sig {
            case syscall.SIGINT, syscall.SIGTERM:
                // 确保接收到INT/TERM信号时可以触发golang标准的进程终止行为
                signal.Stop(ch)
                a.term(wg)
                return
            case syscall.SIGUSR2:
                err := a.preStartProcess()
                if err != nil {
                    a.errors <- err
                }
                // 发起新进程
                if _, err := a.net.StartProcess(); err != nil {
                    a.errors <- err
                }
            }
        }
    }
```

复制当前进程socket连接,发起新进程

```go

    execSpec := &syscall.ProcAttr{
    Env: os.Environ(),
    Files: []uintptr{os.Stdin.Fd(), os.Stdout.Fd(), os.Stderr.Fd()},
    }
    fork, err := syscall.ForkExec(os.Args[0], os.Args, execSpec)
    ...
```

详细源码可见：[https://scalingo.com/articles...](https://scalingo.com/articles/2014/12/19/graceful-server-restart-with-go.html)

以上仅为代码示例,目前已经成熟的开源实现主要有：endless和facebook的grace,原理基本类似,fork一个子进程,子进程监听原有父进程socket端口,父进程优雅退出.

在实际的生产环境中推荐使用以上开源库,关于热更新开源库的使用非常方便,下面是facebook的grace库的例子：  
引入`github.com/facebookgo/grace/gracehttp`包

```go

    func main() {
        app := gin.New()// 项目中时候的是gin框架
        router.Route(app)
        var server *http.Server
        server = &http.Server{
            Addr:    ":8080",
            Handler: app,
        }
        gracehttp.Serve(server)
    }
```

利用`go build`命令编译,生成服务的可执行文件.  
然后再用shell封装一下服务命令,生成restat.sh命令文件

```shell
    #!/bin/sh

    ps aux | grep wingo
    count=`ps -ef | grep "wingo" | grep -v "grep" | wc -l`
    echo ""

    if [ 0 == $count ]; then
        echo "Wingo starting..."
        sudo ./wingo &
        echo "Wingo started"
    else
        echo "Wingo Restarting..."
        sudo kill -USR2 $(ps -ef | grep "wingo" | grep -v grep | awk '{print $2}')
        echo "Wingo Restarted"
    fi

    sleep 1

    ps aux | grep wingo
```

**注**：其中wingo为服务的二进制名称.

于是,便可通过执行./restart.sh命令,达到对服务的热升级目的.

### 3.2 配置文件热更新

配置文件热更新是指在不停止服务的情况下,重新加载服务所有配置文件.  
与3.1服务热升级原理一样,利用用户自定义信号:`USR1`,即可实现服务的配置文件热更新.

- 1）服务监听`USR1`信号
- 2）服务接收到`USR1`信号后,停止接受新的连接,等待当前连接停止,重新载入配置文件,重启服务器,从而实现相对平滑的不停服的更改.

主要代码实现：

```go
    // LoadAllConf 调用加载配置文件函数
    // load为具体加载配置文件方法
    func LoadAllConf(load func(bool)) {
        load(true)
        listenSIGUSR1(load)
    }

    // listenSIGUSR1 监听SIGUSR1信号
    func listenSIGUSR1(f func(bool)) {
        s := make(chan os.Signal, 1)
        signal.Notify(s, syscall.SIGUSR1)
        go func() {
            for {
                <-s
                f(false)
                log.Println("Reloaded")
            }
        }()
    }
```

详细源码可见：[https://www.openmymind.net/Go...](https://www.openmymind.net/golang-Hot-Configuration-Reload/)

利用go build命令编译,生成服务的可执行文件.  
然后再用shell封装一下配置重载命令,生成reload.sh命令文件

```bash

    #!/bin/sh

    ps aux | grep wingo
    echo ""

    echo "Wingo Reloading..."
    sudo kill -USR1 $(ps -ef | grep "wingo" | grep -v grep | awk '{print $2}')
    echo "Wingo Reloaded"
    echo ""

    sleep 1

    ps aux | grep wingo

```

于是,便可通过执行./reload.sh命令,达到对服务的配置文件热升级目的.

## 4,总结

本文主要描述了golang服务热升级与配置文件热更新原理与主要代码实现,本质上也不是什么新内容,如果之前读过《Unix环境高级编程》,就会觉得很亲切.底层原理基本上是利用了信号这个软件中断机制,在运行中改变常驻进程的行为.

## References

[https://scalingo.com/articles...](https://scalingo.com/articles/2014/12/19/graceful-server-restart-with-go.html)  
[http://kuangchanglang.com/gol...](http://kuangchanglang.com/golang/2017/04/27/golang-graceful-restart#%E7%BB%86%E8%8A%82)  
[https://blog.csdn.net/black_O...](https://blog.csdn.net/black_OX/article/details/77869479)  
[https://www.openmymind.net/Go...](https://www.openmymind.net/golang-Hot-Configuration-Reload/)  
[https://blog.csdn.net/qq_1543...](https://blog.csdn.net/qq_15437667/article/details/83796838)  
[https://wrfly.kfd.me/posts/%E...](https://wrfly.kfd.me/posts/%E7%83%AD%E5%8D%87%E7%BA%A7/)

