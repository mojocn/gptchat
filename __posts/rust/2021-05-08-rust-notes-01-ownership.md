---
layout: post 
title: "Rust笔记:01-Ownership所有权"
category: Rust 
tags: Rust笔记 
keywords: 'rust,ownership,copy,move' 
description: 'Rust 的核心功能(之一)是 所有权(ownership).虽然该功能很容易解释,但它对语言的其他部分有着深刻的影响' 
coverage: rust-move-copy-borrow.png
permalink: /:categories/:title 
date: 2020-05-08T15:58:54+08:00
---

## 1.什么是 Ownership ？

Rust 的核心功能(之一)是 Ownership.

所有运行的程序都必须管理其使用计算机memory的方式.

* 一些语言(Go, Java)中具有垃圾回收机制,在程序运行时不断地寻找不再使用的memory；
* 一些语言(C C++)中,程序员必须亲自分配和释放memory.
* 在另一些语言(Swift Objective-C)中,使用引用计数来释放memory.
* Rust 则选择了第4种方式:通过*** Ownership 系统***管理memory,编译器在编译时会根据一系列的规则进行检查.在运行时, Ownership 系统的任何功能都不会减慢程序.

## 2.Stack & Heap

在很多语言中,你并不需要经常考虑到Stack与Heap.
不过在像 Rust 这样的系统编程语言中,值是位于Stack上还是Heap上在更大程度上影响了语言的行为以及为何必须做出这样的抉择.

Stack和Heap都是代码在运行时可供使用的memory,但是它们的结构不同.

- Stack以放入值的顺序存储值并以相反顺序取出值.
- Stack中的所有数据都必须占用***已知且固定的大小***.
- 在编译时***大小未知或大小可能变化的数据***,要改为存储在***Heap***上.
- Heap是缺乏组织的:当向Heap放入数据时,你要请求一定大小的空间.
- OS在Heap的某处找到一块足够大的空位,把它标记为used,并返回一个表示该位置地址的 pointer.
- 这个过程称作 在Heap上分配memory(allocating on the heap),有时简称为 “分配”(allocating).
  将数据推入Stack中并不被认为是分配.因为Pointer的大小是已知并且固定的,你可以将Pointer存储在Stack上,不过当需要实际数据时,必须访问Pointer.

入Stack比在Heap上分配memory要快,因为(入Stack时)OS无需为存储新数据去搜索memory空间；其位置总是在Stack顶.
相比之下,在Heap上分配memory则需要更多的工作,这是因为OS必须首先找到一块足够存放数据的memory空间,并接着做一些记录为下一次分配做准备.

访问Heap上的数据比访问Stack上的数据慢,因为必须通过Pointer来访问.现代处理器在memory中跳转越少就越快(缓存).

当你的代码调用一个 Function 时,传递给 Function 的值(包括可能指向Heap上数据的Pointer)和 Function 的局部 Variable 被压入Stack中.当 Function 结束时,这些值被移出Stack.

Ownership 的存在就是为了管理Heap数据, Ownership 系统要处理:.

- 跟踪哪部分代码正在使用Heap上的哪些数据
- 最大限度的减少Heap上的重复数据的数量
- 清理Heap上不再使用的数据确保不会耗尽空间

## 3 Ownership Rule

Ownership 的规则:

- Rust 中的每一个值都有一个被称为其 所有者(owner)的 Variable .
- 值在任一时刻有且只有一个所有者.
- 当所有者( Variable )离开 scope,这个值将被丢弃.

### 3.1 Variable scope

作用域(scope)是一个项(item)在程序中有效的范围.假设有这样一个 Variable :

```
{                      // s 在这里无效, 它尚未声明
    let s = "hello";   // 从此处起,s 是有效的
    // 使用 s
}                      // 此 scope已结束,s 不再有效
```

#### String  Type

前面介绍的 Type 都是存储在Stack上的并且当离开 scope时被移出Stack,
不过我们需要寻找一个存储在Heap上的数据来探索 Rust 是如何知道该在何时清理数据的.

这里使用 String 作为例子,并专注于 String 与 Ownership 相关的部分.

String 这个 Type 被分配到Heap上. `let s = String::from("hello");` 可以修改此类字符串:

``` 
let mut s = String::from("hello");
s.push_str(", world!"); // push_str() 在字符串后追加字面值
println!("{}", s); // 将打印 `hello, world!`
```

那么这里有什么区别呢？为什么 String 可变而字面值却不行呢？区别在于两个 Type 对memory的处理上.

#### memory与分配

就字符串字面值来说,我们在编译时就知道其内容,所以文本被直接硬编码进最终的可执行文件中.这使得字符串字面值快速且高效.
不过这些特性都只得益于字符串字面值的不可变性.
不幸的是,我们不能为了每一个在编译时大小未知的文本而将一块memory放入二进制文件中,并且它的大小还可能随着程序运行而改变.

对于 String Type,为了支持一个可变,可增长的文本片段,需要在Heap上分配一块在编译时未知大小的memory来存放内容.这意味着:必须在运行时向OS请求memory.

需要一个当我们处理完 String 时将memory返回给OS的方法.
第一部分由我们完成:当调用 String::from 时,它的实现 (implementation) 请求其所需的memory.这在编程语言中是非常通用的.
然而,第二部分实现起来就各有区别了.
在有垃圾回收(garbage collector,GC)的语言中, GC 记录并清除不再使用的memory,而我们并不需要关心它.

Rust 采取了一个不同的策略: `memory在拥有它的 Variable 离开 scope后就被自动释放`.
下面是示例中scope例子的一个使用 String 而不是字符串字面值的版本:

```
{
  let s = String::from("hello"); // 从此处起,s 是有效的
  // 使用 s
}                                  // 此 scope已结束,
// s 不再有效
```

注意:在 C++ 中,这种 item 在生命周期结束时释放资源的模式有时被称作 资源获取即初始化(Resource Acquisition Is Initialization (RAII)).
如果你使用过 RAII 模式的话应该对 Rust 的 drop Function 并不陌生.

这个模式对编写 Rust 代码的方式有着深远的影响.现在它看起来很简单,不过在更复杂的场景下代码的行为可能是不可预测的,比如当有多个 Variable 使用在Heap上分配的memory时.现在让我们探索一些这样的场景.

#### Variable 与数据交互的方式(一):Move

Rust 中的多个 Variable 可以采用一种独特的方式与同一数据交互. stack 值Copy

```
let x = 5;
let y = x;
```

heap 指针Copy,s1 and s2 pointing to the same value

```
let s1 = String::from("hello");
let s2 = s1;
```

如果你在其他语言中听说过术语 浅Copy(shallow copy)和 深Copy(deep copy),那么CopyPointer、长度和容量而不Copy数据可能听起来像浅Copy.
不过因为 Rust 同时使第一个 Variable 无效了,这个操作被称为 Move(move),而不是浅Copy.
上面的例子可以解读为 s1 被 Move 到了 s2 中.

这里还隐含了一个设计选择: ***Rust 永远也不会自动创建数据的 “深Copy”.***

### 3.2  Variable 与数据交互:clone

如果我们确实需要深度 Copy String 中 Heap 上的数据,而不仅仅是Stack上的数据,可以使用一个叫做`clone`的通用Function.

这是一个实际使用 clone 方法的例子:

``` 
let s1 = String::from("hello");
let s2 = s1.clone();
println!("s1 = {}, s2 = {}", s1, s2);
```

当出现 clone 调用时,你知道一些特定的代码被执行,而且这些代码可能相当消耗资源.你很容易察觉到一些不寻常的事情正在发生.

### 3.3 只在Stack上的数据:Copy

原因是像整型这样的在编译时已知大小的 Type 被整个存储在Stack上,所以Copy其实际的值是快速的.这意味着没有理由在创建 Variable y 后使 x 无效.
换句话说,这里没有深浅Copy的区别,所以这里调用 clone 并不会与通常的浅Copy有什么不同,我们可以不用管它.

Rust 有一个叫做 Copy trait 的特殊注解,可以用在类似整型这样的存储在Stack上的 Type 上.
如果一个 Type 拥有 Copy trait,一个旧的 Variable 在将其赋值给其他 Variable 后仍然可用.

***Rust 不允许自身或其任何部分实现了 Drop trait 的 Type 使用 Copy trait.***
如果我们对其值离开 scope时需要特殊处理的 Type 使用 Copy 注解,将会出现一个编译时错误.

要学习如何为你的 Type 增加 Copy 注解,请阅读附录 C 中的 “可派生的 trait”.

***任何简单标量值的组合可以是 Copy 的***,不需要分配 memory 或某种形式资源的 Type 是 Copy 的.如下是一些 Copy 的 Type:

- 所有整数 Type ,比如 u32.
- 布尔 Type ,bool,它的值是 true 和 false.
- 所有浮点数 Type ,比如 f64.
- 字符 Type ,char.
- 元组,当且仅当其包含的 Type 也都是 Copy 的时候.比如,(i32, i32) 是 Copy 的,但 (i32, String) 就不是.

## 4. Ownership 与 Function

将值传递给 Function 在语义上与给 Variable 赋值相似.
向 Function 传递值可能会Move or Copy,就像赋值语句一样.
示例 使用注释展示 Variable 何时进入和离开 scope:

文件名: src/main.rs

```
fn main() {
    let s = String::from("hello");  // s 进入 scope
    takes_ownership(s);             // s 的值Move到 Function 里 ...
                                    // ... 所以到这里不再有效
    let x = 5;                      // x 进入 scope
    makes_copy(x);                  // x 应该Move Function 里,
                                    // 但 i32 是 Copy 的,所以在后面可继续使用 x
} // 这里, x 先移出了 scope,然后是 s.但因为 s 的值已被移走,
// 所以不会有特殊操作

fn takes_ownership(some_string: String) { // some_string 进入 scope
    println!("{}", some_string);
} // 这里,some_string 移出 scope并调用 `drop` 方法.占用的memory被释放

fn makes_copy(some_integer: i32) { // some_integer 进入 scope
    println!("{}", some_integer);
} // 这里,some_integer 移出 scope.不会有特殊操作
```

## 5. 返回值与 scope

返回值也可以转移 Ownership.

文件名: src/main.rs

```
fn main() {
    let s1 = gives_ownership();         // gives_ownership 将返回值
    // 移给 s1

    let s2 = String::from("hello");     // s2 进入 scope

    let s3 = takes_and_gives_back(s2);  // s2 被Move到
                                        // takes_and_gives_back 中,
                                        // 它也将返回值移给 s3
} // 这里, s3 移出 scope并被丢弃.s2 也移出 scope,但已被移走,
// 所以什么也不会发生.s1 移出 scope并被丢弃

fn gives_ownership() -> String {             // gives_ownership 将返回值Move给
// 调用它的 Function 

    let some_string = String::from("hello"); // some_string 进入 scope.

    some_string                              // 返回 some_string 并移出给调用的 Function 
}

// takes_and_gives_back 将传入字符串并返回该值
fn takes_and_gives_back(a_string: String) -> String { // a_string 进入 scope

    a_string  // 返回 a_string 并移出给调用的 Function 
}
```

Variable 的 Ownership 总是遵循相同的模式:
将值赋给另一个 Variable 时Move它.当持有Heap中数据值的 Variable 离开 scope时,其值将通过 drop 被清理掉,除非数据被Move为另一个 Variable 所有.

在每一个 Function 中都获取 Ownership 并接着返回 Ownership 有些啰嗦.如果我们想要 Function 使用一个值但不获取 Ownership 该怎么办呢？
如果我们还要接着使用它的话,每次都传进去再返回来就有点烦人了,除此之外,我们也可能想返回 Function 体中产生的一些数据.

文件名: src/main.rs

```
fn main() {
    let s1 = String::from("hello");

    let (s2, len) = calculate_length(s1);

    println!("The length of '{}' is {}.", s2, len);
}

fn calculate_length(s: String) -> (String, usize) {
let length = s.len(); // len() 返回字符串的长度

    (s, length)
}
```

但是这未免有些形式主义,而且这种场景应该很常见.幸运的是,Rust 对此提供了一个功能,叫做引用(references).