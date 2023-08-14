---
layout: post
title: Go教程:06-控制结构switch
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,switch-case-fallthrought-default控制结构
description:  Go语言教程,Golang教程,switch-case-fallthrought-default控制结构
permalink: /:categories/:title
coverage: golang_switch.jpg
date: 2019-08-24T18:21:54+08:00
---

switch 是一个条件语句,用于将一个表达式的求值结果与可能的值的列表进行匹配,并根据匹配结果执行相应的代码.可以认为 switch 语句是编写多个 if-else 子句的替代方式.
比较 C 和 Java 等其它语言而言,Go 语言中的 switch 结构使用上更加灵活.它接受任意形式的表达式：

## 1.switch基本用法

```go
switch var1 {
	case val1:
		...
	case val2:
		...
	default:
		...
}
```

变量 var1 可以是任何类型,而 val1 和 val2 则可以是同类型的任意值.

类型不被局限于常量或整数,但必须是相同的类型;或者最终结果为相同类型的表达式.前花括号 `{` 必须和 switch 关键字在同一行.

您可以同时测试多个可能符合条件的值,使用逗号分割它们,例如：`case val1, val2, val3`.

## 2.case

每一个 `case` 分支都是唯一的,从上至下逐一测试,直到匹配为止.

（ Go 语言使用快速的查找算法来测试 switch 条件与 case 分支的匹配情况,直到算法匹配到某个 case 或者进入 default 条件为止.）

一旦成功地匹配到某个分支,在执行完相应代码后就会退出整个 switch 代码块,也就是说您不需要特别使用 `break` 语句来表示结束.

因此,程序也不会自动地去执行下一个分支的代码.

因此：

```go
switch i {
	case 0: // 空分支,只有当 i == 0 时才会进入分支
	case 1:
		f() // 当 i == 0 时函数不会被调用
}
```

## 3.fallthrough

如果在执行完每个分支的代码后,还希望继续执行后续分支的代码,可以使用 `fallthrough` 关键字来达到目的.

```go
switch i {
	case 0: fallthrough
	case 1:
		f() // 当 i == 0 时函数也会被调用
}
```

在 `case ...:` 语句之后,您不需要使用花括号将多行语句括起来,但您可以在分支中进行任意形式的编码.当代码块只有一行时,可以直接放置在 `case` 语句之后.

您同样可以使用 `return` 语句来提前结束代码块的执行.当您在 switch 语句块中使用 `return` 语句,并且您的函数是有返回值的,您还需要在 switch 之后添加相应的 `return` 语句以确保函数始终会返回.

## 4.default

可选的 `default` 分支可以出现在任何顺序,但最好将它放在最后.它的作用类似与 `if-else` 语句中的 `else`,表示不符合任何已给出条件时,执行相关语句.

```go
package main

import "fmt"

func main() {
	var num1 int = 100

	switch num1 {
	case 98, 99:
		fmt.Println("It's equal to 98")
	case 100: 
		fmt.Println("It's equal to 100")
	default:
		fmt.Println("It's not equal to 98 or 100")
	}
}

```

输出：

	It's equal to 100

我们会使用 switch 语句判断从键盘输入的字符.switch 语句的第二种形式是不提供任何被判断的值（实际上默认为判断是否为 true）,然后在每个 case 分支中进行测试不同的条件.当任一分支的测试结果为
true 时,该分支的代码会被执行.这看起来非常像链式的 `if-else` 语句,但是在测试条件非常多的情况下,提供了可读性更好的书写方式.

```go
switch {
	case condition1:
		...
	case condition2:
		...
	default:
		...
}
```

例如：

```go
switch {
	case i < 0:
		f1()
	case i == 0:
		f2()
	case i > 0:
		f3()
}
```

任何支持进行相等判断的类型都可以作为测试表达式的条件,包括 int,string,指针等.

```go
package main

import "fmt"

func main() {
	var num1 int = 7

	switch {
	    case num1 < 0:
		    fmt.Println("Number is negative")
	    case num1 > 0 && num1 < 10:
		    fmt.Println("Number is between 0 and 10")
	    default:
		    fmt.Println("Number is 10 or greater")
	}
}
```

输出：

	Number is between 0 and 10

## 5.swtich初始化语句

switch 语句的第三种形式是包含一个初始化语句：

```go
switch initialization {
	case val1:
		...
	case val2:
		...
	default:
		...
}
```

这种形式可以非常优雅地进行条件判断：

```go
switch result := calculate() {
	case result < 0:
		...
	case result > 0:
		...
	default:
		// 0
}
```

在下面这个代码片段中,变量 a 和 b 被平行初始化,然后作为判断条件：

```go
switch a, b := x[i], y[j] {
	case a < b: t = -1
	case a == b: t = 0
	case a > b: t = 1
}
```

switch 语句还可以被用于 type-switch 来判断某个 interface 变量中实际存储的变量类型.

## 6.没有表达式的 switch

switch 中的表达式是可选的,可以省略.如果省略表达式,则相当于 switch true,
这种情况下会将每一个 case 的表达式的求值结果与 true 做比较,如果相等,则执行相应的代码.

```go
package main

import (  
    "fmt"
)

func main() {  
    num := 75
    switch { // expression is omitted
    case num >= 0 && num <= 50:
        fmt.Println("num is greater than 0 and less than 50")
    case num >= 51 && num <= 100:
        fmt.Println("num is greater than 51 and less than 100")
    case num >= 101:
        fmt.Println("num is greater than 100")
    }

}
```
