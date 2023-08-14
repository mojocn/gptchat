---
layout: post
title: 如何用 Go 实现热重启
category: Golang
tags: Golang
keywords: go语言
description: 如何用 Go 实现热重启
coverage: ginbro_coverage.jpg
ref: https://segmentfault.com/a/1190000019790072
---

## 热重启

热重启（Zero Downtime）,指新老进程**无缝切换**,在替换过程中可保持对 client 的服务.

## 原理

* 父进程监听重启信号
* 在收到重启信号后,父进程调用 `fork` ,同时传递 `socket` 描述符给子进程
* 子进程接收并监听父进程传递的 `socket` 描述符
* 在子进程启动成功之后,父进程停止接收新连接,同时等待旧连接处理完成（或超时）
* 父进程退出,热重启完成

## 实现

```go
package main

import (
    "context"
    "errors"
    "flag"
    "log"
    "net"
    "net/http"
    "os"
    "os/exec"
    "os/signal"
    "syscall"
    "time"
)

var (
    server   *http.Server
    listener net.Listener = nil

    graceful = flag.Bool("graceful", false, "listen on fd open 3 (internal use only)")
    message  = flag.String("message", "Hello World", "message to send")
)

func handler(w http.ResponseWriter, r *http.Request) {
    time.Sleep(5 * time.Second)
    w.Write([]byte(*message))
}

func main() {
    var err error

    // 解析参数
    flag.Parse()

    http.HandleFunc("/test", handler)
    server = &http.Server{Addr: ":3000"}

    // 设置监听器的监听对象（新建的或已存在的 socket 描述符）
    if *graceful {
        // 子进程监听父进程传递的 socket 描述符
        log.Println("listening on the existing file descriptor 3")
        // 子进程的 0, 1, 2 是预留给标准输入,标准输出,错误输出,故传递的 socket 描述符
        // 应放在子进程的 3
        f := os.NewFile(3, "")
        listener, err = net.FileListener(f)
    } else {
        // 父进程监听新建的 socket 描述符
        log.Println("listening on a new file descriptor")
        listener, err = net.Listen("tcp", server.Addr)
    }
    if err != nil {
        log.Fatalf("listener error: %v", err)
    }

    go func() {
        err = server.Serve(listener)
        log.Printf("server.Serve err: %v\n", err)
    }()
    // 监听信号
    handleSignal()
    log.Println("signal end")
}

func handleSignal() {
    ch := make(chan os.Signal, 1)
    // 监听信号
    signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM, syscall.SIGUSR2)
    for {
        sig := <-ch
        log.Printf("signal receive: %v\n", sig)
        ctx, _ := context.WithTimeout(context.Background(), 20*time.Second)
        switch sig {
        case syscall.SIGINT, syscall.SIGTERM: // 终止进程执行
            log.Println("shutdown")
            signal.Stop(ch)
            server.Shutdown(ctx)
            log.Println("graceful shutdown")
            return
        case syscall.SIGUSR2: // 进程热重启
            log.Println("reload")
            err := reload() // 执行热重启函数
            if err != nil {
                log.Fatalf("graceful reload error: %v", err)
            }
            server.Shutdown(ctx)
            log.Println("graceful reload")
            return
        }
    }
}

func reload() error {
    tl, ok := listener.(*net.TCPListener)
    if !ok {
        return errors.New("listener is not tcp listener")
    }
    // 获取 socket 描述符
    f, err := tl.File()
    if err != nil {
        return err
    }
    // 设置传递给子进程的参数（包含 socket 描述符）
    args := []string{"-graceful"}
    cmd := exec.Command(os.Args[0], args...)
    cmd.Stdout = os.Stdout         // 标准输出
    cmd.Stderr = os.Stderr         // 错误输出
    cmd.ExtraFiles = []*os.File{f} // 文件描述符
    // 新建并执行子进程
    return cmd.Start()
}
```

我们在父进程执行 `cmd.ExtraFiles = []*os.File{f}` 来传递 `socket` 描述符给子进程,子进程通过执行 `f := os.NewFile(3, "")` 来获取该描述符.值得注意的是,子进程的 `0` ,`1` 和 `2`
分别预留给标准输入,标准输出和错误输出,所以父进程传递的 `socket` 描述符在子进程的顺序是从 `3` 开始.

## 测试

编译上述程序为 `main` ,执行 `./main -message "Graceful Reload"` ,访问 `http://localhost:3000/test` ,等待 5 秒后,我们可以看到 `Graceful Reload` 的响应.

通过执行 `kill -USR2 [PID]` ,我们即可进行 `Graceful Reload` 的测试.

通过执行 `kill -INT [PID]` ,我们即可进行 `Graceful Shutdown` 的测试.

## 参考资料

* [gracehttp: 优雅重启 Go 程序](https://segmentfault.com/a/1190000015232528)
* [Golang服务器热重启,热升级,热更新详解](https://www.cnblogs.com/sunsky303/p/9778466.html)

