---
layout: post
title: Go教程:18-error异常处理
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,go1.13error,error,panic,defer,recover异常处理
description:  Go语言教程,Golang教程,go1.13error,error,panic,defer,recover异常处理
permalink: /:categories/:title
coverage: golang_error_handle.png
date: 2019-09-02T15:29:54+08:00
---

Go是一门simple language,常拿出来鼓吹的就是作为gopher习以为傲的仅仅25个关键字.因此Go的错误处理也一如既往的简单.
Go则继承了C,以返回值为错误处理的主要方式（辅以panic与recover应对runtime异常）.
但与C不同的是,在Go的惯用法中,返回值不是整型等常用返回值类型,而是用了一个 error(interface类型).

```go
type error interface {
    Error() string
}
```

## 1. Go1.13版本 error增加特性:Error Wrap

### 1.1 增加error wrap

使用`fmt.Errorf("%w",err1)`包裹err

```go
type myError{
	Code int
	Msg
}
func(e myError)Error()string{
	return fmt.Sprintf("code: %d, msg: %s",e.Code,e.Msg)
}

err1 := &myError{}
err2 := fmt.Errorf("%w",err1)
```

### 1.2 增加error unwrap

unwrap Error 判断error是否相等

```go
if erros.UnWrap(err2) == err1 {
	//err2 包裹 err1
}
```

### 1.3 判断error 包裹(wrap)

`errors.Is(err2,err1) == true`

### 1.4 Error转换 errors.As

```go
var me myError
errors.As(err2,&me) == true
```

## 2. error处理的推荐模式

### 2.1 失败的原因只有一个时,不使用error

该函数失败的原因只有一个,所以返回值的类型应该为bool,而不是error.

```go
func (self *AgentContext) IsValidHostType(hostType string) bool {
    return hostType == "virtual_machine" || hostType == "bare_metal"
}
```

大多数情况,导致失败的原因不止一种,尤其是对I/O操作而言,用户需要了解更多的错误信息,这时的返回值类型不再是简单的bool,而是error.

### 2.2 没有失败时,不使用error

error在Golang中是如此的流行,以至于很多人设计函数时不管三七二十一都使用error,即使没有一个失败原因.

```go
func (self *CniParam) setTenantId() {
    self.TenantId = self.PodNs
}
```

### 2.3 error应放在返回值类型列表的最后

对于返回值类型error,用来传递错误信息,在Golang中通常放在最后一个.
bool作为返回值类型时也一样.

```go
resp, err := http.Get(url)
if err != nil {
    return nill, err
}

value, ok := cache.Lookup(key) 
if !ok {
    // ...cache[key] does not exist… 
}
```

### 2.4 错误值统一定义

`return errors.New(value)`,而错误value在表达同一个含义时也可能形式不同,种方式严重阻碍了错误value的重构.

可以参考C/C++的错误码定义文件,在Golang的每个包中增加一个错误对象定义文件,如下所示：

```go
var ERR_EOF = errors.New("EOF")
var ERR_CLOSED_PIPE = errors.New("io: read/write on closed pipe")
var ERR_NO_PROGRESS = errors.New("multiple Read calls return no data or error")
var ERR_SHORT_BUFFER = errors.New("short buffer")
var ERR_SHORT_WRITE = errors.New("short write")
var ERR_UNEXPECTED_EOF = errors.New("unexpected EOF")
```

### 2.5 通过单元测试发现错误,而不是日志发现

如果您的团队做不到,只能退而求其次:层层都加日志非常方便故障定位.

### 2.6 对于不应该出现的分支,使用异常处理

当某些不应该发生的场景发生时,我们就应该调用panic函数来触发异常.比如,当程序到达了某条逻辑上不可能到达的路径：

```go
switch s := suit(drawCard()); s {
    case "Spades":
    // ...
    case "Hearts":
    // ...
    case "Diamonds":
    // ... 
    case "Clubs":
    // ...
    default:
        panic(fmt.Sprintf("invalid suit %v", s))
}
```

### 2.7 针对入参不应该有问题的函数,使用panic设计

入参不应该有问题一般指的是硬编码,我们先看“一个启示”一节中提到的两个函数（Compile和MustCompile）,其中MustCompile函数是对Compile函数的包装：

```go
func MustCompile(str string) *Regexp {
    regexp, error := Compile(str)
    if error != nil {
        panic(`regexp: Compile(` + quote(str) + `): ` + error.Error())
    }
    return regexp
}
```

### 2.8 在程序开发阶段,坚持速错

建立了速错的理念,简单来讲就是“让它挂”,只有挂了您才会第一时间知道错误.
在早期开发以及任何发布阶段之前,最简单的同时也可能是最好的方法是调用panic函数来中断程序的执行以强制发生错误,使得该错误不会被忽略,因而能够被尽快修复.

## 3. defer,panic,recover异常处理

Golang 有2个内置的函数 panic() 和 recover(),用以报告和捕获运行时发生的程序错误,与 error 不同,panic-recover 一般用在函数内部.
一定要注意不要滥用 panic-recover,可能会导致性能问题,我一般只在未知输入和不可靠请求时使用.

golang 的错误处理流程：当一个函数在执行过程中出现了异常或遇到 panic(),正常语句就会立即终止,然后执行 defer 语句,
再报告异常信息,最后退出 goroutine.如果在 defer 中使用了 recover() 函数,则会捕获错误信息,使该错误信息终止报告.

- panic 意思是抛出一个异常, 和python的raise用法类似
- recover是捕获异常,和python的except用法类似
- defer会延迟函数到其他函数之后完之后再执行,后面跟的是函数

```go
package main
 
import "fmt"
 
func main(){
    defer func(){ // 必须要先声明defer,否则不能捕获到panic异常
        fmt.Println("c")
        if err:=recover();err!=nil{
            fmt.Println(err) // 这里的err其实就是panic传入的内容,55
        }
        fmt.Println("d")
    }()
    f()
}
 
func f(){
    fmt.Println("a")
    panic(55)
    fmt.Println("b")
    fmt.Println("f")
}
```

输出结果

```go
a
c
55
d
exit code 0, process exited normally.
```