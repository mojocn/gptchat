---
layout: post
title: Go Context 使用和代码分析
category: Golang
tags: Golang
keywords: go语言
description: Go Context 使用和代码分析
coverage: ginbro_coverage.jpg
ref: https://segmentfault.com/a/1190000019862527
---

## 概述

Go语言中的go-routine是go语言中的最重要的一部分,是一个用户级的线程是Go语言实现高并发高性能的重要原因.但是如何停止一个已经开启的go-routine呢？一般有几种方法：

* 使用共享内存来停止go-routine,比如通过判断一个全局变量来判断是否要停止go-routine
* 使用文件系统来停止go-routine,跟使用内存相同用文件来判断
* 使用context上下文,context也是大家最推荐的一种方式.并且可以结束嵌套的go-routine.

## 简单使用

context库中,有4个关键方法：

* `WithCancel` 返回一个cancel函数,调用这个函数则可以主动停止go-routine.
* `WithValue` WithValue可以设置一个key/value的键值对,可以在下游任何一个嵌套的context中通过key获取value.但是不建议使用这种来做go-routine之间的通信.
* `WithTimeout` 函数可以设置一个time.Duration,到了这个时间则会cancel这个context.
* `WithDeadline` WithDeadline函数跟WithTimeout很相近,只是WithDeadline设置的是一个时间点.

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    //cancel
    ctx, cancel := context.WithCancel(context.Background())
    go work(ctx, "work1")

    time.Sleep(time.Second * 3)
    cancel()
    time.Sleep(time.Second * 1)

    // with value
    ctx1, valueCancel := context.WithCancel(context.Background())
    valueCtx := context.WithValue(ctx1, "key", "test value context")
    go workWithValue(valueCtx, "value work", "key")
    time.Sleep(time.Second * 3)
    valueCancel()

    // timeout
    ctx2, timeCancel := context.WithTimeout(context.Background(), time.Second*3)
    go work(ctx2, "time cancel")
    time.Sleep(time.Second * 5)
    timeCancel()

    // deadline
    ctx3, deadlineCancel := context.WithDeadline(context.Background(), time.Now().Add(time.Second*3))
    go work(ctx3, "deadline cancel")
    time.Sleep(time.Second * 5)
    deadlineCancel()

    time.Sleep(time.Second * 3)

}

func workWithValue(ctx context.Context, name string, key string) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println(ctx.Value(key))
            println(name, " get message to quit")
            return
        default:
            println(name, " is running", time.Now().String())
            time.Sleep(time.Second)
        }
    }
}

func work(ctx context.Context, name string) {
    for {
        select {
        case <-ctx.Done():
            println(name, " get message to quit")
            return
        default:
            println(name, " is running", time.Now().String())
            time.Sleep(time.Second)
        }
    }
}
```

## 代码分析

**context的原理其实就是利用了channel
struct{}的特性,使用select获取channel数据.一旦关闭这个channel则会收到数据退出go-routine中的逻辑.context也是支持嵌套使用,结构就如下图显示利用的是一个map类型来存储子context.关闭一个节点就会循环关闭这个节点下面的所有子节点,就实现了优雅的退出go-routine的功能.下面我们看具体接口对象和源码逻辑.
**

![tech.mojotv.cn_图片描述](/assets/pic/c2dtZl8vaW1nL2JWYnZ2Y3o_dz03MDImaD0yNzY.jpg)

### `Context` 核心方法和结构体说明

**context interface** 有4个方法

* Deadline 该方法返回一个deadline和标识是否已设置deadline的bool值,如果没有设置deadline,则ok == false,此时deadline为一个初始值的time.Time值
* Done 返回一个channel.当timeout或者调用cancel方法时,将会close掉
* Err 返回一个Error
* Value 返回WithValue设置的值

```go
type Context interface {

    Deadline() (deadline time.Time, ok bool)

    Done() <-chan struct{}

    Err() error

    Value(key interface{}) interface{}
}
```

### `emptyCtx`

在上面的例子中我们可以看到函数context.Background(), 这个函数返回的就是一个emptyCtx

emptyCtx经常被用作在跟节点或者说是最上层的context,因为context是可以嵌套的.在上面的Withvalue的例子中已经看到,先用emptyCtx创建一个context,然后再使用withValue把之前创建的context传入.这个操作会在下面的分析中详细了解的.

下面就是emptyCtx,其实实现很简单所有的方法几乎返回的都是nil.

ToDo函数返回的也是

```go
var (
    background = new(emptyCtx)
    todo       = new(emptyCtx)
)

type emptyCtx int

func (*emptyCtx) Deadline() (deadline time.Time, ok bool) {
    return
}

func (*emptyCtx) Done() <-chan struct{} {
    return nil
}

func (*emptyCtx) Err() error {
    return nil
}

func (*emptyCtx) Value(key interface{}) interface{} {
    return nil
}

func (e *emptyCtx) String() string {
    switch e {
    case background:
        return "context.Background"
    case todo:
        return "context.TODO"
    }
    return "unknown empty Context"
}

var (
    background = new(emptyCtx)
    todo       = new(emptyCtx)
)

func Background() Context {
    return background
}

func TODO() Context {
    return todo
}
```

### `cancelCtx`

cancelCtx是context实现里最重要的一环,context的取消几乎都是使用了这个对象.WithDeadline WithTimeout其实最终都是调用的cancel的cancel函数来实现的.

对象中的字段：

* Context 保存parent Context
* mu 用来保护数据
* done 用来标识是否已被cancel.当外部触发cancel,或者父Context的channel关闭时,此done也会关闭
* children 保存它的所有子canceler
* err 已经cancel则err！= nil
  **cancel主要函数：**

#### `Done`

Done函数返回一个chan struct{}的channel,用来判断context是否已经被close了.从上面的例子可以看到使用一个select
来判断context是否被关闭.一旦从外部调用cancel函数关闭了context的done属性,select则可以拿到输出,最终关闭这个context

#### `Cancel`

Cancel函数用来在外部调用,调用之后主要操作：

1. 加锁避免多出操作
2. 如果cancelCtx的done未被初始化则初始化一个（这个属于lazyload）
3. 调用close(c.done) 来关闭channel,由于make(chan struct{})的特性,上面的Done channel则会接收到数据
4. 循环调用context.children 的cancel方法,关闭所有嵌套的context.
5. 释放锁c.mu.Unlock()
6. 根据参数removeFromParent来判断是否要

```go
type cancelCtx struct {
    Context
    mu       sync.Mutex            // protects following fields
    done     chan struct{}         // created lazily, closed by first cancel call
    children map[canceler]struct{} // set to nil by the first cancel call
    err      error                 // set to non-nil by the first cancel call
}

// 可以被cancel的对象,实现者是*cancelCtx 和 *timerCtx.
type canceler interface {
    cancel(removeFromParent bool, err error)
    Done() <-chan struct{}
}

func (c *cancelCtx) Done() <-chan struct{} {
    c.mu.Lock()
    if c.done == nil {
        c.done = make(chan struct{})
    }
    d := c.done
    c.mu.Unlock()
    return d
}

func (c *cancelCtx) Err() error {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.err
}

func (c *cancelCtx) String() string {
    return fmt.Sprintf("%v.WithCancel", c.Context)
}

// cancel closes c.done, cancels each of c's children, and, if
// removeFromParent is true, removes c from its parent's children.
func (c *cancelCtx) C(removeFromParent bool, err error) {
    if err == nil {
        panic("context: internal error: missing cancel error")
    }
    c.mu.Lock()
    if c.err != nil {
        c.mu.Unlock()
        return // already canceled
    }
    c.err = err
    if c.done == nil {
        c.done = closedchan
    } else {
        close(c.done)
    }
    for child := range c.children {
        // NOTE: acquiring the child's lock while holding parent's lock.
        child.cancel(false, err)
    }
    c.children = nil
    c.mu.Unlock()

    if removeFromParent {
        removeChild(c.Context, c)
    }
}
```

### `timerCtx`

timeCtx其实是在cancelCtx基础上增加timer属性.其中的cancel函数也是调用cancelCtx的Cancel函数.

```go
type timerCtx struct {
    cancelCtx
    timer *time.Timer // Under cancelCtx.mu.

    deadline time.Time
}

func (c *timerCtx) cancel(removeFromParent bool, err error) {
    c.cancelCtx.cancel(false, err)
    if removeFromParent {
        // Remove this timerCtx from its parent cancelCtx's children.
        removeChild(c.cancelCtx.Context, c)
    }
    c.mu.Lock()
    if c.timer != nil {
        c.timer.Stop()
        c.timer = nil
    }
    c.mu.Unlock()
}

func (c *timerCtx) Deadline() (deadline time.Time, ok bool) {
    return c.deadline, true
}
```

### `WithCancel``WithDeadline``WithTimeout``WithValue`

这三个方法是对于context使用的一个封装,在最上边的例子里我们可以看到是如何使用的.在这段我们是要看的是如何实现的源码.

#### `WithCancel`

WithCancel函数返回context和一个主动取消的函数,外部只要调用这个函数则会close context中channel.

返回的函数测试cancelCtx中测cancel函数,在上面已经有了详细说明这里就不过多描述了.

```go
func WithCancel(parent Context) (ctx Context, cancel CancelFunc) {
    c := newCancelCtx(parent)
    propagateCancel(parent, &c)
    return &c, func() { c.cancel(true, Canceled) }
}
```

#### `WithDeadline`

1. 判断父节点中的deadline是否比父节点的早,如果是则直接调用WithCancel
2. 创建一个timerCtx,timerCtx的具体描述也在上面详细分析过了
3. 使用time.afterFunc设置dur,当时间到了则执行timerCtx.Cancel最终执行的也是cancelCtx.Cancel
4. 返回Cancel函数,方便外部调用

```go
func WithDeadline(parent Context, d time.Time) (Context, CancelFunc) {
    if cur, ok := parent.Deadline(); ok && cur.Before(d) {
        // The current deadline is already sooner than the new one.
        return WithCancel(parent)
    }
    c := &timerCtx{
        cancelCtx: newCancelCtx(parent),
        deadline:  d,
    }
    propagateCancel(parent, c)
    dur := time.Until(d)
    if dur <= 0 {
        c.cancel(true, DeadlineExceeded) // deadline has already passed
        return c, func() { c.cancel(true, Canceled) }
    }
    c.mu.Lock()
    defer c.mu.Unlock()
    if c.err == nil {
        c.timer = time.AfterFunc(dur, func() {
            c.cancel(true, DeadlineExceeded)
        })
    }
    return c, func() { c.cancel(true, Canceled) }
}
```

#### `WithTimeout`

WithTimeout实现很简单,其实就是调用了WithDeadline方法,传入已经计算过的deadline.

```go
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc) {
    return WithDeadline(parent, time.Now().Add(timeout))
}
```

#### `WithValue`

WithValue 不返回cancel函数,只是把传入的key和value保存起来.方便上下游节点根据key获取value.

```go
type valueCtx struct {
    Context
    key, val interface{}
}

func (c *valueCtx) String() string {
    return fmt.Sprintf("%v.WithValue(%#v, %#v)", c.Context, c.key, c.val)
}

func (c *valueCtx) Value(key interface{}) interface{} {
    if c.key == key {
        return c.val
    }
    return c.Context.Value(key)
}

func WithValue(parent Context, key, val interface{}) Context {
    if key == nil {
        panic("nil key")
    }
    if !reflect.TypeOf(key).Comparable() {
        panic("key is not comparable")
    }
    return &valueCtx{parent, key, val}
}
```

## 使用原则

从网上看到了一些使用原则,把他摘抄下来：

* 不要把Context存在一个结构体当中,显式地传入函数.Context变量需要作为第一个参数使用,一般命名为ctx.
* 即使方法允许,也不要传入一个nil的Context,如果您不确定您要用什么Context的时候传一个context.TODO.
* 使用context的Value相关方法只应该用于在程序和接口中传递的和请求相关的元数据,不要用它来传递一些可选的参数.
* 同样的Context可以用来传递到不同的go-routine中,Context在多个go-routine中是安全的

## 总结

上面讲述了context的用法和源码,其实有很多框架都实现了自己的context.其实只要继承了context接口就是一个context对象.Context是大家都比较推荐的一种停止go-routine的一种方式,并且context支持嵌套,停止跟节点它下面所有的子节点都会停止.


