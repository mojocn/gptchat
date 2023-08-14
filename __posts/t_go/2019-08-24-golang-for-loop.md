---
layout: post
title: Go教程:07-控制结构for循环loop
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,for循环-loop-break-continue-goto-nested
description:  Go语言教程,Golang教程,for-loop-break-continue-goto-nested,for循环是编程语言中一种循环语句,而循环语句由循环体及循环的判定条件两部分组成
permalink: /:categories/:title
coverage: golang_for_loop.png
date: 2019-08-24T18:22:05+08:00
---

for循环是编程语言中一种循环语句,而循环语句由循环体及循环的判定条件两部分组成,其表达式为：for（单次表达式;条件表达式;末尾循环体）{中间循环体;}.
循环语句是用来重复执行某一段代码.

for 是 Go 语言唯一的循环语句.Go 语言中并没有其他语言比如 C 语言中的 while 和 do while 循环.

## 1.for-loop循环

```go
for initialisation; condition; post {  
}
```

初始化语句只执行一次.循环初始化后,将检查循环条件.如果条件的计算结果为 true ,则 {} 内的循环体将执行,接着执行 post 语句.post 语句将在每次成功循环迭代后执行.在执行 post
语句后,条件将被再次检查.如果为 true, 则循环将继续执行,否则 for 循环将终止.（译注：这是典型的 for 循环三个表达式,第一个为初始化表达式或赋值语句;第二个为循环条件判定表达式;第三个为循环变量修正表达式,即此处的
post ）

这三个组成部分,即初始化,条件和 post 都是可选的.

```go
package main  
import "fmt"  
func main() {  
   for a := 0; a < 12; a++ {  
      fmt.Print(a,"\n")  
   }  
}  
```

## 2.for-nested嵌套

Go 语言允许用户在循环内使用循环.接下来我们将为大家介绍嵌套循环的使用.

```go
for [condition |  ( init; condition; increment ) | Range]
{
   for [condition |  ( init; condition; increment ) | Range]
   {
      statement(s);
   }
   statement(s);
}
```

以下实例使用循环嵌套来输出 2 到 100 间的素数：

```go
package main

import "fmt"

func main() {
   /* 定义局部变量 */
   var i, j int

   for i=2; i < 100; i++ {
      for j=2; j <= (i/j); j++ {
         if(i%j==0) {
            break; // 如果发现因子,则不是素数
         }
      }
      if(j > (i/j)) {
         fmt.Printf("%d  是素数\n", i);
      }
   }  
}
```

## 3.for-break

break 语句用于在完成正常执行之前突然终止 for 循环,之后程序将会在 for 循环下一行代码开始执行.

让我们写一个从 3 打印到 10 并且使用 break 跳出循环的程序.

```go
package main

import (  
    "fmt"
)

func main() {  
    for i := 3; i <= 20; i++ {
        if i > 10 {
            break //loop is terminated if i > 5
        }
        fmt.Printf("%d ", i)
    }
    fmt.Printf("\nline after for loop")
}
```

## 4.for-continue

continue 语句用来跳出 for 循环中当前循环.在 continue 语句后的所有的 for 循环语句都不会在本次循环中执行.循环体会在一下次循环中继续执行.

让我们写一个打印出 1 到 10 并且使用 continue 的程序.

```go
package main

import (  
    "fmt"
)

func main() {  
    for i := 1; i <= 10; i++ {
        if i%2 == 0 {
            continue
        }
        fmt.Printf("%d ", i)
    }
}
```

## 5.for-goto

Go 语言的 goto 语句可以无条件地转移到过程中指定的行.

goto 语句通常与条件语句配合使用.可用来实现条件转移, 构成循环,跳出循环体等功能.

但是,在结构化程序设计中一般不主张使用 goto 语句, 以免造成程序流程的混乱,使理解和调试程序都产生困难.

语法

```go
goto label;
..
.
label: statement;
```

示意图

![golang_goto](/assets/image/golang_goto.jpg)

在变量 a 等于 15 的时候跳过本次循环并回到循环的开始语句 LOOP 处：

```go
package main

import "fmt"

func main() {
   /* 定义局部变量 */
   var a int = 10

   /* 循环 */
   LOOP: for a < 20 {
      if a == 15 {
         /* 跳过迭代 */
         a = a + 1
         goto LOOP
      }
      fmt.Printf("a的值为 : %d\n", a)
      a++     
   }  
}
```
