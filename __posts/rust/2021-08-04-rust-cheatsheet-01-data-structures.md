---
layout: post 
title: "Rust-CheatSheet"
category: Rust 
tags: CheatSheet 
keywords: 'rust cheatsheet' 
description: 'rust' 
coverage: rust_cheat_sheet.jpg 
permalink: /:categories/:title 
date: 2021-08-08T07:58:54+08:00
---

## 1. Data Structure

### 通过关键字定义的数据类型和内存位置

- `struct S {}` 定义一个名称为S的结构体
    - `struct S { x: T }` 定义结构体字段 x 类型为 T
    - `struct S(T)` 定义tuple结构体 `.0` 元素类型为 T
    - `struct S` 定义一个 Zero sized 的单元结构体.不占用空间,编译器优化
- `enum E {}` 定义结构体
    - `enum E { A, B(), C{} }` 定义 `enum`, 可以是单元 `A`, 元组 `B()` 和 `struct-like` `C{}`
    - `enum E { A = 1}` 判别值 A - 1
- `union U {}` 不安全的类似 C 的 Union, 用于 FFI 兼容性
- `static X:T = T()` 全局变量 static 生命周期, 单内存地址
- `const X:T = T()` 定义常量, 使用的时候拷贝到临时内存
- `let x:T` 分配 T stack 数据 绑定到 x, 赋值一次, 不可变
- `let mut x:T` 和 let 类似,是可变的,借用可变
    - `x = y` 如果 y 是不能被Copy, 移动(move) y 到 x, y将失效. 否则复制y

> 绑定变量存在于同步代码的stack中. 在 async {} 中,它们成为 async 状态机的一部分,可能驻留在heap.
> 从技术上讲,可变和不可变是用词不当. 不可变绑定或共享引用可能仍包含 Cell, 从而提供内部可变性.

### 创建和访问数据结构,和更多的符号类型

- `S { x: y }` 创建 `struct S {}` 或者 `enum E::S {}` 的x字段设置y值
- `S { x }` 设置变量 x 到 struct x字段
- `S { ..s }` 使用 s 的全部同字段填充
- `S { 0: x}` tuple struct `.0` 设置 x
- `S(x)` 创建 struct S(T) 或者 使用 enum E::S() x 赋值给 元组结构体 `.0` 元素
- `S` S 单元 struct, enum E::S 创建 S
- `E::C { x:y }` 创建 enum 成员是 struct
- `()` 空 tuple
- `(x)` 括号表达式
- `(x,)` 单元素 tuple
- `(S,)` 单元素类型 tuple
- `[S]` Slice 不知道长度的Type Array
- `[S;n]` 元素类型为 S, 长度为 n Array
- `[x;n]` Array 实例 n 个 x的拷贝
- `[x,y]` Array 实例 x,y 元素
- `x[0]` 集合索引 x.usize. Implementable with Index, IndexMut
- `x[..]` slice 全部元素
- `x[a..b]`   右索引元算不包含,第 a 到 b 个元素 slice
- `x[..b]`    右索引元算不包含,第 0 到 b 个元素 slice
- `x[a..=b]`  右索引元算包含,第 a 到 b 个元素 slice
- `x[..=b]`   右索引元算包含,第 0 到 b 个元素 slice
- `s.x` 命名字段访问,如果 x 不是类型 S 的一部分,可能会尝试Deref.
- `s.0` 编号字段访问,用于元组类型 S

## 2. References & Pointers(引用和指针)

授予对未拥有的内存的访问权限. 另请参阅泛型和约束部分.

- `&S` 共享引用
    - `&[S]` 特殊 slice 引用(包含地址,长度)
    - `&str` 特殊 string slice 引用(包含地址,长度)
    - `&mut S` 允许可变性的独占引用 (同 &mut [S], &mut dyn S, … )
    - `&dyn T` 特殊 Trait object 引用包含(address,vtable)
- `&s` 共享borrow (e.g., address, len, vtable, … of this s, like 0x1234)
    - `&mut s` 独占借用可变
    - `&raw const s` 通过w/o引用创建原始指针,  `c.ptr:addr_of!()`
    - `&raw mut s` 同上,可变. 原始指针,需要未对齐的压缩字段
- `ref s` 通过引用绑定, 使绑定引用类型
    - `let ref r = s` 效果相同 `let r = &s`
    - `let S {ref mut x } = s` 可变绑定(let x = &mut s.x), 简写的析构
- `*r` 取引用值
    - `*r = s` 如果 r 是可变引用,move or copy s 到目标memory
    - `s = *r` 如果r可以Copy,复制r
    - `s = *r` 如果r不可以Copy,错误
    - `s = *my_box` Box特殊用例,如果Box内容不能Copy,move Box的内容出来
- `'a` 静态分析中流的生命周期参数持续时间
    - `&'a S` 只接受一个带有 s 的地址, 地址存在生命周期比 'a 更长
    - `&'a mut S` 同上,但是可变
    - `struct S<'a> {}` S的地址生命周期是 'a, 创建 S 决定 'a 生命周期长短
    - `trait T<'a> {}` S impl T ,S 决定 'a 生命周期长短
    - `fn f<'a>(t: &'a T)` 调用者决定 'a 生命周期长短
- `'static` 持续整个程序执行的特殊生命周期

## 3. Functions & Behavior (函数和行为)

定义代码单元及其抽象

- `trait T {}` 定义一个 trait； 其他人可以 implement
- `trait T:R {}` T 是子 trait, S 是父级 trait, S 必须 impl R trait 之后才能 impl T trait
- `impl S {}` 实现 S 的方法
- `impl T for S {}` S type 实现 T trait 方法
- `impl !T for S {}` 禁用 T trait 的默认实现
- `fn f() {}` 定义函数,如果在 impl 内部则是实现方法
- `fn f() -> S {}` 返回值 Type S
- `fn f(&self) {}` 在 impl 内部定义方法
- `const fn f() {}` 常量函数,在编译时使用
- `async fn f() {}` Async 函数变体, f 函数 返回 impl Future
- `async fn f() -> S {}` 同上 返回 impl Future<Output=S>
- `async { x }` 在函数内部使用, { x } 返回 impl Future<Output=X>
- `fn() -> S` 函数指针,比包内存保存的地址
- `Fn() -> S` Callable Trait, 被闭包 impl
- `|| {}` 闭包 borrow 捕捉变量
    - `|x| {}` 闭包参数 x
    - `|x| x + x` 闭包返回简单表达式
    - `move |x| x + y` 闭包对其捕获的所有权； 即 y 转移到闭包。
    - `return || true` 闭包有时候看其来像 or, 这里 return 的是闭包
- `unsafe` 如果你喜欢周五晚上调试错误代码； 请使用不安全代码
    - `unsafe fn f() {}` Means "calling can cause UB, ↓ YOU must check requirements"
    - `unsafe trait T {}` Means "careless impl. of T can cause UB; implementor must check"
    - `unsafe { f(); }` Guarantees to compiler "I have checked requirements, trust me"
    - `unsafe impl T for S {}` Guarantees S is well-behaved w.r.t T; people may use T on S safely

## 4. Control Flow

- `while x {}` 如果 x 是 true 一直执行
- `loop {}` loop 直到 break, Can yield value with break x
- `for x in iter {}` 语法糖 loop over iterators
- `if x {} else {}` 条件分支
- `'label: loop {}` Loop label, 多见嵌套 loop
- `break` beak exit a loop
    - `break x` 跳出loop with x 值
    - `break 'label` 跳出 'label 的 loop
    - `break 'label x`  跳出 'label loop with x 值
- `continue` 继续
- `continue 'lable` 继续 'lable loop
- `x?` Result 结果错误处理
- `x.await` async 内部使用,直到 Future or Stream x Ready
- `return x` 提前返回值
- `f()` 函数闭包调用
- `x.f()` 方法调用
- `X::f(x)` 除非 impl Copy for X {},否则只能被调用一次
- `X::f(&x)` 方法调用
- `X::f(&mut x)` 方法调用
- `S::f(&x)` Same as x.f() if X derefs to S, i.e., x.f() finds methods of S
- `T::f(&x)` Same as x.f() if X impl T, i.e., x.f() finds methods of T if in scope
- `X::f()` 调用关联函数
- `<X as T>::f()` 调用 trait T::f() X的实现

## 5. Organizing Code 组织代码

将项目分割成更小的单元并最小化依赖性

- `mod m {}`    定义 mod, 从 {} 中获取 mod 定义代码
- `mod m;`    定义 mod, 获取定义内容 `m.rs` or `m/mod.rs` 文件
- `a::b`    Namespace 路径
- `::b`    搜索 b 相对于 crate root️
- `crate::b`    搜索 b 相对于 crate root️
- `self::b`    搜索 b 相对于当前 module
- `super::b`    搜索 b 相对于当前 parent
- `use a::b;`    直接使用.
- `use a::{b, c};`    简写 a::b a::c.
- `use a::b as x;`    重命名.
- `use a::b as _;`    将 b 匿名带入作用域，对于名称冲突的特征很有用
- `use a::*;`    把所有的东西都带进来，只有在 a 是一些prelude
- `pub use a::b;`    将 a::b 带入范围并从此处导出
- `pub T`    导出
    - `pub(crate) T`    Visible at most 1 in current crate.
    - `pub(super) T`    Visible at most 1 in parent.
    - `pub(self) T`    Visible at most 1 in current module (default, same as no pub).
    - `pub(in a::b) T`    Visible at most1 in ancestor a::b.
- `extern crate a;`    Declare dependency on external crate; just use a::b in '18.
- `extern "C" {}`    Declare external dependencies and ABI from FFI.
- `extern "C" fn f() {}`    Define function to be exported with ABI (e.g., "C") to FFI.

> 1 Items in child modules always have access to any item, regardless if pub or not.

## 6. Type Aliases and Casts (类型别名和类型转换)

类型的简写名称，以及将一种类型转换为另一种类型的方法

- `type T = S;` 类型重命名(alias)
- `Self` Alias implementing Type e.g. fn new() -> Self
- `self` 在方法中出现 `fn f(self) {}` 和 `fn f(self: Self) {}`等效
    - `&self` 引用 borrow 等效于 fn f(self: Self) {}
    - `&mut self` 引用可变 borrow 等效于 `fn f(self: &mut Self) {}`
    - `self: Box<Self>` 任意自类型，为智能指针添加方法 `my_box.f_of_self()`
- `S as T` 消除歧义 type S as Trait T eg `<S as T>::f()`
- `S as R` 导入 use, 导入 S 重命名为 R, eg `use a::S as R`
- `x as u32` 原始类型转换

## 7. Macros & Attributes 宏和属性

在实际编译发生之前扩展代码生成结构

- `m!()` 宏调用 also `m!{},m![]`
- `#[attr]` 外部属性,注解一下的item
- `#![attr]` 内部属性,注解上面,周围的item

### 宏的内部

- `$x:ty` 宏捕捉
- `$x` 宏替换, eg 捕捉 上一个例子 `$x:ty`
- `$(x),*` 宏重复>=0次
- `$(x),?` 宏重复0 or 1次
- `$(x),+` 宏重复>=1次
- `$(x)<<+` `<<` 和 上面例子 `,` 一样都是分割符

## 8. Pattern Matching

在 match 或 let 表达式或函数参数中找到的构造

- `match m {}` 开始模式匹配
- `let S(x) = get();` let 析构
- `let S { x } = s;` x 绑定到 s.x
- `let (_,b,_) = abc;` b 绑定到 abc.1
- `let (a,..) = abc;` a 绑定到 abc.0 丢弃之后数据
- `let (.., a, b) = (1,2);` a b 绑定到最后两个元素,丢弃之前数据
- `let Some(x) = get();` 🛑 模式匹配被拒绝, 使用 `if let`
- `if let Some(x) = get() {}` x 被匹配到 enum 成员值, 语法糖
- `while let Some(x) = get() {}` 一直执行 get() 如果模式匹配
- `fn f(S {x} :S` 函数参数析构, 在 f(s) 中 x 绑定到s.x

匹配表达式中的模式匹配 arms. 这些 arms 的左侧也可以在 let 表达式中找到

- `E::A => {}` 匹配枚举变量 A
- `E::B ( .. ) => {}` 匹配枚举 tuple 变量 B, 通配符任何索引
- `E::B { .. } => {}` 匹配枚举 struct 变量 B, 通配符任何索引
- `S { x: 0, y: 1 } => {}` 匹配枚举 struct, s.x == 0 && s.y == 1
- `S { x: a, y: b } => {}` 匹配枚举 struct, 绑定 s.x 到 a,绑定 s.y 到 b
- `S { x, y } => {}` 上面例子的简写
- `S { .. } => {}` 匹配 struct 任意值
- `D => {}` 匹配枚举D
- `_ => {}` 匹配余下的其他值
- `0 | 1 => {}` 模式替代，或模式
    - `E::A | E::Z` 同上,枚举
    - `E::C {x} | E::D {x}` 同上,struct x值
- `(a, 0) => {}` 模式匹配,a = s.0 s.1 == 0
- `[a, 0] => {}` 模式匹配,a = s[0]  s[1] == 0
    - `[1, ..] => {}` 模式匹配 Array s[0] == 1
    - `[1, .., 5] => {}` 模式匹配 Array 首元素 == 1 尾元素 == 5
    - `[1, x @ .., 5] => {}` Same, but also bind x to slice representing middle (c. next entry)
- `x @ 1..=5 => {}` Bind matched to x; pattern binding, here x would be 1, 2, … or 5
    - `Err(x @ Error {..}) => {}` Also works nested, here x binds to Error, esp. useful with if below
- `S { x } if x > 10 => {}` Pattern match guards, condition must be true as well to match

## 9. Generics & Constraints

泛型与类型构造函数、特征和函数相结合，为您的用户提供更大的灵活性

- `S<T>` 泛型, T是泛型参数
- `S<T: R>` 泛型,参数T trait bound R, R必须是trait
    - `T: R, P: S`  泛型参数 T 绑定 trait R , 泛型参数 P 绑定 trait S
    - `T: R, S` 🛑 错误写法
    - `T: R + S`   泛型参数 T 绑定 trait R 和 S
    - `T: R + 'a`  泛型参数 T 绑定 trait R 和 满足 'a 生命周期
    - `T: ?Sized`  泛型参数 T 禁止绑定 Sized trait
    - `T: 'a`   生命周期绑定 'a
    - `T: 'static` Same; does esp. not mean value t will 🛑 live 'static, only that it could.
    - `'b: 'a` 'b 生命周期 必须和 'a生命周期相同
- `S<const N: usize>` Generic const bound; ? user of type S can provide constant value N.
    - `S<10>` Where used, const bounds can be provided as primitive values.
    - `S<{5+5}>` Expressions must be put in curly brackets.
- `S<T> where T: R`  语法糖 `S<T: R>`
    - `S<T> where u8: R<T>` where 也可以限制其他的类型.
- `S<T = R>` 泛型参数 T 默认类型 R Default type parameter BK for associated type.
- `S<'_>` Inferred anonymous lifetime; asks compiler to 'figure it out' if obvious.
- `S<_>` 匿名类型 eg  `let x: Vec<_> = iter.collect()`
- `S::<T>` 调用函数消除未知 eg `f::<u32>()`
- `trait T<X> {}` 泛型trait X. Can have multiple impl T for S (one per X).
- `trait T { type X; }` Defines associated type BK RFC X. Only one impl T for S possible.
    - `type X = R;` Set associated type within impl T for S { type X = R; }.
- `impl<T> S<T> {}` 实现方法 `<T>` 必须在类型之前写出来，以使类型 `T` 代表泛型。
- `impl S<T> {}` 实现方法  `S<T>`, T 是具体类型 (e.g., `S<u32>`).
- `fn f() -> impl T` 返回结果必须实现trait T.
- `fn f(x: &impl T)` Trait bound, 参数x 类型必须实现 T trait, 类似于 `fn f<S:T>(x: &S)`.
- `fn f(x: &dyn T)` 标记动态分配, f 不会是单态.
- `fn f() where Self: R;` In trait T {}, make f accessible only on types known to also impl R.
    - `fn f() where Self: Sized;` Using Sized can opt f out of dyn T trait object vtable, enabling trait obj.
    - `fn f() where Self: R {}` Other R useful w. dflt. methods (non dflt. would need be impl'ed anyway).

## 10. Higher-Ranked Items

- `for<'a>`    Marker for higher-ranked bounds
    - `trait T: for<'a> R<'a> {}`    Any S that impl T would also have to fulfill R for any lifetime.
- `fn(&'a u8)`    Fn. ptr. type holding fn callable with specific lifetime `'a`.
- `for<'a> fn(&'a u8)`    Higher-ranked holding fn callable with any lt.; subtype of above.
    - `fn(&'_ u8)`    Same; automatically expanded to type `for<'a> fn(&'a u8)`.
    - `fn(&u8)`    Same; automatically expanded to type `for<'a> fn(&'a u8)`.
- `dyn for<'a> Fn(&'a u8)`    Higher-ranked (trait-object) type, works like fn above.
    - `dyn Fn(&'_ u8)`    Same; automatically expanded to type `dyn for<'a> Fn(&'a u8)`.
    - `dyn Fn(&u8)`    Same; automatically expanded to type `dyn for<'a> Fn(&'a u8)`.

Yes, the `for<>` is part of the type, which is why you write `impl T for for<'a> fn(&'a u8)` below.

### Implementing Traits	Explanation

- `impl<'a> T for fn(&'a u8) {}`    For fn. pointer, where call accepts specific lt. `'a`, impl trait `T`
- `impl T for for<'a> fn(&'a u8) {}`    For fn. pointer, where call accepts any lt., impl trait `T`
- `impl T for fn(&u8) {}`    Same, short version.

## 11. String 字符串

- `"..."`    String literal, UTF-8, will interpret `\n` as line break `0xA`, …
- `r"..."`    原始字符串 不转义 `\n`, …
- `r#"..."#`    Raw string literal, UTF-8, but can also contain `"`. Number of `#` can vary.
- `b"..."`    Byte 字符串字面值; ASCII `[u8]`, 不是字符串类型.
- `br"..."`, `br#"..."#`    原始 byte 字符串字面值, ASCII `[u8]`, combination of the above.
- `'🦀'`    固定 4 byte unicode 'char'
- `b'x'`    ASCII byte 字面值. 