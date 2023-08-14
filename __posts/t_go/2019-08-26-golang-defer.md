---
layout: post
title: Go教程:09-defer详解和使用场景
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,defer详解和使用场景
description:  Go语言教程,Golang教程,defer,panic,recover详解和使用场景
permalink: /:categories/:title
coverage: golang_defer_panic.png
date: 2019-08-26T14:06:54+08:00
---

关键字 defer 允许我们推迟到函数返回之前（或任意位置执行 return 语句之后）一刻才执行某个语句或函数（为什么要在返回之后才执行这些语句？因为 return 语句同样可以包含一些操作,而不是单纯地返回某个值）.
关键字 defer 的用法类似于面向对象编程语言 Java 和 C# 的 finally 语句块,它一般用于释放某些已分配的资源.

大家都知道go语言的defer功能很强大,对于资源管理非常方便,但是如果没用好,也会有陷阱.
Go 语言中延迟函数 defer 充当着 try...catch 的重任,使用起来也非常简便,然而在实际应用中,很多 gopher 并没有真正搞明白 defer,return,返回值,panic 之间的执行顺序,从而掉进坑中.

## 1. 基本介绍

延时调用函数的语法如下：

`defer func_name(param-list)`

当一个函数调用前有关键字 defer 时, 那么这个函数的执行会推迟到包含这个 defer 语句的函数即将返回前才执行. 例如：

```go
package main
import "fmt"

func main() {
	function1()
}

func function1() {
	fmt.Printf("In function1 at the top\n")
	defer function2()
	fmt.Printf("In function1 at the bottom!\n")
}

func function2() {
	fmt.Printf("Function2: Deferred until the end of the calling function!")
}
```

## 2. defer 顺序

如果有多个defer 调用, 则调用的顺序是先进后出的顺序, 类似于入栈出栈一样（后进先出/先进后出）

```go
package main
 
import "fmt"
 
func f3() (r int) {
    defer func() {
        r++
    }()
    return 0
}
 
func main() {
    fmt.Println(f3())
}
```

## 3. defer使用场景

### 3.1 defer 关闭文件流

```go
package main

import (
    "bufio"
    "fmt"
    "io"
    "os"
)

func main() {
    inputFile, inputError := os.Open("input.dat")
    if inputError != nil {
        fmt.Printf("An error occurred on opening the inputfile\n" +
            "Does the file exist?\n" +
            "Have you got acces to it?\n")
        return // exit the function on error
    }
    defer inputFile.Close()

    inputReader := bufio.NewReader(inputFile)
    for {
        inputString, readerError := inputReader.ReadString('\n')
        fmt.Printf("The input was: %s", inputString)
        if readerError == io.EOF {
            return
        }      
    }
}
```

### 3.2 defer 解锁一个加锁的资源

```go
mu.Lock()  
defer mu.Unlock() 
```

### 3.3 defer  打印最终报告

```go
printHeader()  
defer printFooter()
```

### 4.4 defer 关闭数据库链接

```go
// open a database connection  
defer disconnectFromDB()

```

### 4.5 defer 语句能够使得代码更加简洁

合理使用 defer 语句能够使得代码更加简洁.以下代码模拟了上面描述的第 4 种情况

```go
package main

import "fmt"

func main() {
	doDBOperations()
}

func connectToDB() {
	fmt.Println("ok, connected to db")
}

func disconnectFromDB() {
	fmt.Println("ok, disconnected from db")
}

func doDBOperations() {
	connectToDB()
	fmt.Println("Defering the database disconnect.")
	defer disconnectFromDB() //function called here with defer
	fmt.Println("Doing some DB operations ...")
	fmt.Println("Oops! some crash or network error ...")
	fmt.Println("Returning from function here!")
	return //terminate the program
	// deferred function executed here just before actually returning, even if
	// there is a return or abnormal termination before
}
```

### 4.6 defer 语句实现代码追踪

一个基础但十分实用的实现代码执行追踪的方案就是在进入和离开某个函数打印相关的消息,即可以提炼为下面两个函数：

```go
package main

import "fmt"

func trace(s string)   { fmt.Println("entering:", s) }
func untrace(s string) { fmt.Println("leaving:", s) }

func a() {
	trace("a")
	defer untrace("a")
	fmt.Println("in a")
}

func b() {
	trace("b")
	defer untrace("b")
	fmt.Println("in b")
	a()
}

func main() {
	b()
}
```

### 4.7 defer 记录函数的参数与返回值

下面的代码展示了另一种在调试时使用 defer 语句的手法

```go
// defer_logvalues.go
package main

import (
	"io"
	"log"
)

func func1(s string) (n int, err error) {
	defer func() {
		log.Printf("func1(%q) = %d, %v", s, n, err)
	}()
	return 7, io.EOF
}

func main() {
	func1("Go")
}

// Output: 2011/10/04 10:46:11 func1("Go") = 7, EOF
```

### 4.8 defer 捕捉recover panic

panic 与 recover 是 Go 的两个内置函数,这两个内置函数用于处理 Go 运行时的错误,panic 用于主动抛出错误,recover 用来捕获 panic 抛出的错误.

- 引发panic有两种情况,一是程序主动调用,二是程序产生运行时错误,由运行时检测并退出.
- 发生panic后,程序会从调用panic的函数位置或发生panic的地方立即返回,逐层向上执行函数的defer语句,然后逐层打印函数调用堆栈,直到被recover捕获或运行到最外层函数.
- panic不但可以在函数正常流程中抛出,在defer逻辑里也可以再次调用panic或抛出panic.defer里面的panic能够被后续执行的defer捕获.
- recover用来捕获panic,阻止panic继续向上传递.recover()和defer一起使用,但是defer只有在后面的函数体内直接被掉用才能捕获panic来终止异常,否则返回nil,异常继续向外传递.

```go
//以下捕获失败
defer recover()
defer fmt.Prinntln(recover)
defer func(){
    func(){
        recover() //无效,嵌套两层
    }()
}()

//以下捕获有效
defer func(){
    recover()
}()

func except(){
    recover()
}
func test(){
    defer except()
    panic("runtime error")
}
```

***多个panic只会捕捉最后一个****

```go
package main
import "fmt"
func main(){
    defer func(){
        if err := recover() ; err != nil {
            fmt.Println(err)
        }
    }()
    defer func(){
        panic("three")
    }()
    defer func(){
        panic("two")
    }()
    panic("one")
}
```

一般情况下有两种情况用到：

- 程序遇到无法执行下去的错误时,抛出错误,主动结束运行.
- 在调试程序时,通过 panic 来打印堆栈,方便定位错误.