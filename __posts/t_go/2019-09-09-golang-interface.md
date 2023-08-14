---
layout: post
title: Go教程:20-interface接口
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,interface接口
description:  Go语言教程,Golang教程,interface接口
permalink: /:categories/:title
coverage: golang_interface.jpg
date: 2019-09-09T15:02:54+08:00
---

## 1. 什么是interface

Go 语言不是一种 “传统” 的面向对象编程语言：它里面没有类和继承的概念,

Go 语言里有非常灵活的 接口 概念,通过它可以实现很多***面向对象的特性***,
***接口提供了一种方式来说明对象的行为***,

- 接口定义了一组方法（方法集）,但是这些方法不包含（实现）代码：
- 接口方法没有被实现（它们是抽象的）,
- 接口里也不能包含变量,

interface定义语法

```go
type Interfacer interface {
    Method1(param_list) return_type
    Method2(param_list) return_type
    ...
}
```

### 1.1 Golang interface 惯例

- 命名惯例:接口的名字由方法名加 [e]r 后缀组成,
  例如 Printer,Reader,Writer,Logger,Converter 等等
- Go 语言中的接口都很简短,通常它们会包含 0 个,最多 3 个方法,
- Go 语言中接口可以有值,一个接口类型的变量或一个 接口值
- 类型不需要显式声明它实现了某个接口：接口被隐式地实现,多个类型可以实现同一个接口,
- 一个类型可以实现多个接口,

### 1.2 多态Go语言实现

***多态是面向对象编程中一个广为人知的概念***：
根据当前的类型选择正确的方法,
或者说：同一种类型在不同的实例上似乎表现出不同的行为.

```go
package main

import "fmt"

type Shaper interface {
	Area() float32
}

type Square struct {
	side float32
}

func (sq *Square) Area() float32 {
	return sq.side * sq.side
}

type Rectangle struct {
	length, width float32
}

func (r Rectangle) Area() float32 {
	return r.length * r.width
}

func main() {

	r := Rectangle{5, 3} // Area() of Rectangle needs a value
	q := &Square{5}      // Area() of Square needs a pointer
	// shapes := []Shaper{Shaper(r), Shaper(q)}
	// or shorter
	shapes := []Shaper{r, q}
	fmt.Println("Looping through shapes for area ...")
	for n, _ := range shapes {
		fmt.Println("Shape details: ", shapes[n])
		fmt.Println("Area of this shape is: ", shapes[n].Area())
	}
}
```

### 1.3 接口interface如何产生 更干净,更简单 及 更具有扩展性 的代码

下面是一个更具体的例子：有两个类型 stockPosition 和 car,它们都有一个 getValue() 方法,我们可以定义一个具有此方法的接口 valuable,
接着定义一个使用 valuable 类型作为参数的函数 showValue(),所有实现了 valuable 接口的类型都可以用这个函数,

```go
package main

import "fmt"

type stockPosition struct {
	ticker     string
	sharePrice float32
	count      float32
}

/* method to determine the value of a stock position */
func (s stockPosition) getValue() float32 {
	return s.sharePrice * s.count
}

type car struct {
	make  string
	model string
	price float32
}

/* method to determine the value of a car */
func (c car) getValue() float32 {
	return c.price
}

/* contract that defines different things that have value */
type valuable interface {
	getValue() float32
}

func showValue(asset valuable) {
	fmt.Printf("Value of the asset is %f\n", asset.getValue())
}

func main() {
	var o valuable = stockPosition{"GOOG", 577.20, 4}
	showValue(o)
	o = car{"BMW", "M3", 66500}
	showValue(o)
}
```

## 2. interface 嵌套

一个接口可以包含一个或多个其他的接口,这相当于直接将这些内嵌接口的方法列举在外层接口中一样,

比如接口 File 包含了 ReadWrite 和 Lock 的所有方法,它还额外有一个 Close() 方法,

```go
type ReadWrite interface {
    Read(b Buffer) bool
    Write(b Buffer) bool
}

type Lock interface {
    Lock()
    Unlock()
}

type File interface {
    ReadWrite
    Lock
    Close()
}
```

## 3. interface 类型断言

一个接口类型的变量 varI 中可以包含任何类型的值,必须有一种方式来检测它的 动态 类型,即运行时在变量中存储的值的实际类型,
正确安全的类型断言的形势如下:

```go
if v, ok := varI.(T); ok {  // checked type assertion
    Process(v)
    return
}
// varI is not of type T
```

如果转换合法,v 是 varI 转换到类型 T 的值,ok 会是 true;否则 v 是类型 T 的零值,ok 是 false,也没有运行时错误发生,

### 3.1 测试一个值是否实现了某个接口

假定 v 是一个值,然后我们想测试它是否实现了 Stringer 接口,可以这样做:

```go
type Stringer interface {
    String() string
}

if sv, ok := v.(Stringer); ok {
    fmt.Printf("v implements String(): %s\n", sv.String()) // note: sv, not v
}
```

## 4. 类型判断: type-switch

接口变量的类型也可以使用一种特殊形式的 switch 来检测：type-switch.

```go
switch t := areaIntf.(type) {
case *Square:
	fmt.Printf("Type Square %T with value %v\n", t, t)
case *Circle:
	fmt.Printf("Type Circle %T with value %v\n", t, t)
case nil:
	fmt.Printf("nil value: nothing to check?\n")
default:
	fmt.Printf("Unexpected type %T\n", t)
}
```

可以用 type-switch 进行运行时类型分析,但是在 type-switch 不允许有 fallthrough ,嵌套嵌套

## 5. 空接口interface{}

空接口或者最小接口 不包含任何方法,它对实现不做任何要求.
可以给一个空接口类型的变量 var val interface {} 赋任何类型的值,

```go
package main
import "fmt"

var i = 5
var str = "ABC"

type Person struct {
	name string
	age  int
}

type Any interface{}

func main() {
	var val Any
	val = 5
	fmt.Printf("val has the value: %v\n", val)
	val = str
	fmt.Printf("val has the value: %v\n", val)
	pers1 := new(Person)
	pers1.name = "Rob Pike"
	pers1.age = 55
	val = pers1
	fmt.Printf("val has the value: %v\n", val)
	switch t := val.(type) {
	case int:
		fmt.Printf("Type int %T\n", t)
	case string:
		fmt.Printf("Type string %T\n", t)
	case bool:
		fmt.Printf("Type boolean %T\n", t)
	case *Person:
		fmt.Printf("Type pointer to Person %T\n", t)
	default:
		fmt.Printf("Unexpected type %T", t)
	}
}

```
