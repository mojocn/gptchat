---
layout: post
title: "Rust译文:02-代码内联运行变慢iCache原因"
category: Rust
tags: Rust笔记
keywords: 'rust,inline,泛型,编译后优化,iCache运行优化'
description: '内联也会使代码变慢,因为内联会增加代码的大小,使指令缓存变大并导致缓存未命中'
coverage: icache_dcache.png
permalink: /:categories/:title
date: 2021-07-14T07:58:54+08:00
---

## 1. 什么是iCache

> CPU和主存之间也存在多级高速缓存,一般分为3级,分别是L1, L2和L3.
> 另外,我们的代码都是由2部分组成:指令和数据.L1 Cache比较特殊,每个CPU会有2个L1 Cache.分别为指令高速缓存(Instruction Cache,简称iCache)和数据高速缓存(Data Cache,简称dCache).
> L2和L3一般不区分指令和数据,可以同时缓存指令和数据.下图举例一个只有L1 Cache的系统.我们可以看到每个CPU都有自己私有的L1 iCache和L1 dCache.

## 2. 前言

这是上一篇关于 [Rust 中 #inline](/rust/rust-code-inline) 的文章的后续文章. 这篇文章比较笼统,也比较啰嗦. 读者,当心！
在讨论内联编译优化时,几乎总是提到以下内容:

> 内联也会使代码变慢,因为内联会增加代码的大小,使指令缓存变大并导致缓存未命中

我自己已经多次看到以上情形以各种形式重复出现.我还看到了很多基准测试,其中明智地删除内联注释确实提高了性能. 然而,我从来没有看到性能改进能够追溯到 iCache.至少对我来说,这个解释似乎没有根据.
人们认为 iCache 是慢benchmark罪魁祸首,因为其他人这么说,而不是因为这里有一个benchmark大家都认可以证明iCache是罪魁祸首.

这并不意味着 iCache这个答案就是错误的, 只是我个人没有证据证明它比任何其他解释更好. 无论如何,我决定看一个我知道 `inline` 会导致可观察到的运行慢的特定案例,并并高清楚到底发生了什么.
请注意,这里的目标不是解释 `inline` 对现实世界的影响,benchmark是人为的.

- 首先,我们的目标是更多地了解用于解释结果的工具.
- 第二个目标是在实践中观察 iCache 的效果,或者为为什么删除内联可以加快编译速度提供替代假设.

## 3. Benchmark

Benchmark测试基于我的 [once_cell Rust 库](https://github.com/matklad/once_cell). 该库提供了一种原语,类似于[双重检查锁定](https://en.wikipedia.org/wiki/Double-checked_locking).

有一个看起来像这样的函数:

```rust
fn get_or_try_init<F, E>(&self, f: F) -> Result<&T, E>
where
 F: FnOnce() -> Result<T, E>,
{
  if let Some(value) = self.get() {
    // Fast path.
    return Ok(value);
  }

  // Slow path.
  self.0.initialize(f)?;
  Ok(unsafe { self.get_unchecked() })
}
```

我知道当 initialize 函数没有内联时,性能会显着提高.
事实确实如此（这就是为什么benchmark是综合的,现实世界的例子是关于我们不知道是否需要内联的情况）.

但目前还不清楚为什么内联初始化会导致代码变慢.
对于实验,我编写了一个简单的高级benchmark测试,在循环中调用 `get_or_try_init`:

```rust
const N_LOOPS: usize = 8;
static CELL: OnceCell<usize> = OnceCell::new();

fn main() {
  for i in 0..N_LOOPS {
    go(i)
  }
}

fn go(i: usize) {
  for _ in 0..100_000_000 {
    let &value = CELL.get_or_init(|| i);
    assert!(value < N_LOOPS);
  }
}
```

我还添加了编译时切换来强制或禁止内联:

```rust
#[cfg_attr(feature = "inline_always", inline(always))]
#[cfg_attr(feature = "inline_never", inline(never))]
fn initialize() { ... }
```

您可以在此提交中看到[完整的基准测试](https://github.com/matklad/once_cell/commit/a741d5f2ca7cd89125ef1c70ee2e5fe660271050)

运行这两个版本表明 `inline(never)` 确实要快得多:

```shell
$ cargo run -q --example bench  --release --features inline_always
330ms

$ cargo run -q --example bench  --release --features inline_never
259ms
```

> 请注意,我们在这里不使用花哨的统计数据.
> /usr/bin/time 足以用肉眼看到差异,尽管我们正在寻找的效果非常低级.
> 因此,一般提示:如果您正在对相对差异（而不是绝对性能）进行基准测试,请不要费心测量纳秒级精度的时间.
> 取而代之的是,循环基准足以使人类可察觉的变化.


我们如何解释这种差异？ 第一步是从等式中删除货物并制作两个二进制文件进行比较:

```bash
$ cargo build --example bench --release --features inline_never
$ cp ./target/release/examples/bench never
$ cargo build --example bench --release --features inline_always
$ cp ./target/release/examples/bench always
```

在 Linux 上,快速访问任何程序性能的最佳工具是 perf stat.
它运行程序并显示一堆 CPU 级别的性能计数器,这可能会解释发生了什么.
由于我们怀疑 iCache 可能是罪魁祸首,让我们包括缓存的计数器:

```shell
$ perf stat -e instructions,cycles,\
  L1-dcache-loads,L1-dcache-load-misses,L1-dcache-prefetches,\
  L1-icache-loads,L1-icache-load-misses,cache-misses \
  ./always
348ms

 6,396,754,995      instructions:u
 1,601,314,994      cycles:u
 1,600,621,170      L1-dcache-loads:u
         4,806      L1-dcache-load-misses:u
         4,402      L1-dcache-prefetches:u
        69,594      L1-icache-loads:u
           461      L1-icache-load-misses:u
         1,928      cache-misses:u

$ perf stat -e instructions,cycles,\
  L1-dcache-loads,L1-dcache-load-misses,L1-dcache-prefetches,\
  L1-icache-loads,L1-icache-load-misses,cache-misses \
  ./never
261ms

 Performance counter stats for './never':

 5,597,215,493      instructions:u
 1,199,960,402      cycles:u
 1,599,404,303      L1-dcache-loads:u
         4,612      L1-dcache-load-misses:u
         4,290      L1-dcache-prefetches:u
        62,268      L1-icache-loads:u
           603      L1-icache-load-misses:u
         1,675      cache-misses:u
```

## 4. 细节

L1-icache-load-misses 有一些差异,但指令也有惊人的差异. 更重要的是,L1-icache-load-misses 的差异很难估计,因为不清楚 L1-icache-loads 是什么.
作为健全性检查,dcache 的统计数据与我们预期的一样. 虽然 perf 从 CPU 获取真实数据,但另一种方法是在模拟环境中运行程序.

这就是 cachegrind 工具所做的. 有趣的事实:cachegrind 的主要作者是@nnethercote,我们在上一篇文章中看到了他的 Rust Performance Book. 让我们看看 cachegrind 对基准测试的看法.

```shell
$ valgrind --tool=cachegrind ./always
10s
 I   refs:      6,400,577,147
 I1  misses:            1,560
 LLi misses:            1,524
 I1  miss rate:          0.00%
 LLi miss rate:          0.00%

 D   refs:      1,600,196,336
 D1  misses:            5,549
 LLd misses:            4,024
 D1  miss rate:           0.0%
 LLd miss rate:           0.0%

 LL refs:               7,109
 LL misses:             5,548
 LL miss rate:            0.0%

$ valgrind --tool=cachegrind ./never
9s
 I   refs:      5,600,577,226
 I1  misses:            1,572
 LLi misses:            1,529
 I1  miss rate:          0.00%
 LLi miss rate:          0.00%

 D   refs:      1,600,196,330
 D1  misses:            5,553
 LLd misses:            4,024
 D1  miss rate:           0.0%
 LLd miss rate:           0.0%

 LL refs:               7,125
 LL misses:             5,553
 LL miss rate:            0.0%
```

请注意,由于 cachegrind 模拟程序,因此运行速度要慢得多. 在这里,我们没有看到 iCache 未命中（I1 — 一级指令缓存,LLi — 末级指令缓存）的大差异.
我们确实看到了 iCache 引用的不同. 请注意,CPU 引用 iCache 的次数应与其执行的指令数相对应. 用 perf 交叉检查数量,我们看到 perf 和 cachegrind 都同意执行的指令数量.
他们也同意 inline_always 版本执行更少的指令.

仍然很难说 perf 的 sL1-icache-loads 是什么意思. 从名字上看,它应该与 cachegrind 的 I refs 相对应,但事实并非如此.
不管怎样,似乎有一件事需要进一步调查 —— 为什么内联会改变执行的指令数量？内联实际上并没有改变 CPU 运行的代码,所以指令的数量应该保持不变. 那我们来看看asm吧！这里正确的工具是cargo-asm.
同样,这是我们将锁定的函数:

```rust
fn go(tid: usize) {
  for _ in 0..100_000_000 {
    let &value = CELL.get_or_init(|| tid);
    assert!(value < N_THREADS);
  }
}
```

对 get_or_init 的调用将被内联,对 initialize 的嵌套调用将根据标志被内联. 我们先来看看 inline_never 版本:

```
  push    r14 ;
  push    rbx ; prologue
  push    rax ;
  mov     qword, ptr, [rsp], rdi
  mov     ebx, 100000001 ; loop counter
  mov     r14, rsp
  jmp     .LBB14_1
 .loop:
  cmp     qword, ptr, [rip, +, CELL+16], 8
  jae     .assert_failure
 .LBB14_1:
  add     rbx, -1
  je      .normal_exit
  mov     rax, qword, ptr, [rip, +, CELL]
  cmp     rax, 2
  je      .loop
  mov     rdi, r14
  call    once_cell::imp::OnceCell<T>::initialize
  jmp     .loop
 .normal_exit:
  add     rsp, 8 ;
  pop     rbx    ; epilogue
  pop     r14a   ;
  ret            ;
 .assert_failure:
  lea     rdi, [rip, +, .L__unnamed_12]
  lea     rdx, [rip, +, .L__unnamed_13]
  mov     esi, 35
  call    qword, ptr, [rip, +, core::panicking::panic@GOTPCREL]
  ud2
```

然后在 inline_always 版本:

```cgo
  push    rbp  ;
  push    r15  ;
  push    r14  ;
  push    r13  ; prologue
  push    r12  ;
  push    rbx  ;
  sub     rsp, 24
  mov     r12, rdi
  xor     ebx, ebx
  mov     r13d, 1
  lea     r14, [rip, +, CELL]
  mov     rbp, qword, ptr, [rip, +, WaiterQueue::drop@GOTPCREL]
  mov     r15, qword, ptr, [rip, +, once_cell::imp::wait@GOTPCREL]
  jmp     .LBB10_1
 .LBB10_10:
  mov     qword, ptr, [rsp, +, 8], r14
  mov     qword, ptr, [rip, +, CELL+8], 1
  mov     qword, ptr, [rip, +, CELL+16], r12
  mov     qword, ptr, [rsp, +, 16], 2
  lea     rdi, [rsp, +, 8]
  call    rbp
 .loop:
  add     rbx, 1
  cmp     qword, ptr, [rip, +, CELL+16], 8
  jae     .assert_failure
 .LBB10_1:
  cmp     rbx, 100000000
  je      .normal_exit
  mov     rax, qword, ptr, [rip, +, CELL]
  cmp     rax, 2
  je      .loop
 .LBB10_3:
  mov     rax, qword, ptr, [rip, +, CELL]
 .LBB10_4:
  test    rax, rax
  jne     .LBB10_5
  xor     eax, eax
  lock    cmpxchg, qword, ptr, [rip, +, CELL], r13
  jne     .LBB10_4
  jmp     .LBB10_10
 .LBB10_5:
  cmp     rax, 2
  je      .loop
  mov     ecx, eax
  and     ecx, 3
  cmp     ecx, 1
  jne     .LBB10_8
  mov     rdi, r14
  mov     rsi, rax
  call    r15
  jmp     .LBB10_3
 .normal_exit:
  add     rsp, 24 ;
  pop     rbx     ;
  pop     r12     ;
  pop     r13     ; epilogue
  pop     r14     ;
  pop     r15     ;
  pop     rbp     ;
  ret
 .assert_failure:
  lea     rdi, [rip, +, .L__unnamed_9]
  lea     rdx, [rip, +, .L__unnamed_10]
  mov     esi, 35
  call    qword, ptr, [rip, +, core::panicking::panic@GOTPCREL]
  ud2
 .LBB10_8:
  lea     rdi, [rip, +, .L__unnamed_11]
  lea     rdx, [rip, +, .L__unnamed_12]
  mov     esi, 57
  call    qword, ptr, [rip, +, core::panicking::panic@GOTPCREL]
  ud2


```

我稍微编辑了代码,并突出显示了构成基准测试的大部分的热循环. 查看程序集,我们可以看到以下内容:代码要大得多 — 发生了内联！
函数序言更大,编译器将更多被调用者保存的寄存器压入堆栈 函数尾声更大,编译器需要恢复更多寄存器堆栈帧更大 编译器将一些初始化代码提升到循环之前 两种情况下的核心循环都非常紧凑,
只有少数指令核心循环向上计数而不是向下计数,添加额外的 cmp 指令请注意,iCache 不太可能影响正在运行的代码,因为它是内存中彼此相邻的一小部分指令.

另一方面,具有大立即数的额外 cmp 正好说明了我们观察到的额外指令数量（循环运行了 800_000_000 次）.

## 5. 结论

想出一个基准来证明两种替代方案之间的差异已经够难的了. 更难解释差异 — 可能有很多现成的解释,但它们不一定是真的.
尽管如此,今天我们拥有大量有用的工具. 两个值得注意的例子是 perf 和 valgrind. 工具并不总是正确的 — 根据对问题的常识性理解,对不同的工具进行理智的检查是一个好主意.

试考虑内联技术将函数S内联展开于函数C中：

-
内联使得C占用了更多的寄存器.由于函数S的代码直接在函数C的函数体中展开,造成函数C在程序上下文切换过程中加入了更多的push/pop指令,并且函数C的运行时栈的空间进一步膨胀.与内联版本中每次调用函数C都意味着这些新增的push/pop指令都会运行不同,未内联版本的push/pop指令只存在于函数S的上下文中,并且只有当函数C确实调用函数S时,这些指令才会被运行；
- 基于第一点的基本认识,现在设想函数S在流程控制语句中被调用（循环或条件分支等）,编译器可能会提升函数S中的某些指令到条件分支之外,造成这些指令从冷路径变为热路径（冷热路径：因为条件分支可能不会执行,但是位于条件分支之外的代码总会执行,是为热路径）；
- 在上述场景中,随着外层函数C的栈中局部变量和流程控制语句增多,编译器的优化反而使得热路径执行效率降低.

[原文地址](https://matklad.github.io/2021/07/10/its-not-always-icache.html)