---
layout: post
title: "Rust译文:01-代码内联编译优化"
category: Rust
tags: Rust笔记
keywords: 'rust,inline,泛型,编译后优化'
description: 'Rust 中的每一个 References 都有其 Lifetime,也就是 References 保持有效的 Scope '
coverage: rust_gcc.png
permalink: /:categories/:title
date: 2021-07-13T07:58:54+08:00
---

## 1. 内联

在 Rust 中有很多关于 [#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute) 属性的古老知识.
我发现我经常思考它是如何生效的,所以我最终决定写下这篇文章.
读者警告："这是我所知道的,不一定是真实的." 此外,[#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute) 的确切语义不是一成不变的,
可能会在未来的 Rust 版本中改变.

## 2. 为什么内联重要?

内联是一种优化转换,它用函数体代替对函数的调用. 举一个简单的例子,在编译期间编译器可以转换这段代码：

```rust
fn f(w: u32) -> u32 {
    inline_me(w, 2)
}

fn inline_me(x: u32, y: u32) -> u32 {
    x * y
}
```

上面代码被转换成一下代码

```rust
fn f(w: u32) -> u32 {
    w * 2
}
```

根据这段话 [A Catalogue of Optimizing Transformations by Frances Allen and John Cocke:](https://www.clear.rice.edu/comp512/Lectures/Papers/1971-allen-catalog.pdf)
> There are many obvious advantages to inlining; two are:
> a. There is no function call overhead whatsoever.
> b. Caller and callee are optimized together. Advantage can be taken
> of particular argument values and relationships: constant arguments
> can be folded into the code, invariant instructions in the callee
> can be moved to infrequently executed areas of the caller, etc.

换句话说,提前编译语言内联是所有其他优化的基础. 它为编译器提供了应用进一步转换所需的上下文.

## 3. 内联 vs 单独编译

`内联`与编译器中的另一个重要思想`单独编译`的思想有冲突. 在编译大程序代码时,最好将它们分成可以独立编译的模块： 并行处理所有内容.
范围增量重新编译到单个更改的模块. 为了实现`单独编译`,编译器公开函数的签名,但保持函数体对其他模块不可见,从而防止内联.
这原则上的冲突使得 Rust 中的 [#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute)  比编译器内联函数的提示更棘手.

## 4. Rust中的内联

在 Rust 中,一个（单独的）编译单元是一个 crate.
如果在 crate A 中定义了函数 f,则可以内联 A 中对 f 的所有调用,因为编译器可以完全访问 f.
但是,如果从某个下游 crate B 调用 f,则无法内联此类调用.
B 只能访问 f 的签名,而不能访问其正文.

这就是[#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute)  的主要用法来自 — 它支持跨crate内联.
如果没有[#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute) ,
即使是最微不足道的fn也无法跨 crate 边界内联.好处不是没有成本 — 编译器通过编译 #inline 函数的单独副本以及它在每个crate中使用它来实现这一点,这显着增加了编译时间.

除了[#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute) ,还有两个例外.
泛型函数是隐式内联的.
实际上,编译器只有在知道实例化它的特定类型参数时才能编译泛型函数.正如仅在调用crate中知道的那样,泛型函数的主体必须始终可用.

另一个例外是`链接时优化`. LTO 选择退出单独编译 — 它使所有函数的主体可用,但代价是编译速度要慢得多.

## 5. 内联代码规则

现在解释了底层语义,可以推断出一些使用[#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute)的经验规则.

1. 不分青红皂白地应用 [#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute) 不是一个好主意,因为这会使编译变得更慢.
   如果您不关心编译时间,一个更好的解决方案是在 `Cargo profile (docs)` 中设置 `lto = true`.

2. 通常没有必要将[#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute)应用于私有函数:
   在 crate 内,编译器通常会做出很好的内联决策. 有一个笑话说: LLVM 对是否应该内联函数的是答案总是“YES”.

3. 在构建应用程序时,当profile表明某个特定的短函数是瓶颈时,应被动地应用[#inline](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute) . 考虑使用 lto
   进行realse.
   主动地内联琐碎的public fn可能是有有效的.

4. 在构建lib时,主动将inline 添加到小的非泛型函数中. 特别注意 impls：Deref、AsRef 等经常从内联中受益. lib不能预先预测所有的用法,不要过早地对未来的用户感到悲观是有道理的.
   请注意,***inline不是可传递的***：如果一个平凡的公共函数调用一个平凡的私有函数,您需要inline 两者.
   有关详细信息,请参阅此[基准测试](https://github.com/matklad/benchmarks/tree/91171269f0a6e260a27111d07661021a89d20085/rust-inline).

5. 记住泛型函数. 说泛型函数是隐式内联并没有太大错. 因此,它们通常是代码膨胀的原因. 应该编写泛型函数,尤其是在lib中,以尽量减少不需要的内联. 以 wat 为例：

```rust
// Public, generic function.
// Will cause code bloat if not handled carefully!
pub fn parse_str(wat: impl AsRef<str>) -> Result<Vec<u8>> {
  // Immediately delegate to a non-generic function.
  _parse_str(wat.as_ref())
}

// Separate-compilation friendly private implementation.
fn _parse_str(wat: &str) -> Result<Vec<u8>> {
    ...
}
```

## 6. References

- [原文 https://matklad.github.io/2021/07/09/inline-in-rust.html](https://matklad.github.io/2021/07/09/inline-in-rust.html)
- [Language reference](https://doc.rust-lang.org/reference/attributes/codegen.html#the-inline-attribute)
- [Rust performance book](https://nnethercote.github.io/perf-book/inlining.html)
- [@alexcrichton explains inline](https://github.com/rust-lang/hashbrown/pull/119#issuecomment-537539046) Note that, in reality, the compile time costs are worse than what I
  described -- inline functions are compiled per codegen-unit, not per crate.
- [More @alexcrichton](https://users.rust-lang.org/t/enable-cross-crate-inlining-without-suggesting-inlining/55004/9?u=matklad)
- [Even more @alexcrichton](https://internals.rust-lang.org/t/inlining-policy-for-functions-in-std/14189/10?u=matklad)