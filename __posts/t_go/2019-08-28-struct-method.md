---
layout: post
title: Go教程:15-struct-method结构体和方法
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,struct-method结构体和方法,new结构体,递归struct,工厂方法struct
description:  Go语言教程,Golang教程,struct-method结构体和方法,new结构体,递归struct,工厂方法struct
permalink: /:categories/:title
coverage: golang_struct.jpg
date: 2019-08-28T17:40:54+08:00
---

## 1. struct 结构体

Go 通过类型别名（alias types）和结构体的形式支持用户自定义类型,或者叫定制类型.一个带属性的结构体试图表示一个现实世界中的实体.结构体是复合类型（composite
types）,当需要定义一个类型,它由一系列属性组成,每个属性都有自己的类型和值的时候,就应该使用结构体,它把数据聚集在一起.然后可以访问这些数据,就好像它是一个独立实体的一部分.结构体也是值类型,因此可以通过
new 函数来创建.

组成结构体类型的那些数据称为 字段（fields）.每个字段都有一个类型和一个名字;在一个结构体中,字段名字必须是唯一的.

```go
type identifier struct {
    field1 type1
    field2 type2
    ...
}
```

`type T struct {a, b int}` 也是合法的语法,它更适用于简单的结构体.

结构体里的字段都有 名字,像 field1,field2 等,如果字段在代码中从来也不会被用到,那么可以命名它为 _.

结构体的字段可以是任何类型,甚至是结构体本身,也可以是函数或者接口.

```go
var s T
s.a = 5
s.b = 8
```

## 2. 使用new

使用 ***new 函数给一个新的结构体变量分配内存,它返回指向已分配内存的指针***：`var t *T = new(T)`,
如果需要可以把这条语句放在不同的行（比如定义是包范围的,但是分配却没有必要在开始就做）.

写这条语句的惯用方法是：`t := new(T)`,变量 t 是一个指向 T的指针,此时结构体字段的值是它们所属类型的零值.

声明 `var t T` 也会给 `t` 分配内存,并零值化内存,但是这个时候 `t` 是类型`T`.在这两种方式中,t 通常被称做类型 T 的一个实例（instance）或对象（object）.

```go
package main
import "fmt"

type struct1 struct {
    i1  int
    f1  float32
    str string
}

func main() {
    ms := new(struct1)
    ms.i1 = 10
    ms.f1 = 15.5
    ms.str= "Chris"

    fmt.Printf("The int is: %d\n", ms.i1)
    fmt.Printf("The float is: %f\n", ms.f1)
    fmt.Printf("The string is: %s\n", ms.str)
    fmt.Println(ms)
}
```

## 3. 递归结构体recursive struct

结构体类型可以通过引用自身来定义.这在定义链表或二叉树的元素（通常叫节点）时特别有用,此时节点包含指向临近节点的链接（地址）.如下所示,链表中的 su,树中的 ri 和 le 分别是指向别的节点的指针.

### 3.1 链表

```go
type Node struct {
    data    float64
    su      *Node
}
```

### 3.2 双向链表

```go
type Node struct {
    pr      *Node
    data    float64
    su      *Node
}
```

### 3.3 二叉树

```go
type Tree strcut {
    le      *Tree
    data    float64
    ri      *Tree
}
```

## 4. 结构体转换

Go 中的类型转换遵循严格的规则.当为结构体定义了一个 alias 类型时,
此结构体类型和它的 alias 类型都有相同的底层类型,它们可以如下代码那样互相转换,同时需要注意其中非法赋值或转换引起的编译错误.

```go
package main
import "fmt"

type number struct {
    f float32
}

type nr number   // alias type

func main() {
    a := number{5.0}
    b := nr{5.0}
    // var i float32 = b   // compile-error: cannot use b (type nr) as type float32 in assignment
    // var i = float32(b)  // compile-error: cannot convert b (type nr) to type float32
    // var c number = b    // compile-error: cannot use b (type nr) as type number in assignment
    // needs a conversion:
    var c = number(b)
    fmt.Println(a, b, c)
}
```

## 5. 匿名字段和struct嵌套

struct中的字段可以不用给名称,这时称为匿名字段.匿名字段的名称强制和类型相同.

```go
package main

import (
    "fmt"
)

type inner struct {
    in1 int
    in2 int
}

type outer struct {
    ou1 int
    ou2 int
    int
    inner
}

func main() {
    o := new(outer)
    o.ou1 = 1
    o.ou2 = 2
    o.int = 3
    o.in1 = 4
    o.in2 = 5
    fmt.Println(o.ou1)  // 1
    fmt.Println(o.ou2)  // 2
    fmt.Println(o.int)  // 3
    fmt.Println(o.in1)  // 4
    fmt.Println(o.in2)  // 5
```

## 6. 嵌套struct的名称冲突问题

假如外部struct中的字段名和内部struct的字段名相同,会如何？

有以下两个名称冲突的规则：

1. 外部struct覆盖内部struct的同名字段,同名方法
2. 同级别的struct出现同名字段,方法将报错

第一个规则使得Go struct能够实现面向对象中的重写(override),而且可以重写字段,重写方法.第二个规则使得同名属性不会出现歧义.

## 7. 结构体工厂

Go 语言不支持面向对象编程语言中那样的构造子方法,但是可以很容易的在 Go 中实现 “构造子工厂”方法.为了方便通常会为类型定义一个工厂,按惯例,工厂的名字以 new 或 New 开头.假设定义了如下的
File 结构体类型：

```go
type File struct {
    fd      int     // 文件描述符
    name    string  // 文件名
}
```

下面是这个结构体类型对应的工厂方法,它返回一个指向结构体实例的指针：

```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }

    return &File{fd, name}
}
```

如果 File 是一个结构体类型,那么***表达式 new(File) 和 &File{} 是等价的***

***强制使用工厂方法***

禁止使用 new 函数,强制用户使用工厂方法,从而使类型变成私有的,就像在面向对象语言中那样.

```go
type matrix struct {
    ...
}

func NewMatrix(params) *matrix {
    m := new(matrix) // 初始化 m
    return m
}
```

在其他包里使用工厂方法：

```go
package main
import "matrix"
...
wrong := new(matrix.matrix)     // 编译失败（matrix 是私有的）
right := matrix.NewMatrix(...)  // 实例化 matrix 的唯一方式
```

## 8. 结构体传值or传指针

Go函数给参数传递值的时候是以复制的方式进行的.复制传值时,如果函数的参数是一个struct对象,将直接复制整个数据结构的副本传递给函数,这有两个问题：

函数内部无法修改传递给函数的原始数据结构,它修改的只是原始数据结构拷贝后的副本,
如果传递的原始数据结构很大,完整地复制出一个副本开销并不小,所以,***如果条件允许,应当给需要struct实例作为参数的函数传struct的指针***

## 9. 结构体方法Methods of struct

结构体中可以包含属性,同样结构体中可以有方法.
方法的定义和普通函数定义相似,唯一的区别是方法需要 attach to 或者说 associated with （关联）一个结构体.

方法其实就是一个函数,在 func 这个关键字和方法名中间加入了一个特殊的接收器类型.接收器可以是结构体类型或者是非结构体类型.接收器是可以在方法的内部访问的.

```go
func (t Type) methodName(parameter list) {
}
```

- 许多面向对象语言,都有一个 this 或者 self 隐式的只想当前的实例,但在 Go 中,并不存这样的概念.当定义方法是,都会给定一个变量名
- 对于方法而言,使用引用和值并没有太大的区别.Go 本身会自动识别,并且完成转换.

### 9.1 匿名字段的函数

下面的代码是前面 House 和 Kitchen 的例子.由于匿名字段,允许外围结构体直接访问内部结构体的字段,对于方法同样适用.
当前,Kitchen 有一个方法 totalForksAndKnives(),所以 House 可以直接访问 House.totalForksAndKnives().

```go
package main

import "fmt"

type Kitchen struct {
    numOfForks int
    numOfKnives int
}

func(k Kitchen) totalForksAndKnives() int {
    return k.numOfForks + k.numOfKnives
}

type House struct {
    Kitchen //anonymous field
}

func main() {
    h := House{Kitchen{4, 4}} //the kitchen has 4 forks and 4 knives
    fmt.Println("Sum of forks and knives in house: ", h.totalForksAndKnives())  //called on House even though the method is associated with Kitchen
}
```