---
layout: post
title: Vugu：Go + WebAssembly的现代UI库
category: Golang
tags: Golang
keywords: go语言
description: Vugu：Go + WebAssembly的现代UI库
coverage: ginbro_coverage.jpg
ref: https://segmentfault.com/a/1190000019799903
---

## Vugo 是什么

Vugu 是一个 Go语言开发库,可以很容易地使用 Go 语言编写 Web 用户界面.

其基本思路如下：

* **在 `.vugu` 文件中编写 UI 组件**.这些文件类似于您在 JavaScript 框架中看到的 UI 组件（例如 .vue 文件）.但是它们不包含 JavaScript,而是包含用于 `if`,`for` 和其他类似的 Go 语言表达式.
* **每个 .vugu 文件都被转换为对应的 .go 文件**. Vugu 项目中有一个开发服务器,可以在页面重新加载时自动执行此操作,或者用 `vugugen` 命令行工具与 `go generate` 集成.代码生成还尝试在需要时提供合理的默认值,以便
  .vugu 文件包含尽可能少的样板,同时也然允许进行大量的自定义.
* **您的项目被编译为 WebAssembly 模块并在浏览器中运行**.同样,开发服务器在启动项目时也很容易.随着项目的发展,您需要自定义此过程的一部分,不过这些可以轻松的完成.
* **Vugu库**（包：[github.com/vugu/vugu](https://github.com/vugu/vugu)）**提供了在网页上将 HTML DOM 的功能有效同步**到 .vugu 文件中的标记.同时支持附加 DOM 事件处理（单击等）和将大页面分解成组件等功能.

## Vugo 快速上手

让我们创建一个在您的浏览器中运行的基本工作Vugu应用程序.它只需要三个小文件即可启动.确保至少安装了**Go 1.12**.

1. **在任何您喜欢的地方创建一个新的空文件夹**.我们将用名称 `testapp` 作为示例.您创建的每个文件都将直接放在此文件夹中,不需要子文件夹.
2. **创建**`go.mod`,它用来指定 [Go 模块](https://github.com/golang/go/wiki/Modules#gomod)名称.首先您可以按照显示的模式选择自己喜欢的名称作为占位符.例如：

```go
module example.org/someone/testapp
```

1. **Create a Vugu component file.** We'll put a click handler and an element that toggles to demonstrate some basic functionality. This first component should be
   called `root.vugu`:
2. **创建一个 Vugu 组件文件**.我们将放置一个单击处理程序和一个切换元素来演示一些基本功能.第一个组件应该叫做 `root.vugu`：

```go
<div class="my-first-vugu-comp">
    <button @click="data.Toggle()">Test</button>
    <div vg-if="data.Show">I am here!</div>
</div>

<style>
    .my-first-vugu-comp { background: #eee; }
</style>
   
<script type="application/x-go">
    type RootData struct { Show bool }
    func (data *RootData) Toggle() { data.Show = !data.Show }
</script>
```

1. **创建开发服务器代码文件**.注意,这个文件不会被编译为 WebAssembly.这是一个为您的程序提供服务的服务器.`devserver.go`：

```go
// +build ignore
   
package main
   
  import (
       "log"
       "net/http"
       "os"
       "github.com/vugu/vugu/simplehttp"
   )
   
  func main() {
       wd, _ := os.Getwd()
       l := "127.0.0.1:8844"
       log.Printf("Starting HTTP Server at %q", l)
       h := simplehttp.New(wd, true)
       // include a CSS file
       // simplehttp.DefaultStaticData["CSSFiles"] = []string{ "/my/file.css" }
       log.Fatal(http.ListenAndServe(l, h))
  }
```

1. **运行服务器**.在同一目录下,运行命令 `go run devserver.go`片刻之后,服务器就应该启动.它在 Windows,Linux 或 Mac 上的工作方式相同.


2. **访问**： [http://127.0.0.1](http://127.0.0.1):8844/
3. 惊叹于您创造的奇迹.

## Vugu 文件概述

Vugu 文件有三个部分：标记,样式和代码

**标记**是 HTML 元素,它是文件的显示部分. 通常它是一个简单的 div 标签,例如：

```go
<div class="some-name">
  <!-- ... -->
</div>
```

它显示在文档中的适当位置. 根组件（默认名为 “root” 并且位于 root.vugu 中）通常位于页面的 `<body>` 标记内. 除 `<script>` 或 `<style>` 之外,该元素可以是任何类型.

**样式**是一个常规的 `<style>` 标记,包含使用此组件输出的 CSS. 为了避免冲突,样式应该适当地加上前缀（对应于上面顶级标记元素上的 id 或类）.

**代码**是 Go 语言代码,会被逐字复制到最终的 .go 文件中. 它被放入具有特定内容类型的脚本标记中,如下所示：

```go
<script type="application/x-go">
// Go code here
</script>
```

注意：不支持 JavaScript,只支持 Go 代码. 只可以有一种语言.
