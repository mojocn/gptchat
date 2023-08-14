---
layout: post
title: Go快速入门和查询
category: CheatSheet
tags: [Golang,CheatSheet,快速入门,快速查询]
description: Go语法快速入门,Go简明语法手册,快速查询,go语言快速小抄,编程快速入门指南
date: 2018-12-26T13:19:54+08:00
keywords: golang go 快速入门,语法快速入门,快速查询,小抄,编程快速入门指南

---

## 目录

1. [基本语法](#基本语法)
2. [运算符](#运算符)
    * [数学运算](#数学运算)
    * [比较运算](#比较运算)
    * [逻辑运算](#逻辑运算)
    * [其他](#其他)
3. [声明变量](#声明变量)
4. [函数](#函数)
    * [函数作为值和闭包](#函数作为值和闭包)
    * [函数作为参数](#函数作为参数)
5. [内置类型](#内置类型)
6. [类型转换](#类型转换)
7. [包](#包)
8. [控制结构](#控制结构)
    * [If](#if)
    * [Loops](#loops)
    * [Switch](#switch)
9. [Arrays, Slices, Ranges](#arrays-slices-ranges)
    * [Arrays](#arrays)
    * [Slices](#slices)
    * [Array和Slices的操作](#Array和Slices的操作)
10. [Maps](#maps)
11. [结构体](#结构体)
12. [指针](#指针)
13. [接口](#接口)
14. [嵌套](#嵌套)
15. [Errors](#errors)
16. [并发](#并发)
    * [Goroutines](#goroutines)
    * [Channels](#channels)
    * [Channel 公理](#Channel公理)
17. [打印](#打印)
18. [反射](#反射)
    * [类型断言](#类型断言)
    * [反射Example](https://github.com/a8m/reflect-examples)
19. [代码片](#代码片)
    * [Http-Server](#http服务器)

## Go语言概括

* 强制语言
* 严格类型
* 语法和C相似 (少花括号,没有分号)
* 编译成机器代码(不需要JVM)
* 没有类,但是有结构和方法
* 接口
* 没有继承. 但是有结构体内嵌 [type embedding](http://golang.org/doc/effective%5Fgo.html#embedding)
* 函数是第一等公民
* 方法可以多返回值
* 支持闭包
* 支持指针但是不支持指针运算
* 内置goroutines和channel

# 基本语法

## Hello World

File `hello.go`:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello Go")
}
```

`$ go run hello.go`

## 运算符

### 数学运算

| 运算符                 | 描述                  |
|---------------------|---------------------|
| `+`                 | 加                   |
| `-`                 | 减                   |
| `*`                 | 乘                   |
| `/`                 | 除                   |
| `%`                 | 余                   |
| `&`                 | 位运算and              |
| <code>&#124;</code> | 位运算or               |
| `^`                 | 位运算xor              |
| `&^`                | bit clear (and not) |
| `<<`                | 左位移                 |
| `>>`                | 右位移                 |

### 比较运算

| 运算符  | 描述   |
|------|------|
| `==` | 等于   |
| `!=` | 不等于  |
| `<`  | 小于   |
| `<=` | 小于等于 |
| `>`  | 大于   |
| `>=` | 大于等于 |

### 逻辑运算

| 运算符                 | 描述  |
|---------------------|-----|
| `&&`                | 逻辑且 |
| <code>&#124;</code> | 逻辑或 |
| `!`                 | 逻辑非 |

### 其他

| 运算符  | 描述               |
|------|------------------|
| `&`  | 取地址/创建指针         |
| `*`  | 指针引用             |
| `<-` | 发送/接收 详解 channel |

## 声明变量

类型在变量名之后

```go
var foo int //什么变量没有初始值
var foo int = 42 // 声明变量有初始值
var foo, bar int = 42, 1302 // 一次性声明初始化多个变量
var foo = 42 // 类型省略
foo := 42 // 简写,支持方法体里面使用,省略关键字,类型推断
const constant = "这是个常量"
```

## 函数

```go
// 一个简单函数
func functionName() {}

// 带参数函数 (类型在参数名称之后)
func functionName(param1 string, param2 int) {}

// 多个参数类型一样
func functionName(param1, param2 int) {}

// 定义返回值类型
func functionName() int {
    return 42
}

// 多返回值
func returnMulti() (int, string) {
    return 42, "foobar"
}
var x, str = returnMulti()

// 返回多个命名的返回值
func returnMulti2() (n int, s string) {
    n = 42
    s = "foobar"
    // n and s will be returned
    return
}
var x, str = returnMulti2()

```

### 函数作为值和闭包

```go
func main() {
    // 把函数赋值给变量
    add := func(a, b int) int {
        return a + b
    }
    // 使用变量名来调用函数
    fmt.Println(add(3, 4))
}


//闭包能够获取定义闭包作用范围内的变量
func scope() func() int{
    outer_var := 2
    foo := func() int { return outer_var}
    return foo
}

func another_scope() func() int{
    //错误 因为outer_var 和 foo 在作用范围内没有被定义
    outer_var = 444
    return foo
}


// 闭包
func outer() (func() int, int) {
    outer_var := 2
    inner := func() int {
        outer_var += 99 //外面占用空间的outer_var值被改变 
        return outer_var
    }
    inner()
    return inner, outer_var //返回 inner 闭包 和被改变的outer_var
}
```

### 函数作为参数

```go
func main() {
	fmt.Println(adder(1, 2, 3)) 	// 6
	fmt.Println(adder(9, 9))	// 18

	nums := []int{10, 20, 30}
	fmt.Println(adder(nums...))	// 60
}

// By using ... before the type name of the last parameter you can indicate that it takes zero or more of those parameters.
// The function is invoked like any other function except we can pass as many arguments as we want.
func adder(args ...int) int {
	total := 0
	for _, v := range args { // Iterates over the arguments whatever the number.
		total += v
	}
	return total
}
```

## 内置类型

```
bool

string

int  int8  int16  int32  int64
uint uint8 uint16 uint32 uint64 uintptr

byte // uint8 别名

rune // alias for int32 ~= a character (Unicode code point) - very Viking

float32 float64

complex64 complex128
```

## 类型转换

```go
var i int = 42
var f float64 = float64(i)
var u uint = uint(f)

// 另外一种写法
i := 42
f := float64(i)
u := uint(f)
```

## 包

* 包的声明在每个文件的最开头
* 可以执行的包命名为 `main`
* 惯例import最后一个path是导入的包命
* `_ "github.com/awesome/awe"` 导入包只执行 `init` 函数
* `. "github.com/awesome/awe`  导入包省略到包命使用`AwesomeFunc()` 而不用使用 `awe.AwesomeFunc()`
* 大写标识会被包导出,可以被访问
* 小写表示私有不能被包外部访问

## 控制结构

### If

```go
func main() {
	// 基本用法
	if x > 10 {
		return x
	} else if x == 10 {
		return 10
	} else {
		return -x
	}

	// 您可以把一行代码放在添加判断前面使用分号分隔
	if a := b + c; a < 42 {
		return a
	} else {
		return a - 42
	}

	// 类型断言在if条件里面
	var val interface{}
	val = "foo"
	if str, ok := val.(string); ok {
		fmt.Println(str)
	}
}
```

### Loops

```go
    // There's only `for`, no `while`, no `until`
    for i := 1; i < 10; i++ {
    }
    for ; i < 10;  { // while - loop
    }
    for i < 10  { // 如果只有一个分号您可以省略分号
    }
    for { // 您可以省略参数 相当于 while (true)
    }
```

### Switch

```go
    // switch statement
    switch operatingSystem {
    case "darwin":
        fmt.Println("Mac OS Hipster")
        // cases break automatically, no fallthrough by default
    case "linux":
        fmt.Println("Linux Geek")
    default:
        // Windows, BSD, ...
        fmt.Println("Other")
    }

    // as with for and if, you can have an assignment statement before the switch value
    switch os := runtime.GOOS; os {
    case "darwin": ...
    }

    // you can also make comparisons in switch cases
    number := 42
    switch {
        case number < 42:
            fmt.Println("Smaller")
        case number == 42:
            fmt.Println("Equal")
        case number > 42:
            fmt.Println("Greater")
    }

    // 可以用逗号分隔多个条件变量
    var char byte = '?'
    switch char {
        case ' ', '?', '&', '=', '#', '+', '%':
            fmt.Println("Should escape")
    }
```

## Arrays, Slices, Ranges

### Arrays

```go
var a [10]int // declare an int array with length 10. Array length is part of the type!
a[3] = 42     // set elements
i := a[3]     // read elements

// 声明和初始化
var a = [2]int{1, 2}
a := [2]int{1, 2} //shorthand
a := [...]int{1, 2} // elipsis -> Compiler figures out array length
```

### Slices

```go
var a []int                              // 声明一个切片,和数组类似,但是没有制定长度
var a = []int {1, 2, 3, 4}               // declare and initialize a slice (backed by the array given implicitly)
a := []int{1, 2, 3, 4}                   // shorthand
chars := []string{0:"a", 2:"c", 1: "b"}  // ["a", "b", "c"]

var b = a[lo:hi]	// creates a slice (view of the array) from index lo to hi-1
var b = a[1:4]		// slice from index 1 to 3
var b = a[:3]		// missing low index implies 0
var b = a[3:]		// missing high index implies len(a)
a =  append(a,17,3)	// append items to slice a
c := append(a,b...)	// concatenate slices a and b

// create a slice with make
a = make([]byte, 5, 5)	// 第一个是长度,第二个是容量
a = make([]byte, 5)	// 容量参数是可选的

// 从array得到一个slice
x := [3]string{"Лайка", "Белка", "Стрелка"}
s := x[:] // slice 指向 array x
```

### Array和Slices的操作

`len(a)` gives you the length of an array/a slice. It's a built-in function, not a attribute/method on the array.

```go
// loop over an array/a slice
for i, e := range a {
    // i is the index, e the element
}

// if you only need e:
for _, e := range a {
    // e is the element
}

// ...and if you only need the index
for i := range a {
}

// In Go pre-1.4, you'll get a compiler error if you're not using i and e.
// Go 1.4 introduced a variable-free form, so that you can do this
for range time.Tick(time.Second) {
    // do it once a sec
}

```

{% raw %}

## Maps

```go
var m map[string]int
m = make(map[string]int)
m["key"] = 42
fmt.Println(m["key"])

delete(m, "key")

elem, ok := m["key"] // test if key "key" is present and retrieve it, if so

// map literal
var m = map[string]Vertex{
    "Bell Labs": {40.68433, -74.39967},
    "Google":    {37.42202, -122.08408},
}

// iterate over map content
for key, value := range m {
}

```

## 结构体

There are no classes, only structs. 结构体 can have methods.

```go
// A struct is a type. It's also a collection of fields

// Declaration
type Vertex struct {
    X, Y int
}

// Creating
var v = Vertex{1, 2}
var v = Vertex{X: 1, Y: 2} // Creates a struct by defining values with keys
var v = []Vertex{{1,2},{5,2},{5,5}} // Initialize a slice of structs

// Accessing members
v.X = 4

// You can declare methods on structs. The struct you want to declare the
// method on (the receiving type) comes between the the func keyword and
// the method name. The struct is copied on each method call(!)
func (v Vertex) Abs() float64 {
    return math.Sqrt(v.X*v.X + v.Y*v.Y)
}

// Call method
v.Abs()

// For mutating methods, you need to use a pointer (see below) to the Struct
// as the type. With this, the struct value is not copied for the method call.
func (v *Vertex) add(n float64) {
    v.X += n
    v.Y += n
}

```

{% endraw %}

**Anonymous structs:**
Cheaper and safer than using `map[string]interface{}`.

```go
point := struct {
	X, Y int
}{1, 2}
```

## 指针

```go
p := Vertex{1, 2}  // p 是 Vertex实例
q := &p            // q 是指向Vertex实例的指针
r := &Vertex{1, 2} // r 也是指向Vertex实例的指针

//指向Vertex的指针的类型为*Vertex

var s *Vertex = new(Vertex) //new 创建一个指针直线struct实例
```

## 接口

```go
// interface declaration
type Awesomizer interface {
    Awesomize() string
}

// types do *not* declare to implement interfaces
type Foo struct {}

// instead, types implicitly satisfy an interface if they implement all required methods
func (foo Foo) Awesomize() string {
    return "Awesome!"
}
```

## 嵌套

go语言里面没有继承,但是有结构体嵌套

```go
// ReadWriter implementations must satisfy both Reader and Writer
type ReadWriter interface {
    Reader
    Writer
}

//server 暴露 logger的全部方法
type Server struct {
    Host string
    Port int
    *log.Logger
}

//嵌套类型和普通类型一样初始化
server := &Server{"localhost", 80, log.New(...)}

//被嵌套的结构体方法在这里一样使用
server.Log(...) // calls server.Logger.Log(...)

//被潜逃的结构体的名称为嵌套的类型名
var logger *log.Logger = server.Logger
```

## Errors

没有异常处理
函数可以参数error 让return 返回
这是error interface

```go
type error interface {
    Error() string
}
```

函数可能返回error

```go
func doStuff() (int, error) {
}

func main() {
    result, err := doStuff()
    if err != nil {
        // 处理错误
    } else {
        // 没有问题,执行...
    }
}
```

# 并发

## Goroutines

goroutine说到底其实就是协程,但是它比线程更小,十几个goroutine可能体现在底层就是五六个线程,Go语言内部帮您实现了这些goroutine之间的内存共享.
`go f(a, b)` 开启一个新的 goroutine 执行 `f` 函数.

```go
// 定义一个函数,之后在 `main` 函数中被 `go` 调用
func doStuff(s string) {
}

func main() {
    // 调用函数名作为一个goroutine
    go doStuff("foobar")

    // 在goroutine中使用匿名函数
    go func (x int) {
        // 函数内容
    }(42)
}
```

## Channels

```go
ch := make(chan int) // 创建一个int channel
ch <- 42             // 向ch 送入 42
v := <-ch            // 从ch 取回值

// 非buffer channel 堵塞. 读channel 没有值的时候阻塞, 写堵塞直到channel被读取

// 创建一个buffer channel. 写入少于容量的数据不会堵塞
ch := make(chan int, 100)

close(ch) //关闭channel 之应该有发送者来关闭channel

// 从channel 获取值 判断channel是否被关闭
v, ok := <-ch

//如果ok是false导致channel关闭了
//读值直到channel关闭
for i := range ch {
    fmt.Println(i)
}

// select 杜塞 多个 channel 操作. 如果 一个条件没有杜塞 这个代码快的逻辑被执行
func doStuff(channelOut, channelIn chan int) {
    select {
    case channelOut <- 42:
        fmt.Println("We could write to channelOut!")
    case x := <- channelIn:
        fmt.Println("We could read from channelIn")
    case <-time.After(time.Second * 1):
        fmt.Println("timeout")
    }
}
```

### Channel公理

- 向一个nil channel 送入数据会导致堵塞
  ```go
  var c chan string
  c <- "Hello, World!"
  // 致命错误: 全部的 goroutines 都在睡眠-死锁
  ```
- 从nil channel获取数据导致channel永久堵塞
  ```go
  var c chan string
  fmt.Println(<-c)
  // 致命错误: 全部的 goroutines 都在睡眠-死锁
  ```
- 向一个关闭的channel发送数据导致panic
  ```go
  var c = make(chan string, 1)
  c <- "Hello, World!"
  close(c)
  c <- "Hello, Panic!"
  //向一个关闭的channel发送数据导致panic
  ```
- 从一个关闭的channel取值,立即得到的是一个零值
  ```go
  var c = make(chan int, 2)
  c <- 1
  c <- 2
  close(c)
  for i := 0; i < 3; i++ {
      fmt.Printf("%d ", <-c)
  }
  // 1 2 0
  ```

## 打印

```go
fmt.Println("Hello, 您好, नमस्ते, Привет, ᎣᏏᏲ") // 基本打印 换行
p := struct { X, Y int }{ 17, 2 }
fmt.Println( "My point:", p, "x coord=", p.X ) // 打印结构体
s := fmt.Sprintln( "My point:", p, "x coord=", p.X ) // 打印输出字符串

fmt.Printf("%d hex:%x bin:%b fp:%f sci:%e",17,17,17,17.0,17.0) // c语言央视打印
s2 := fmt.Sprintf( "%d %f", 17, 17.0 ) // 格式化字符串打印

hellomsg := `
 "Hello" in Chinese is 您好 ('Ni Hao')
 "Hello" in Hindi is नमस्ते ('Namaste')
` // 多行字符串,使用 ` 符号. 不会对字符串进行转义
```

## 反射

### 类型断言

类型断言和普通的switch类似,但是case 是 type 不是值,
value就是转换之后的值

```go
func do(i interface{}) {
	switch v := i.(type) {
	case int:
		fmt.Printf("Twice %v is %v\n", v, v*2)
	case string:
		fmt.Printf("%q is %v bytes long\n", v, len(v))
	default:
		fmt.Printf("I don't know about type %T!\n", v)
	}
}

func main() {
	do(21)
	do("hello")
	do(true)
}
```

# 代码片

## HTTP 服务器

```go
package main

import (
    "fmt"
    "net/http"
)

// 定义一个响应struct
type Hello struct{}

// 实现 ServeHTTP method (defined in interface http.Handler) 方法
func (h Hello) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "Hello!")
}

func main() {
    var h Hello
    http.ListenAndServe("localhost:4000", h)
}

// type Handler interface {
//     ServeHTTP(w http.ResponseWriter, r *http.Request)
// }
```


