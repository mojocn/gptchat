---
layout: post
title: Go教程:08-函数function
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,函数function,不定参数,指针参数,多返回值
description:  Go语言教程,Golang教程,函数function,不定参数,指针参数,多返回值
permalink: /:categories/:title
coverage: golang_function.png
date: 2019-08-26T11:01:54+08:00
---

函数是一块执行特定任务的代码.一个函数是在输入源基础上,通过执行一系列的算法,生成预期的输出.
函数是基本的代码块,用于执行一个任务.Go 语言最少有个 main() 函数.您可以通过函数来划分不同功能,
逻辑上每个函数执行的是指定的任务.函数声明告诉了编译器函数的名称,返回类型,和参数.

## 1. 函数定义

Go 语言函数定义格式如下：

```
func function_name( [parameter list] ) [return_types] {
   函数体
}
```

函数定义解析：

- func：函数由 func 开始声明
- function_name：函数名称,函数名和参数列表一起构成了函数签名.
- parameter list：参数列表,参数就像一个占位符,当函数被调用时,您可以将值传递给参数,这个值被称为实际参数.参数列表指定的是参数类型,顺序,及参数个数.参数是可选的,也就是说函数也可以不包含参数.
- return_types：返回类型,函数返回一列值.return_types 是该列值的数据类型.有些功能不需要返回值,这种情况下 return_types 不是必须的.
- 函数体：函数定义的代码集合.

```go
/* 函数返回两个数的最大值 */
func max(num1, num2 int) int {
   /* 声明局部变量 */
   var result int

   if (num1 > num2) {
      result = num1
   } else {
      result = num2
   }
   return result 
}
```

## 2. 函数function多返回值

Go 语言支持一个函数可以有多个返回值.我们来写个以矩形的长和宽为输入参数,计算并返回矩形面积和周长的函数 rectProps.矩形的面积是长度和宽度的乘积, 周长是长度和宽度之和的两倍.即：

```go
package main

import (  
    "fmt"
)

func rectProps(length, width float64)(float64, float64) {  
    var area = length * width
    var perimeter = (length + width) * 2
    return area, perimeter
}

func main() {  
    area, perimeter := rectProps(10.8, 5.6)
    fmt.Printf("Area %f Perimeter %f", area, perimeter) 
}
```

## 3. 函数function命名返回值

从函数中可以返回一个命名值.一旦命名了返回值,可以认为这些值在函数第一行就被声明为变量了.
上面的 rectProps 函数也可用这个方式写成：

```go
func rectProps(length, width float64)(area, perimeter float64) {  
    area = length * width
    perimeter = (length + width) * 2
    return // 不需要明确指定返回值,默认返回 area, perimeter 的值
}
```

## 4. 函数function空白符_

_ 在 Go 中被用作空白符,可以用作表示任何类型的任何值.

我们继续以 rectProps 函数为例,该函数计算的是面积和周长.假使我们只需要计算面积,而并不关心周长的计算结果,该怎么调用这个函数呢？这时,空白符 _ 就上场了.

下面的程序我们只用到了函数 rectProps 的一个返回值 area

```go
package main

import (  
    "fmt"
)

func rectProps(length, width float64) (float64, float64) {  
    var area = length * width
    var perimeter = (length + width) * 2
    return area, perimeter
}
func main() {  
    area, _ := rectProps(10.8, 5.6) // 返回值周长被丢弃
    fmt.Printf("Area %f ", area)
}
```

## 5. 函数function改变外部变量（参数有指针outside variable）

传递指针给函数不但可以节省内存（因为没有复制变量的值）,而且赋予了函数直接修改外部变量的能力,所以被修改的变量不再需要使用 return 返回.如下的例子,reply 是一个指向 int
变量的指针,通过这个指针,我们在函数内修改了这个 int 变量的数值.

```go
package main

import (
    "fmt"
)

// this function changes reply:
func Multiply(a, b int, reply *int) {
    *reply = a * b
}

func main() {
    n := 0
    reply := &n
    Multiply(10, 5, reply)
    fmt.Println("Multiply:", *reply) // Multiply: 50
}
```

## 6. 函数function传递变长参数

如果函数的最后一个参数是采用 ...type 的形式,那么这个函数就可以处理一个变长的参数,这个长度可以为 0,这样的函数称为变参函数.`func myFunc(a, b, arg ...int) {}`

这个函数接受一个类似某个类型的 slice 的参数,该参数可以通过第节中提到的 for 循环结构迭代.

```go
func Greeting(prefix string, who ...string)
Greeting("hello:", "Joe", "Anna", "Eileen")
```

**如果参数被存储在一个 slice 类型的变量 slice 中,则可以通过 slice... 的形式来传递参数,调用变参函数.**

```go
package main

import "fmt"

func main() {
	x := min(1, 3, 2, 0)
	fmt.Printf("The minimum is: %d\n", x)
	slice := []int{7,9,3,5,1}
	x = min(slice...)
	fmt.Printf("The minimum in the slice is: %d", x)
}

func min(s ...int) int {
	if len(s)==0 {
		return 0
	}
	min := s[0]
	for _, v := range s {
		if v < min {
			min = v
		}
	}
	return min
}
```

## 7 函数function匿名函数和闭包closure

什么是闭包？闭包是由函数和与其相关的引用环境组合而成的实体.
匿名函数：顾名思义就是没有名字的函数.很多语言都有如：java,js,php等,其中js最钟情.匿名函数最大的用途是来模拟块级作用域,避免数据污染的.
Go 语言支持匿名函数,可作为闭包.匿名函数是一个"内联"语句或表达式.匿名函数的优越性在于可以直接使用函数内的变量,不必申明.
Go里有函数类型的变量,这样,虽然不能在一个函数里直接声明另一个函数,但是可以在一个函数中声明一个匿名函数类型的变量,此时的匿名函数称为闭包（closure）.

```go
package main

import "fmt"

func ExFunc(n int) func() {
    sum := n
    a := func() { // 把匿名函数作为值赋给变量a (Go 不允许函数嵌套, 然而您可以利用匿名函数实现函数嵌套)
        fmt.Println(sum + 1) // 调用本函数外的变量
    } // 这里没有()匿名函数不会马上执行
    return a
    //  或者直接 return 匿名函数
    //  return func() { //直接在返回处的匿名函数
    //    fmt.Println(sum + 1)
    //  }
}

func main() {
    myFunc := ExFunc(10)
    myFunc() // 这里输出11

    myAnotherFunc := ExFunc(20)
    myAnotherFunc() // 这里输出21

    myFunc()  // 这里输出11
    myAnotherFunc()  // 这里输出21
}
```

结论

1. ***内函数对外函数 的变量的修改,是对变量的引用***
2. ***变量被引用后,它所在的函数结束,这变量也不会马上被烧毁***

闭包函数出现的条件：

1. ***被嵌套的函数引用到非本函数的外部变量,而且这外部变量不是“全局变量”***
2. ***嵌套的函数被独立了出来(被父函数返回或赋值 变成了独立的个体),而被引用的变量所在的父函数已结束.***

## 8. 函数function递归recursion

递归,就是在运行的过程中调用自己.

```go
func recursion() {
   recursion() /* 函数调用自身 */
}

func main() {
   recursion()
}
```

### 8.1 recursion递归示例:阶乘

```go
package main

import "fmt"

func Factorial(n uint64)(result uint64) {
    if (n > 0) {
        result = n * Factorial(n-1)
        return result
    }
    return 1
}

func main() {  
    var i int = 15
    fmt.Printf("%d 的阶乘是 %d\n", i, Factorial(uint64(i)))
}
```

### 8.2 recursion递归示例:斐波那契数列

```go
package main

import "fmt"

func fibonacci(n int) int {
  if n < 2 {
   return n
  }
  return fibonacci(n-2) + fibonacci(n-1)
}

func main() {
    var i int
    for i = 0; i < 10; i++ {
       fmt.Printf("%d\t", fibonacci(i))
    }
}
```

## 9. 内置函数build-in function

Go 语言拥有一些不需要进行导入操作就可以使用的内置函数.它们有时可以针对不同的类型进行操作,例如：len,cap 和 append,或必须用于系统级的操作,例如：panic.因此,它们需要直接获得编译器的支持.

以下是一个简单的列表,我们会在后面的章节中对它们进行逐个深入的讲解.

| 名称                | 说明                                                                                                                                                                                                                                                                                                  |
|-------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| close             | 用于管道通信                                                                                                                                                                                                                                                                                              |
| len,cap           | len 用于返回某个类型的长度或数量（字符串,数组,切片,map 和管道）;cap 是容量的意思,用于返回某个类型的最大容量（只能用于切片和 map）                                                                                                                                                                                                                         |
| new,make          | new 和 make 均是用于分配内存：new 用于值类型和用户定义的类型,如自定义结构,make 用于内置引用类型（切片,map 和管道）.它们的用法就像是函数,但是将类型作为参数：new(type),make(type).new(T) 分配类型 T 的零值并返回其地址,也就是指向类型 T 的指针（详见第 10.1 节）.它也可以被用于基本类型：`v := new(int)`.make(T) 返回类型 T 的初始化之后的值,因此它比 new 进行更多的工作（详见第 7.2.3/4 节,第 8.1.1 节和第 14.2.1 节）**new() 是一个函数,不要忘记它的括号** |
| copy,append       | 用于复制和连接切片                                                                                                                                                                                                                                                                                           |
| panic,recover     | 两者均用于错误处理机制                                                                                                                                                                                                                                                                                         |
| print,println     | 底层打印函数,在部署环境中建议使用 fmt 包                                                                                                                                                                                                                                                                             |
| complex,real imag | 用于创建和操作复数                                                                                                                                                                                                                                                                                           |


