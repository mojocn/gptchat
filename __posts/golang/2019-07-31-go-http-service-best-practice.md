---
layout: post
title: (译)Go语言HTTP服务最佳实践
category: Golang
tags: Golang
keywords: Go语言HTTP服务最佳实践
description: Go语言HTTP服务最佳实践
coverage: ginbro_coverage.jpg
---


自从go语言r59版本(一个1.0之前的版本)以来,我一直在写Go程序,并且在过去七年里一直在Go中构建HTTP API和服务.

多年来,我编写服务的方式发生了变化,所以我想分享今天如何编写服务 - 以防模式对您和您的工作有用.

## 1. Server Struct

我的所有组件都有一个`server`结构,通常看起来像这样：

```go
type server struct { 
    db * someDatabase 
    router * someRouter 
    email EmailSender 
}
```

**共享依赖项是结构的字段**

## 2. routes.go

我在每个组件中都有一个文件`routes.go`,其中所有路由都可以存在：

```go
package app 
func(s * server)routes(){ 
    s.router.HandleFunc("/ api/",s.handleAPI())
    s.router.HandleFunc("/ about",s.handleAbout())
    s.router .HandleFunc("/",s.handleIndex())
}
```

这很方便,因为大多数代码维护都是从`URL`和`错误报告`开始的,所以只需一眼就`routes.go`可以指示我们在哪里查看.

## 3. server 挂载 handler

我的`HTTP`server 挂载 `handler`：

`func(s * server)handleSomething()http.HandlerFunc {...}`
handler可以通过s服务器变量访问依赖项.

## 4. return Handler

我的处理函数实际上并不处理Request,它们返回一个handler函数.

这给了我们一个`闭包环境`,我们的处理程序可以在其中运行

```go
func(s * server)handleSomething()http.HandlerFunc { 
    thing：= prepareThing()
    return func(w http.ResponseWriter,r * http.Request){ 
        // use thing         
    } 
}
```

该`prepareThing`只调用一次,所以您可以用它做一次每处理程序初始化,然后用thing在处理程序.

确保只读取共享数据,如果处理程序正在修改任何内容,请记住您需要一个互斥锁或其他东西来保护它.

## 5. 参数是handler函数的依赖

如果特定处理程序具有依赖项,请将其作为参数.

```go

func(s * server)handleGreeting(format string)http.HandlerFunc { 
    return func(w http.ResponseWriter,r * http.Request){ 
        fmt.Fprintf(w,format,"World")
    } 
}
```

format处理程序可以访问该变量.

## 6. HandlerFunc over `Handler`

我`http.HandlerFunc`现在几乎用在每一个案例中,而不是`http.Handler`.

```go
func(s * server)handleSomething()http.HandlerFunc { 
    return func(w http.ResponseWriter,r * http.Request){ 
        ... 
    } 
}

```

它们或多或少是可以互换的,所以只需选择更容易阅读的内容.对我来说,就是这样http.HandlerFunc.

## 5. Middleware中间件

中间件函数接受http.HandlerFunc并返回一个可以在调用原始处理程序之前和`/`或之后运行代码的新函数 - 或者它可以决定根本不调用原始handler.

```go
func(s * server)adminOnly(h http.HandlerFunc)http.HandlerFunc { 
    return func(w http.ResponseWriter,r * http.Request){ 
        if！currentUser(r).IsAdmin { 
            http.NotFound(w,r)
            return 
        } 
        h(w,r)
    } 
}
```

处理程序内部的逻辑可以选择是否调用原始处理程序 - 在上面的示例中,如果`IsAdmin`是`false`,HandlerFunc将返回`HTTP 404 Not Found`并返回(`abort`); 注意没有调用`h`处理程序.

如果`IsAdmin`是`true`,则将执行传递给传入的h处理程序.

通常我在`routes.go`文件中列出了中间件：

```go
package app 
func(s * server)routes(){ 
    s.router.HandleFunc("/ api 
    /",s.handleAPI())s.router.HandleFunc("/ about",s.handleAbout())
    s.router .HandleFunc("/",s.handleIndex())
    s.router.HandleFunc("/ admin",s.adminOnly( s.handleAdminIndex()))
}
```

## 7. Request 和 Response类

如果Server有自己的`请求`和`响应`类型,通常它们仅对该特定Handler有用.

如果是这种情况,您可以在函数内定义它们.

```go
func(s * server)handleSomething()http.HandlerFunc { 
    type request struct { 
        Name string 
    } 
    type response struct { 
        Greeting     string`json ："greeting"` 
    } 
return func(w http.ResponseWriter,r * http.Request){ 
        . .. 
    } 
}
```

这会对您的`包空间`进行整理,并允许您将这些`类型命名为相同`,而不必考虑特定于处理程序的版本.

在测试代​​码中,您只需将类型复制到测试函数中并执行相同的操作即可.要么…

## 8. 测试框架

如果您的`请求/响应`类型隐藏在处理程序中,您只需在测试代码中声明新类型即可.

这是一个为需要了解您的代码的后代做一些故事讲述的机会.

例如,假设Person我们的代码中有一个类型,我们在许多端点上重用它.如果我们有一个`/greet`endpoint,我们可能只关心他们的名字,所以我们可以在测试代码中表达：

```go
func TestGreet(t * testing.T){ 
    is：= is.New(t)
    p：= struct { 
        Name string`json ："name"` 
    } { 
        Name："Mat Ryer",
    } 
    var buf bytes.Buffer 
    err： = json.NewEncoder(＆buf).Encode(p)
    is.NoErr(err)// json.NewEncoder 
    req,err：= http.NewRequest(http.MethodPost,"/ greet",＆buf)
    is.NoErr(err)
    / / ...这里有更多测试代码
```

从这个测试中可以清楚地看出,我们关心的唯一领域就是Name人.

## 9. sync.Once 配置依赖项

如果我在准备处理程序时必须做任何昂贵的事情,我会推迟到第一次调用该处理程序时.

这改善了应用程序启动时间

```go
func(s * server)handleTemplate(files string ...)http.HandlerFunc { 
    var(
        init sync.Once 
        tpl * template.Template 
        err error 
    )
    return func(w http.ResponseWriter,r * http.Request){ 
        init.Do (func(){ 
            tpl,err = template.ParseFiles(files ...)
        })
        if err！= nil { 
            http.Error(w,err.Error(),http.StatusInternalServerError)
            return 
        } 
        // use tpl 
    } 
}

```

## 10. sync.Once 确保代码只执行一次

其他调用(其他人发出相同的请求)将一直阻塞,直到完成.
错误检查在init函数之外,所以如果出现问题我们仍然会出现错误,并且不会在日志中丢失错误
如果未调用处理程序,则永远不会完成昂贵的工作 - 根据代码的部署方式,这可能会带来很大的好处
请记住,执行此操作时,您将初始化时间从启动时移至运行时(首次访问端点时).我经常使用Google App Engine,所以这对我来说很有意义,但是您的情况可能会有所不同,所以值得思考何时何地使用sync.Once这样.

## 11. 服务器是可测试的

我们的服务器类型非常可测试.

```go
func TestHandleAbout(t * testing.T){ 
    is：= is.New(t)
    srv：= server { 
        db：mockDatabase,
        email：mockEmailSender,
    } 
    srv.routes()
    req,err：= http.NewRequest("GET" ,"/ about",nil)
    is.NoErr(错误)
    w：= httptest.NewRecorder()
    srv.ServeHTTP(w,req)
    is.Equal(w.StatusCode,http.StatusOK)
}
```

在每个测试中创建一个服务器实例 - 如果昂贵的东西延迟加载,这将不会花费太多时间,即使对于大组件
通过在服务器上调用`ServeHTTP`,我们正在测试整个堆栈,包括路由和中间件等.如果您想避免这种情况,您当然可以直接调用处理程序方法.
使用`httptest.NewRecorder`记录什么处理程序在做
此代码示例使用我的测试迷您框架(作为`Testify`的迷您替代品)
