---
layout: post
title: Go教程:04-包package和import
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,package导入和import的使用方法
description:  Go语言教程,Golang教程,数据类型
permalink: /:categories/:title
coverage: golang_package.jpg
ref_: 'https://www.javatpoint.com/go-tutorial'
---

## 1.什么是package

package用于对我们的程序进行***分类***,以便易于维护.
每个go文件都属于某个包. 每个Go应用程序必须具有`main`包,
以便可以编译它. 应用程序可以包含不同的包.
许多不同的`.go`文件可以属于`package`  `main`.
我们保存Go程序为任何名称,但它必须有`package`  `main`.
包名称应以小写字母书写. 如果更改并重新编译package,则必须重新编译使用此package的所有代码程序！

## 2.package变量方法的访问和可导特性

标识符可以是变量,常量,函数,类型或结构字段.
我们可以用小写或大写字母声明标识符.
如果我们以小写字母声明标识符,它将仅在包中可见private.
但是如果我们用大写字母声明包,它将在包内外可见,也称为export/public.
点`.`操作符用于访问标识符,例如 `pack.Age`其中`pack`是包名称,`Age`是标识符.

## 3.package导入方式

### 3.1.常规方式

常规方式,通过包名`lib`调用`sayHello`方法.`lib.SayHello()`

`import “github.com/libragen/felix/lib”`

### 3.2.别名导入

- 包名过于复杂或者意思不明确.
  如使用 mywebapp/libs/mongodb/db 包时,不确定此 db 是哪种类型,故可以使用别名来明确含义：
  `import mongo "mywebapp/libs/mongodb/db"`
- 包名和其他包冲突
  世界之大,变化无穷.现在我们有库 db ,但没过几年出现了另一种DB,叫云DB.但包名是一样的,分别用别名区分：

```go
import mongo "mywebapp/libs/mongodb/db"
import ydbgo "mywebapp/libs/yundb/db"
```

### 3.3.省略package名导入

这里的点.符号表示,对包 lib 的调用直接省略包名,您我以后就是一家人,不分彼此,您的东西就像我就的一样,随便用.

```go
package main
import . "github.com/libragen/felix/lib"
func main() {
	SayHello()
}
```

### 3.4.执行初始化工作导入

`improt _ “github.com/libragen/felix/lib”`
这里说的是我还不准备现在使用您们家的东西,但得提前告诉一声.您先做好准备,先准备好饭菜,等我来就行,也有可能我压根就不来.

```go
package main
import _ "github.com/libragen/felix/lib"
func main() {
	 
}
```

特殊符号“_” 仅仅会导致 lib 执行初始化工作,如初始化全局变量,调用 init 函数.

## 4.package和文件的关系

***一个文件夹下只能有一个package.***

import后面的其实是`GOPATH`开始的相对目录路径,包括最后一段.

- 但由于一个目录下只能有一个`package`,所以`import`一个路径就等于是`import`了这个路径下的包.
- 注意,这里指的是“直接包含”的go文件.
  如果有子目录,那么子目录的父目录是完全两个包.
- 比如您实现了一个计算器`package`,名叫calc,位于calc目录下;
  但又想给别人一个使用范例,于是在`calc`下可以建个`example`子目录（`calc/example/`）,
  这个子目录里有个`example.go（calc/example/example.go）`.
  此时,`example.go`可以是main包,里面还可以有个main函数.

***一个`package`的文件不能在多个文件夹下.***

- 如果多个文件夹下有重名的`package`,它们其实是彼此无关的package.
- 如果一个`go`文件需要同时使用不同目录下的同名`package`,需要在`import`这些目录时为每个目录指定一个package的别名.