---
layout: post
title: Go 函数调用 ━ 栈和寄存器视角
category: Golang
tags: Golang
keywords: go语言
description: Go 函数调用 ━ 栈和寄存器视角
coverage: ginbro_coverage.jpg
ref: https://segmentfault.com/a/1190000019753885
---

函数的调用过程主要要点在于借助寄存器和内存帧栈传递参数和返回值.虽然同为编译型语言,Go 相较 C 对寄存器和栈的使用有一些差别,同时,Go 语言自带协程并引入 defer 等语句,在调用过程上显得更加复杂.
理解Go函数调用在CPU指令层的过程有助于编写高效的代码,在性能优化,Bug排查的时候,能更迅速的确定要点.本文以简短的示例代码和对应的汇编代码演示了Go的调用过程,展示了不同数据类型的参数的实际传递过程,同时分析了匿名函数,闭包作为参数或者返回值传递时,在内存上的实际数据结构.对于协程对栈的使用和实现细节,本文不展开.

阅读本文需要掌握计算机体系结构基础知识(至少了解程序内存布局,栈,寄存器),Go 基础语法.参考文档提供了这些主题更详细的知识.

以下：

### 术语

* 栈：每个进程/线程/goroutine有自己的调用栈,参数和返回值传递,函数的局部变量存放通常通过栈进行.和数据结构中的栈一样,内存栈也是后进先出,地址是从高地址向低地址生长.
* 栈帧：（stack frame）又常被称为帧（frame）.一个栈是由很多帧构成的,它描述了函数之间的调用关系.每一帧就对应了一次尚未返回的函数调用,帧本身也是以栈的形式存放数据的.
* caller 调用者
* callee 被调用者,如在 函数 A 里 调用 函数 B,A 是 caller,B 是 callee
  **寄存器**(X86)

* ESP：栈指针寄存器(extended stack pointer),存放着一个指针,该指针指向栈最上面一个栈帧(即当前执行的函数的栈)的栈顶.注意：


* ESP指向的是已经存储了内容的内存地址,而不是一个空闲的地址.例如从 0xC0000000 到 0xC00000FF是已经使用的栈空间,ESP指向0xC00000FF

* EBP：基址指针寄存器(extended base pointer),也叫帧指针,存放着一个指针,该指针指向栈最上面一个栈帧的底部.
* EIP：寄存器存放下一个CPU指令存放的内存地址,当CPU执行完当前的指令后,从EIP寄存器中读取下一条指令的内存地址,然后继续执行.
  注意：16位寄存器没有前缀(SP,BP,IP),32位前缀是E(ESP,EBP,EIP),64位前缀是R(RSP,RBP,RIP)

**汇编指令**

* PUSH：进栈指令,PUSH指令执行时会先将ESP减4,接着将内容写入ESP指向的栈内存.
* POP ：出栈指令,POP指令执行时先将ESP指向的栈内存的一个字长的内容读出,接着将ESP加4.注意：


* 用PUSH指令和POP指令时只能按字访问栈,不能按字节访问栈.

* CALL：调用函数指令,将返回地址（call指令的下一条指令）压栈,接着跳转到函数入口.
* RET：返回指令,将栈顶返回地址弹出到EIP,接着根据EIP继续执行.
* LEAVE：等价于 mov esp,ebp; pop ebp;
* MOVL：在内存与寄存器,寄存器与寄存器之间转移值
* LEAL：用来将一个内存地址直接赋给目的操作数
  注意：8位指令后缀是B,16位是S,32位是L,64位是Q

### 调用惯例

调用惯例(calling convention)是指程序里调用函数时关于如何传参如何分配和清理栈等的方案.一个调用惯例的内容包括：

* 参数是通过寄存器传递还是栈传递或者二者混合
* 通过栈传递时参数是从左至右压栈还是从右至左压栈
* 函数结果是通过寄存器传递还是通过栈传递
* 调用者(caller)还是被调用者(callee)清理栈空间
* 被调用者应该为调用者保存哪些寄存器
  例如,C 的调用惯例(cdecl, C declaration)是：


* 函数实参在线程栈上按照从右至左的顺序依次压栈.
* 函数结果保存在寄存器EAX/AX/AL中
* 浮点型结果存放在寄存器ST0中
* 编译后的函数名前缀以一个下划线字符
* 调用者负责从线程栈中弹出实参（即清栈）
* 8比特或者16比特长的整形实参提升为32比特长.
* 受到函数调用影响的寄存器（volatile registers）：EAX, ECX, EDX, ST0 - ST7, ES, GS
* 不受函数调用影响的寄存器： EBX, EBP, ESP, EDI, ESI, CS, DS
* RET指令从函数被调用者返回到调用者（实质上是读取寄存器EBP所指的线程栈之处保存的函数返回地址并加载到IP寄存器） cdecl 将函数返回值保存在寄存器中,所以 C 语言不支持多个返回值.另外,cdecl
  是调用者负责清栈,**因而可以实现可变参数的函数**.如果是被调用者负责清理的话,无法实现可变参数的函数,但是**编译代码的效率会高一点,因为清理栈的代码不用在每次调用的时候(编译器计算)
  生成一遍**.(x86的ret指令允许一个可选的16位参数说明栈字节数,用来在返回给调用者之前解堆栈.代码类似`ret 12`这样,如果遇到这样的汇编代码,说明是被调用者清栈.)

注意,虽然 C 语言
里都是借助寄存器传递返回值,但是返回值大小不同时有不同的处理情形.若小于4字节,返回值存入eax寄存器,由函数调用方读取eax.若返回值5到8字节,采用eax和edx联合返回.若大于8个字节,首先在栈上额外开辟一部分空间temp,将temp对象的地址做为隐藏参数入栈.函数返回时将数据拷贝给temp对象,并将temp对象的地址用寄存器eax传出.调用方从eax指向的temp对象拷贝内容.

可以看到,设计一个编程语言的特性时,需要为其选择合适调用惯例才能在底层实现这些特性.(调用惯例是编程语言的编译器选择的,同样的语言不同的编译器可能会选择实现不同的调用惯例）

### 一次典型的 C 函数调用过程

**在caller里**：

* 将实参从右至左压栈(X86-64下是：将实参写入寄存器,如果实参超过 6 个,超出的从右至左压栈)
* 执行 call 指令(会将返回地址压栈,并跳转到 callee 入口)
  **进入callee里**：

* push ebp; mov ebp,esp; 此时EBP和ESP已经分别表示callee的栈底和栈顶了.之后 EBP 的值会保持固定.此后局部变量和临时存储都可以通过基准指针EBP加偏移量找到了.
* sub xxx, esp; 栈顶下移,为callee分配空间,用于存放局部变量等.分配的内存单元可以通过 EBP - K 或者 ESP + K 得到地址访问.
* 将某些寄存器的值压栈(可能)
* callee执行
* 将某些寄存器值弹出栈(可能)
* mov esp,ebp; pop ebp; (这两条指令也可以用 leave 指令替代)此时 EBP 和 ESP 回到了进入callee之前的状态,即分别表示caller的栈底和栈顶状态.
* 执行 ret 指令
  **回到了caller里的代码**

![tech.mojotv.cn_](/assets/pic/c2dtZl9odHRwczovL2xlZXJpZ2h0Lm9zcy1jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vZ28vZnVuY3Rpb24vMS5wbmc.jpg)

```go
int add(int arg1, int arg2, int arg3, int arg4, int arg5, int arg6, int arg7, int arg8) {
    return arg1 + arg2 + arg3 + arg4 + arg5 + arg6 + arg7 + arg8;
}

int main() {
    int i = add(1, 2, 3 , 4, 5, 6, 7, 8);
}
```

x86版汇编

```go
    .section    __TEXT,__text,regular,pure_instructions
    .build_version macos, 10, 14    sdk_version 10, 14
    .globl    _add                    ## -- Begin function add
    .p2align    4, 0x90
_add:                                   ## @add
    .cfi_startproc
## %bb.0:
    pushl    %ebp
    .cfi_def_cfa_offset 8
    .cfi_offset %ebp, -8
    movl    %esp, %ebp
    .cfi_def_cfa_register %ebp
    pushl    %ebx
    pushl    %edi
    pushl    %esi
    subl    $32, %esp
    .cfi_offset %esi, -20
    .cfi_offset %edi, -16
    .cfi_offset %ebx, -12
    movl    36(%ebp), %eax
    movl    32(%ebp), %ecx
    movl    28(%ebp), %edx
    movl    24(%ebp), %esi
    movl    20(%ebp), %edi
    movl    16(%ebp), %ebx
    movl    %eax, -16(%ebp)         ## 4-byte Spill
    movl    12(%ebp), %eax
    movl    %eax, -20(%ebp)         ## 4-byte Spill
    movl    8(%ebp), %eax
    movl    %eax, -24(%ebp)         ## 4-byte Spill
    movl    8(%ebp), %eax
    addl    12(%ebp), %eax
    addl    16(%ebp), %eax
    addl    20(%ebp), %eax
    addl    24(%ebp), %eax
    addl    28(%ebp), %eax
    addl    32(%ebp), %eax
    addl    36(%ebp), %eax
    movl    %ebx, -28(%ebp)         ## 4-byte Spill
    movl    %ecx, -32(%ebp)         ## 4-byte Spill
    movl    %edx, -36(%ebp)         ## 4-byte Spill
    movl    %esi, -40(%ebp)         ## 4-byte Spill
    movl    %edi, -44(%ebp)         ## 4-byte Spill
    addl    $32, %esp
    popl    %esi
    popl    %edi
    popl    %ebx
    popl    %ebp
    retl
    .cfi_endproc
                                        ## -- End function
    .globl    _main                   ## -- Begin function main
    .p2align    4, 0x90
_main:                                  ## @main
    .cfi_startproc
## %bb.0:
    pushl    %ebp
    .cfi_def_cfa_offset 8
    .cfi_offset %ebp, -8
    movl    %esp, %ebp
    .cfi_def_cfa_register %ebp
    subl    $40, %esp
    movl    $1, (%esp)
    movl    $2, 4(%esp)
    movl    $3, 8(%esp)
    movl    $4, 12(%esp)
    movl    $5, 16(%esp)
    movl    $6, 20(%esp)
    movl    $7, 24(%esp)
    movl    $8, 28(%esp)
    calll    _add
    xorl    %ecx, %ecx
    movl    %eax, -4(%ebp)
    movl    %ecx, %eax
    addl    $40, %esp
    popl    %ebp
    retl
    .cfi_endproc
                                        ## -- End function

.subsections_via_symbols
```

x86-64版汇编

```go
    .section    __TEXT,__text,regular,pure_instructions
    .build_version macos, 10, 14    sdk_version 10, 14
    .globl    _add                    ## -- Begin function add
    .p2align    4, 0x90
_add:                                   ## @add
    .cfi_startproc
## %bb.0:
    pushq    %rbp
    .cfi_def_cfa_offset 16
    .cfi_offset %rbp, -16
    movq    %rsp, %rbp
    .cfi_def_cfa_register %rbp
    movl    24(%rbp), %eax
    movl    16(%rbp), %r10d
    movl    %edi, -4(%rbp)
    movl    %esi, -8(%rbp)
    movl    %edx, -12(%rbp)
    movl    %ecx, -16(%rbp)
    movl    %r8d, -20(%rbp)
    movl    %r9d, -24(%rbp)
    movl    -4(%rbp), %ecx
    addl    -8(%rbp), %ecx
    addl    -12(%rbp), %ecx
    addl    -16(%rbp), %ecx
    addl    -20(%rbp), %ecx
    addl    -24(%rbp), %ecx
    addl    16(%rbp), %ecx
    addl    24(%rbp), %ecx
    movl    %eax, -28(%rbp)         ## 4-byte Spill
    movl    %ecx, %eax
    movl    %r10d, -32(%rbp)        ## 4-byte Spill
    popq    %rbp
    retq
    .cfi_endproc
                                        ## -- End function
    .globl    _main                   ## -- Begin function main
    .p2align    4, 0x90
_main:                                  ## @main
    .cfi_startproc
## %bb.0:
    pushq    %rbp
    .cfi_def_cfa_offset 16
    .cfi_offset %rbp, -16
    movq    %rsp, %rbp
    .cfi_def_cfa_register %rbp
    subq    $32, %rsp
    movl    $1, %edi
    movl    $2, %esi
    movl    $3, %edx
    movl    $4, %ecx
    movl    $5, %r8d
    movl    $6, %r9d
    movl    $7, (%rsp)
    movl    $8, 8(%rsp)
    callq    _add
    xorl    %ecx, %ecx
    movl    %eax, -4(%rbp)
    movl    %ecx, %eax
    addq    $32, %rsp
    popq    %rbp
    retq
    .cfi_endproc
                                        ## -- End function

.subsections_via_symbols
```

可以看到 Clang 编译出的X86目标代码并不使用寄存器传递参数,而X86-64目标代码里,使用寄存器传递前六个参数.

### 一次典型的Go函数调用过程

Go 选择的调用惯例是：

* 参数完全通过栈传递,从参数列表的右至左压栈
* 返回值通过栈传递,返回值的栈空间在参数之前,即返回值在更接近caller栈底的位置
* caller负责清理栈

```go
package main

func main() {
    add(1,2)
}

//go:noinline
func add(a , b int) int {
    c := 3
    d := a + b + c
    return d
}
```

```go
TEXT main.main(SB) /Users/user/go/src/test/main.go
  main.go:4        0x104ea20        65488b0c2530000000    MOVQ GS:0x30, CX            
  main.go:4        0x104ea29        483b6110        CMPQ 0x10(CX), SP    
  main.go:4        0x104ea2d        762e            JBE 0x104ea5d                
  main.go:4        0x104ea2f        4883ec20        SUBQ $0x20, SP ; 增加 32 bytes 的栈空间(四个 qword,8个bytes 为一个 qword)                
  main.go:4        0x104ea33        48896c2418        MOVQ BP, 0x18(SP) ; 将 BP 的值写入到刚分配的栈空间的第一个qword
  main.go:4        0x104ea38        488d6c2418        LEAQ 0x18(SP), BP ; 将刚分配的栈空间的第一个字的地址赋值给BP(即BP此时指向了刚才存放旧BP值的地址)            
  main.go:5        0x104ea3d        48c7042401000000    MOVQ $0x1, 0(SP); 将给add函数的第一个实参值1 写入到刚分配栈空间的最后一个qword
  main.go:5        0x104ea45        48c744240802000000    MOVQ $0x2, 0x8(SP); 将给add函数的第二个实参值2 写入到刚分配栈空间的第三个qword.第二个 qword 没有用到,实际上是给callee用来存放返回值的.             
  main.go:5        0x104ea4e        e81d000000        CALL main.add(SB); 调用 add 函数    
  main.go:6        0x104ea53        488b6c2418        MOVQ 0x18(SP), BP; 将从栈里第四个qword将旧的BP值取回赋值到BP
  main.go:6        0x104ea58        4883c420        ADDQ $0x20, SP; 增加SP的值,栈收缩,收回 32 bytes的栈空间                 
  main.go:6        0x104ea5c        c3            RET                    
  
  TEXT main.add(SB) /Users/user/go/src/test/main.go
  main.go:11        0x104ea70        4883ec18        SUBQ $0x18, SP; 分配 24 bytes 的栈空间（3 个 qword）.        
  main.go:11        0x104ea74        48896c2410        MOVQ BP, 0x10(SP); 将 BP值 写入第一个qword
  main.go:11        0x104ea79        488d6c2410        LEAQ 0x10(SP), BP; 将刚分配的24 bytes 栈空间的第一个字的地址赋值给BP(即BP此时指向了刚才存放旧BP值的地址)        
  main.go:11        0x104ea7e        48c744243000000000    MOVQ $0x0, 0x30(SP);将存放返回值的地址清零,0x30(SP) 对应的内存位置是上一段 main.main 里分配的栈空间的第二个qword.
  main.go:12        0x104ea87        48c744240803000000    MOVQ $0x3, 0x8(SP); 对应 c := 3 这行代码.局部变量 c 对应的是栈上内存.3 被写入到刚分配的 24 bytes 空间的第二个qword.
  main.go:13        0x104ea90        488b442420        MOVQ 0x20(SP), AX; 将add的实参 1 写入到AX 寄存器.
  main.go:13        0x104ea95        4803442428        ADDQ 0x28(SP), AX; 将add的实参 2 增加到 AX 寄存器.
  main.go:13        0x104ea9a        4883c003        ADDQ $0x3, AX; 将局部变量值 3 增加到 AX 寄存器        
  main.go:13        0x104ea9e        48890424        MOVQ AX, 0(SP); 将 AX 的值(计算结果) 写入到刚分配的 24 bytes 空间的第三个qword.(对应代码 d := a + b + c)
  main.go:14        0x104eaa2        4889442430        MOVQ AX, 0x30(SP); 将 AX 的值写入到main里为返回值留的栈空间(main里分配的32 bytes 中的第二个 qword)
  main.go:14        0x104eaa7        488b6c2410        MOVQ 0x10(SP), BP; 恢复BP的值为函数入口处保存的旧BP的值.
  main.go:14        0x104eaac        4883c418        ADDQ $0x18, SP; 将 SP 增加三个字,收回add入口处分配的栈空间.    
  main.go:14        0x104eab0        c3            RET            
```

函数调用过程中,栈的变化情况如图：

**初始状态：**

![tech.mojotv.cn_](/assets/pic/c2dtZl9odHRwczovL2xlZXJpZ2h0Lm9zcy1jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vZ28vZnVuY3Rpb24vMi5wbmc.jpg)

**call add执行前栈状态：**

![tech.mojotv.cn_](/assets/pic/c2dtZl9odHRwczovL2xlZXJpZ2h0Lm9zcy1jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vZ28vZnVuY3Rpb24vMy5wbmc.jpg)

**进入add里之后栈状态：**

![tech.mojotv.cn_](/assets/pic/c2dtZl9odHRwczovL2xlZXJpZ2h0Lm9zcy1jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vZ28vZnVuY3Rpb24vNC5wbmc.jpg)

**add里ret执行前栈状态：**

![tech.mojotv.cn_](/assets/pic/c2dtZl9odHRwczovL2xlZXJpZ2h0Lm9zcy1jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vZ28vZnVuY3Rpb24vNS5wbmc.jpg)

**main里ret执行前栈状态：**

![tech.mojotv.cn_](/assets/pic/c2dtZl9odHRwczovL2xlZXJpZ2h0Lm9zcy1jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vZ28vZnVuY3Rpb24vNi5wbmc.jpg)

可以看到 Go 的调用过程和 C 类似,区别在于 Go 的参数完全通过栈传递,Go 的返回值也是通过栈传递.对于每种数据类型在作为参数传递时的表现,可以测试一下：

### 不同数据类型作为参数时的传递方式

#### Go 基础数据类型的参数传递

```go
package main

import (
    "fmt"
    "runtime/debug"
)

func main() {

    str := "hello"
    int8 := int8(8)
    int64 := int64(64)

    boolValue := true

    ExampleStr(str)
    ExampleBool(boolValue)
    ExampleInt8(int8)
    ExampleInt64(int64)
    ExampleMultiParams(false, 9, 8, 7)
}


func ExampleStr(str string){
    fmt.Println(string(debug.Stack()))
}

func ExampleBool(boolValue bool){

    boolValue = false

    fmt.Println(string(debug.Stack()))
}



func ExampleInt64(v int64){
    fmt.Println(string(debug.Stack()))
}

func ExampleInt8(v int8){
    fmt.Println(string(debug.Stack()))
}

func ExampleMultiParams(b bool, x, y, z int8){
    bl := b
    xl := x
    yl := y
    zl := z

    fmt.Println(bl, xl, yl, zl)
    fmt.Println(string(debug.Stack()))

}
```

```go
goroutine 1 [running]:
runtime/debug.Stack(0xc000084f38, 0x1057aad, 0x10aeb20)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleStr(0x10c6c34, 0x5)
    /Users/user/go/src/test/main.go:25 +0x26
main.main()
    /Users/user/go/src/test/main.go:16 +0x36

goroutine 1 [running]:
runtime/debug.Stack(0x10e0580, 0xc000092000, 0xc000084f58)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleBool(0x10c6c01)
    /Users/user/go/src/test/main.go:32 +0x26
main.main()
    /Users/user/go/src/test/main.go:17 +0x3f

goroutine 1 [running]:
runtime/debug.Stack(0x10e0580, 0xc000092000, 0xc000084f58)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleInt8(0x10c6c08)
    /Users/user/go/src/test/main.go:42 +0x26
main.main()
    /Users/user/go/src/test/main.go:18 +0x48

goroutine 1 [running]:
runtime/debug.Stack(0x10e0580, 0xc000092000, 0xc000084f58)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleInt64(0x40)
    /Users/user/go/src/test/main.go:38 +0x26
main.main()
    /Users/user/go/src/test/main.go:19 +0x55

false 9 8 7
goroutine 1 [running]:
runtime/debug.Stack(0x10e0580, 0xc000092000, 0xc000084f28)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleMultiParams(0x7080900)
    /Users/user/go/src/test/main.go:52 +0xf6
main.main()
    /Users/user/go/src/test/main.go:20 +0x61
```

可以看到：

* string传递时,分为pointer和length两个参数传递.
* int64传递时,复制了值进行传递.
* 看debug.Stack()
  打印出的调用栈,int8和bool传递时,传递的是一个内存地址,这似乎容易引起误解,难道传递的是caller里变量的内存地址？那不是会导致callee修改也导致caller里值也发生改变？当然不是这样！int和bool当然都是值传递.当caller传递给callee的时候,int和bool都会被在caller的栈里复制一份给callee使用.(
  在callee直接通过引用参数名修改参数值,这个参数的内存位置实际上是在caller的栈上).
* ExampleMultiParams函数虽然有四个参数,但是调用栈打印出来只传递了一个值
  0x7080900,这是为什么？原来这四个参数都是一个byte,合起来是一个双字.查看汇编代码可以发现编译器做了优化,直接组合成一个值,并在caller里用指令`MOVL $0x7080900, 0(SP)`
  写入栈上.当然,在caller里取值的时候,还是借助MOVB去一个字节一个字节取值的.当然,如果是这四个参数是main里的四个局部变量,调用ExampleMultiParams的时候通过传递变量名的形式调用(
  ExampleMultiParams(b, x, y, z)而不是 ExampleMultiParams(true, 9, 8, 7)的形式),体现在汇编代码里又是另一种形式.

#### Go 组合数据类型的参数传递

```go
package main

import (
"fmt"
"runtime/debug"
)

type MyStruct struct {
    a int
    b string
}

func main() {
    slice := make([]string, 2, 4)
    array := [...]int{9,8,7,6,7,8,9}
    myMap := make(map[string]int)
    myStruct := MyStruct{8, "test"}
    myStructPtr := &myStruct
    myChan := make(chan int, 4)


    ExampleSlice(slice)

    ExampleArray(array)

    ExampleMap(myMap)

    ExampleStruct(myStruct)

    ExamplePtr(myStructPtr)

    ExampleChan(myChan)
}

func ExampleSlice(slice []string){
    fmt.Println(string(debug.Stack()))
}

func ExampleArray(array [7]int){
    fmt.Println(string(debug.Stack()))
}

func ExampleMap(myMap map[string]int){
    fmt.Println(string(debug.Stack()))
}

func ExampleStruct(myStruct MyStruct){
    fmt.Println(string(debug.Stack()))
}

func ExamplePtr(ptr *MyStruct){
    fmt.Println(string(debug.Stack()))
}

func ExampleChan(myChan chan int){
    fmt.Println(string(debug.Stack()))
}
```

调用栈

```go
goroutine 1 [running]:
runtime/debug.Stack(0x130a568, 0xc00007eda8, 0x1004218)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleSlice(0xc00007ee78, 0x2, 0x4)
    /Users/user/go/src/test/main.go:62 +0x26
main.main()
    /Users/user/go/src/test/main.go:46 +0x159

goroutine 1 [running]:
runtime/debug.Stack(0x10e0a80, 0xc00008c000, 0xc00007ed98)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleArray(0x9, 0x8, 0x7, 0x6, 0x7, 0x8, 0x9)
    /Users/user/go/src/test/main.go:66 +0x26
main.main()
    /Users/user/go/src/test/main.go:48 +0x185

goroutine 1 [running]:
runtime/debug.Stack(0x10e0a80, 0xc00008c000, 0xc00007ed98)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleMap(0xc00007ee48)
    /Users/user/go/src/test/main.go:74 +0x26
main.main()
    /Users/user/go/src/test/main.go:52 +0x1af

goroutine 1 [running]:
runtime/debug.Stack(0x10e0a80, 0xc00008c000, 0xc00007ed98)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleStruct(0x8, 0x10c6f88, 0x4)
    /Users/user/go/src/test/main.go:78 +0x26
main.main()
    /Users/user/go/src/test/main.go:54 +0x1d7

goroutine 1 [running]:
runtime/debug.Stack(0x10e0a80, 0xc00008c000, 0xc00007ed98)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExamplePtr(0xc00007ee30)
    /Users/user/go/src/test/main.go:82 +0x26
main.main()
    /Users/user/go/src/test/main.go:56 +0x1e5

goroutine 1 [running]:
runtime/debug.Stack(0x10e0a80, 0xc00008c000, 0xc00007ed98)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.ExampleChan(0xc000092000)
    /Users/user/go/src/test/main.go:86 +0x26
main.main()
    /Users/user/go/src/test/main.go:58 +0x1f3
```

可以看到：

* 对于数组,结构体,指针,是复制一份拷贝传递给callee.
* 数组作为参数时,编译后参数的数量是数组元素的数量.
* 结构体作为参数时,编译后参数的数量需要再次分析结构体里元素的类型.如上述代码里结构体由一个int和一个string组成,传递参数时是int值,string的地址,string的长度三个参数.
* slice传递时,会将slice底层的pointer,len,cap作为三个参数分开传递.(即编译后,参数数量由源代码里的一个参数变为了三个参数).所以slice其实也是值传递.
* map,chan传递时,是将map,chan的地址指针作为参数传递.

### 方法：pointer receiver 与 value receiver

在 Java 中,当我们调用一个对象的方法的时候,当然是可以修改对象的成员变量的.但是在 Go 中,结果取决于定义方法时方法的接收者是值还是指针(value receiver 和 pointer receiver).

> Go 的方法接收者有两种,一种是值接收者(value receiver),一种是指针接收者(pointer receiver).值接收者,是接收者的类型是一个值,是一个副本,方法内部无法对其真正的接收者做更改.指针接收者,接收者的类型是一个指针,是接收者的引用,对这个引用的修改会影响真正的接收者.

看如下代码：

```go
package main

import "fmt"

type XAxis int

type Point struct{
    X int
    Y int
}


func (x XAxis)VIncr(offset XAxis){
    x += offset
    fmt.Printf("In VIncr, new x = %d\n", x)
}

func (x *XAxis)PIncr(offset XAxis){
    *x += offset
    fmt.Printf("In PIncr, new x = %d\n", *x)
}

func (p Point)VScale(factor int){
    p.X *= factor
    p.Y *= factor

    fmt.Printf("In VScale, new p = %v\n", p)
}


func (p *Point)PScale(factor int){
    p.X *= factor
    p.Y *= factor

    fmt.Printf("In PScale, new p = %v\n", p)
}

func main(){
    var x XAxis = 10

    fmt.Printf("In main, before VIncr, x = %v\n", x)
    x.VIncr(5)
    fmt.Printf("In main, after VIncr, new x = %v\n", x)

    fmt.Println()

    fmt.Printf("In main, before PIncr, x = %v\n", x)
    x.PIncr(5)
    fmt.Printf("In main, after PIncr, new x = %v\n", x)

    fmt.Println()

    p := Point{2, 2}

    fmt.Printf("In main, before VScale, p = %v\n", p)
    p.VScale(5)
    fmt.Printf("In main, after VScale, new p = %v\n", p)

    fmt.Println()

    fmt.Printf("In main, before PScale, p = %v\n", p)
    p.PScale(5)
    fmt.Printf("In main, after PScale, new p = %v\n", p)
}
```

输出：

```go
In main, before VIncr, x = 10
In VIncr, new x = 15
In main, after VIncr, new x = 10

In main, before PIncr, x = 10
In PIncr, new x = 15
In main, after PIncr, new x = 15

In main, before VScale, p = {2 2}
In VScale, new p = {10 10}
In main, after VScale, new p = {2 2}

In main, before PScale, p = {2 2}
In PScale, new p = &{10 10}
In main, after PScale, new p = {10 10}
```

在定义方法的时候,receiver 是在方法名的前面,而不是在参数列表里,那在方法执行的时候,方法内的指令怎么找到receiver的呢？

我们精简一下代码(注释掉 print 相关语句),然后把反编译：

```go
TEXT %22%22.XAxis.VIncr(SB) gofile../Users/user/go/src/test/main.go
  main.go:14        0xbb0            488b442408        MOVQ 0x8(SP), AX    
  main.go:14        0xbb5            4803442410        ADDQ 0x10(SP), AX    
  main.go:14        0xbba            4889442408        MOVQ AX, 0x8(SP)    
  main.go:16        0xbbf            c3            RET            

TEXT %22%22.(*XAxis).PIncr(SB) gofile../Users/user/go/src/test/main.go
  main.go:19        0xbd4            488b442408        MOVQ 0x8(SP), AX    
  main.go:19        0xbd9            8400            TESTB AL, 0(AX)        
  main.go:19        0xbdb            488b4c2408        MOVQ 0x8(SP), CX    
  main.go:19        0xbe0            8401            TESTB AL, 0(CX)        
  main.go:19        0xbe2            488b00            MOVQ 0(AX), AX        
  main.go:19        0xbe5            4803442410        ADDQ 0x10(SP), AX    
  main.go:19        0xbea            488901            MOVQ AX, 0(CX)        
  main.go:21        0xbed            c3            RET            

TEXT %22%22.Point.VScale(SB) gofile../Users/user/go/src/test/main.go
  main.go:24        0xc0a            488b442408        MOVQ 0x8(SP), AX    
  main.go:24        0xc0f            488b4c2418        MOVQ 0x18(SP), CX    
  main.go:24        0xc14            480fafc1        IMULQ CX, AX        
  main.go:24        0xc18            4889442408        MOVQ AX, 0x8(SP)    
  main.go:25        0xc1d            488b442410        MOVQ 0x10(SP), AX    
  main.go:25        0xc22            488b4c2418        MOVQ 0x18(SP), CX    
  main.go:25        0xc27            480fafc1        IMULQ CX, AX        
  main.go:25        0xc2b            4889442410        MOVQ AX, 0x10(SP)    
  main.go:28        0xc30            c3            RET            

TEXT %22%22.(*Point).PScale(SB) gofile../Users/user/go/src/test/main.go
  main.go:32        0xc47            488b442408        MOVQ 0x8(SP), AX    
  main.go:32        0xc4c            8400            TESTB AL, 0(AX)        
  main.go:32        0xc4e            488b4c2408        MOVQ 0x8(SP), CX    
  main.go:32        0xc53            8401            TESTB AL, 0(CX)        
  main.go:32        0xc55            488b00            MOVQ 0(AX), AX        
  main.go:32        0xc58            488b542410        MOVQ 0x10(SP), DX    
  main.go:32        0xc5d            480fafc2        IMULQ DX, AX        
  main.go:32        0xc61            488901            MOVQ AX, 0(CX)        
  main.go:33        0xc64            488b442408        MOVQ 0x8(SP), AX    
  main.go:33        0xc69            8400            TESTB AL, 0(AX)        
  main.go:33        0xc6b            488b4c2408        MOVQ 0x8(SP), CX    
  main.go:33        0xc70            8401            TESTB AL, 0(CX)        
  main.go:33        0xc72            488b4008        MOVQ 0x8(AX), AX    
  main.go:33        0xc76            488b542410        MOVQ 0x10(SP), DX    
  main.go:33        0xc7b            480fafc2        IMULQ DX, AX        
  main.go:33        0xc7f            48894108        MOVQ AX, 0x8(CX)    
  main.go:36        0xc83            c3            RET            

TEXT %22%22.main(SB) gofile../Users/user/go/src/test/main.go
  main.go:38        0xcaa            65488b0c2500000000    MOVQ GS:0, CX        [5:9]R_TLS_LE        
  main.go:38        0xcb3            483b6110        CMPQ 0x10(CX), SP    
  main.go:38        0xcb7            0f86b3000000        JBE 0xd70        
  main.go:38        0xcbd            4883ec50        SUBQ $0x50, SP        
  main.go:38        0xcc1            48896c2448        MOVQ BP, 0x48(SP)    
  main.go:38        0xcc6            488d6c2448        LEAQ 0x48(SP), BP    
  main.go:39        0xccb            48c74424300a000000    MOVQ $0xa, 0x30(SP)    
  main.go:42        0xcd4            48c704240a000000    MOVQ $0xa, 0(SP)    
  main.go:42        0xcdc            48c744240805000000    MOVQ $0x5, 0x8(SP)    
  main.go:42        0xce5            e800000000        CALL 0xcea        [1:5]R_CALL:%22%22.XAxis.VIncr    
  main.go:48        0xcea            488d442430        LEAQ 0x30(SP), AX    
  main.go:48        0xcef            48890424        MOVQ AX, 0(SP)        
  main.go:48        0xcf3            48c744240805000000    MOVQ $0x5, 0x8(SP)    
  main.go:48        0xcfc            e800000000        CALL 0xd01        [1:5]R_CALL:%22%22.(*XAxis).PIncr    
  main.go:53        0xd01            0f57c0            XORPS X0, X0        
  main.go:53        0xd04            0f11442438        MOVUPS X0, 0x38(SP)    
  main.go:53        0xd09            48c744243802000000    MOVQ $0x2, 0x38(SP)    
  main.go:53        0xd12            48c744244002000000    MOVQ $0x2, 0x40(SP)    
  main.go:56        0xd1b            48c7042402000000    MOVQ $0x2, 0(SP)    
  main.go:56        0xd23            48c744240802000000    MOVQ $0x2, 0x8(SP)    
  main.go:56        0xd2c            48c744241005000000    MOVQ $0x5, 0x10(SP)    
  main.go:56        0xd35            e800000000        CALL 0xd3a        [1:5]R_CALL:%22%22.Point.VScale    
  main.go:62        0xd3a            488d442438        LEAQ 0x38(SP), AX    
  main.go:62        0xd3f            48890424        MOVQ AX, 0(SP)        
  main.go:62        0xd43            48c744240805000000    MOVQ $0x5, 0x8(SP)    
  main.go:62        0xd4c            e800000000        CALL 0xd51        [1:5]R_CALL:%22%22.(*Point).PScale    
  main.go:64        0xd51            48c7042400000000    MOVQ $0x0, 0(SP)    
  main.go:64        0xd59            0f57c0            XORPS X0, X0        
  main.go:64        0xd5c            0f11442408        MOVUPS X0, 0x8(SP)    
  main.go:64        0xd61            e800000000        CALL 0xd66        [1:5]R_CALL:fmt.Println    
  main.go:65        0xd66            488b6c2448        MOVQ 0x48(SP), BP    
  main.go:65        0xd6b            4883c450        ADDQ $0x50, SP        
  main.go:65        0xd6f            c3            RET            
  main.go:38        0xd70            e800000000        CALL 0xd75        [1:5]R_CALL:runtime.morestack_noctxt    
  main.go:38        0xd75            e930ffffff        JMP %22%22.main(SB)    
```

以main.go 42行 x.VIncr(5)为例,在main里面,传递参数对应的指令是

```go
  main.go:42        0xcd4            48c704240a000000    MOVQ $0xa, 0(SP); 将值 10 作为第一个参数
  main.go:42        0xcdc            48c744240805000000    MOVQ $0x5, 0x8(SP); 将值 5 作为第二个参数    
  main.go:42        0xce5            e800000000        CALL 0xcea        [1:5]R_CALL:%22%22.XAxis.VIncr    
```

再看 x.VIncr 的汇编代码：

```go
  main.go:14        0xbb0            488b442408        MOVQ 0x8(SP), AX; 取第一个参数到寄存器AX    
  main.go:14        0xbb5            4803442410        ADDQ 0x10(SP), AX; 取第二个参数加到寄存器AX
  main.go:14        0xbba            4889442408        MOVQ AX, 0x8(SP); 将和写入到了第一个参数在栈上的位置
  main.go:16        0xbbf            c3            RET    
```

可以看到,方法 VIncr 的 receiver 是值,则caller在调用VIncr的时候,将这个值复制到栈上给VIncr的参数区里,在 VIncr 对receiver的修改,实际上是修改的这个参数区里的值,而不是 caller
栈里保存局部变量的区里的 receiver 的值（在语言使用者视角,就是 修改的是拷贝而不是原值）.

接着我们看main.go第48行 x.PIncr(5),在main里面,调用的指令是：

```go
  main.go:39        0xccb            48c74424300a000000    MOVQ $0xa, 0x30(SP)    
...
  main.go:48        0xcea            488d442430        LEAQ 0x30(SP), AX; 将SP+0x30这个内存地址保存到AX;    SP+0x30这个内存地址里存的是 10(执行 var x XAxis = 10 时定义的局部变量)
  main.go:48        0xcef            48890424        MOVQ AX, 0(SP); 将AX的值作为第一个参数.        
  main.go:48        0xcf3            48c744240805000000    MOVQ $0x5, 0x8(SP); 将 5 作为第二个参数    
  main.go:48        0xcfc            e800000000        CALL 0xd01        [1:5]R_CALL:%22%22.(*XAxis).PIncr
```

PIncr的汇编代码：

```go
  main.go:19        0xbd4            488b442408        MOVQ 0x8(SP), AX; 将第一个参数(即main的帧栈上局部变量 x 的内存地址)读取到AX    
  main.go:19        0xbd9            8400            TESTB AL, 0(AX)        
  main.go:19        0xbdb            488b4c2408        MOVQ 0x8(SP), CX; 将第一个参数(即main的帧栈上局部变量 x 的内存地址)读取到 CX    
  main.go:19        0xbe0            8401            TESTB AL, 0(CX)        
  main.go:19        0xbe2            488b00            MOVQ 0(AX), AX; 从 AX 里读到内存地址,从内存地址里拿到值,再读到AX(就是main的局部变量 x 的值)        
  main.go:19        0xbe5            4803442410        ADDQ 0x10(SP), AX; 将 第二个参数 5 加到 AX 里
  main.go:19        0xbea            488901            MOVQ AX, 0(CX); 将计算结果写入到 CX 里的内存地址(即 main的帧栈上局部变量 x 的内存地址)    
  main.go:21        0xbed            c3            RET    
```

可以看到,方法 PIncr 的 receiver 是指针(pointer),则caller在调用PIncr的时候,将这个pointer复制到栈上给PIncr的参数区里,在 PIncr 对receiver的修改,实际上是修改pointer指向的内存区域,也就是main的局部变量
x.（在语言使用者视角,就是 修改的是原值）.

打印调用栈,相比汇编更方便的看实际传递的参数：

```go
goroutine 1 [running]:
runtime/debug.Stack(0x1036126, 0x10a4360, 0xc000098000)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.XAxis.VIncr(0xa, 0x5)
    /Users/user/go/src/test/main.go:18 +0x26
main.main()
    /Users/user/go/src/test/main.go:47 +0x40

goroutine 1 [running]:
runtime/debug.Stack(0x10e0480, 0xc000094000, 0xc000080f10)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.(*XAxis).PIncr(0xc000080f70, 0x5)
    /Users/user/go/src/test/main.go:24 +0x33
main.main()
    /Users/user/go/src/test/main.go:53 +0x57

goroutine 1 [running]:
runtime/debug.Stack(0x10e0480, 0xc000094000, 0xc000080f10)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.Point.VScale(0x2, 0x2, 0x5)
    /Users/user/go/src/test/main.go:31 +0x26
main.main()
    /Users/user/go/src/test/main.go:61 +0x90

goroutine 1 [running]:
runtime/debug.Stack(0x10e0480, 0xc000094000, 0xc000080f10)
    /usr/local/go/src/runtime/debug/stack.go:24 +0x9d
main.(*Point).PScale(0xc000080f78, 0x5)
    /Users/user/go/src/test/main.go:39 +0x46
main.main()
    /Users/user/go/src/test/main.go:67 +0xa7
```

当方法的receiver是value的时候,调用方法时是把value拷贝一份作为第一个参数传递给callee的,这样caller里对receiver的修改实际上是修改的拷贝,不影响原值.当方法的receiver是pointer的时候,调用方法时是把pointer拷贝一份作为第一个参数传递给caller的,这样callee可以通过这个pointer修改原值.

**一点补充**

* 如果在方法里修改receiver的值要对caller生效,使用 pointer receiver
* 出于性能优化,如果receiver是结构体或者数组这样占用较多内存的数据类型,优先使用pointer receiver
  注意：

* 值接收器是并发安全的,而指针接收器不是并发安全的.
  调用规则：

* 类型 _T 的可调用方法集包含接受者为 _T 或 T 的所有方法集
* 类型 T 的可调用方法集包含接受者为 T 的所有方法
* **类型 T 的可调用方法集不包含接受者为 *T 的方法**
  **方法的接收者与函数/方法的参数的比较**：

* 函数/方法的实参类型和形参类型必须一致,(在语法上)不能一个是pointer而另一个是value.
* 方法的接收者比较智能,如果是 pointer receiver,在值上也可以调用这个方法（编译器会自动插入从值取到指针的指令）.如果是 value receiver,那么当在pointer上调用这个方法时,编译器会自动将pointer转换为pointer所对应的值.

### 匿名函数和闭包

#### 匿名函数

匿名函数由一个不带函数名的函数声明和函数体组成,匿名函数可以赋值给变量,作为结构体字段,或者在channel中传递.在底层实现中,实际上传递的是匿名函数的入口地址.

```go
package main

func test() func(int) int {
    return func(x int) int {
        x += x
        return x
    }
}

func main() {

    f := test()
    f(100)
}
```

```go
TEXT %22%22.test(SB) gofile../Users/user/go/src/test/main.go
  main.go:4        0x4e7            48c744240800000000    MOVQ $0x0, 0x8(SP)    
  main.go:5        0x4f0            488d0500000000        LEAQ 0(IP), AX        [3:7]R_PCREL:%22%22.test.func1·f    
  main.go:5        0x4f7            4889442408        MOVQ AX, 0x8(SP)    
  main.go:5        0x4fc            c3            RET            

TEXT %22%22.main(SB) gofile../Users/user/go/src/test/main.go
  main.go:11        0x517            65488b0c2500000000    MOVQ GS:0, CX        [5:9]R_TLS_LE        
  main.go:11        0x520            483b6110        CMPQ 0x10(CX), SP    
  main.go:11        0x524            7633            JBE 0x559        
  main.go:11        0x526            4883ec20        SUBQ $0x20, SP        
  main.go:11        0x52a            48896c2418        MOVQ BP, 0x18(SP)    
  main.go:11        0x52f            488d6c2418        LEAQ 0x18(SP), BP    
  main.go:12        0x534            e800000000        CALL 0x539        [1:5]R_CALL:%22%22.test    
  main.go:12        0x539            488b1424        MOVQ 0(SP), DX        
  main.go:12        0x53d            4889542410        MOVQ DX, 0x10(SP)    
  main.go:13        0x542            48c7042464000000    MOVQ $0x64, 0(SP)    
  main.go:13        0x54a            488b02            MOVQ 0(DX), AX        
  main.go:13        0x54d            ffd0            CALL AX            [0:0]R_CALLIND        
  main.go:14        0x54f            488b6c2418        MOVQ 0x18(SP), BP    
  main.go:14        0x554            4883c420        ADDQ $0x20, SP        
  main.go:14        0x558            c3            RET            
  main.go:11        0x559            e800000000        CALL 0x55e        [1:5]R_CALL:runtime.morestack_noctxt    
  main.go:11        0x55e            ebb7            JMP %22%22.main(SB)    

TEXT %22%22.test.func1(SB) gofile../Users/user/go/src/test/main.go
  main.go:5        0x58a            48c744241000000000    MOVQ $0x0, 0x10(SP)    
  main.go:6        0x593            488b442408        MOVQ 0x8(SP), AX    
  main.go:6        0x598            4803442408        ADDQ 0x8(SP), AX    
  main.go:6        0x59d            4889442408        MOVQ AX, 0x8(SP)    
  main.go:7        0x5a2            4889442410        MOVQ AX, 0x10(SP)
```

#### 闭包

当函数引用外部作用域的变量时,我们称之为闭包.在底层实现上,闭包由函数地址和引用到的变量的地址组成,并存储在一个结构体里,在闭包被传递时,实际是该结构体的地址被传递.因为栈帧上的值在该帧的函数退出后就失效了,因此闭包引用的外部作用域的变量会被分配到堆上.在以下的实现中,test()
函数返回一个闭包赋值给f,实际是main里收到闭包结构体(堆上)的地址,并保存在DX寄存器上,地址对应的内存值是闭包函数地址(函数地址取到寄存器之后,就可以通过 call 调用),地址偏移8个字节(
+8bytes)是变量x的的地址,在main里调用闭包函数f时,f内部依然是通过读取DX的值来得到变量x的地址.即**main调用f虽然没有传递参数也没有返回值,但是他们却共享了一个寄存器DX的值.**

![tech.mojotv.cn_](/assets/pic/c2dtZl9odHRwczovL2xlZXJpZ2h0Lm9zcy1jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vZ28vZnVuY3Rpb24vNy5wbmc.jpg)

```go
package main

func test() func() {
    x := 100
    return func() {
        x += 100
    }
}

func main() {
    f := test()
    f()
    f()
    f()
}
```

```go
TEXT %22%22.test(SB) gofile../Users/user/go/src/test/main.go
  main.go:3        0x6ad            65488b0c2500000000    MOVQ GS:0, CX        [5:9]R_TLS_LE        
  main.go:3        0x6b6            483b6110        CMPQ 0x10(CX), SP    
  main.go:3        0x6ba            0f869b000000        JBE 0x75b        
  main.go:3        0x6c0            4883ec28        SUBQ $0x28, SP        
  main.go:3        0x6c4            48896c2420        MOVQ BP, 0x20(SP)    
  main.go:3        0x6c9            488d6c2420        LEAQ 0x20(SP), BP    
  main.go:3        0x6ce            48c744243000000000    MOVQ $0x0, 0x30(SP)    
  main.go:4        0x6d7            488d0500000000        LEAQ 0(IP), AX        [3:7]R_PCREL:type.int    
  main.go:4        0x6de            48890424        MOVQ AX, 0(SP)        
  main.go:4        0x6e2            e800000000        CALL 0x6e7        [1:5]R_CALL:runtime.newobject    
  main.go:4        0x6e7            488b442408        MOVQ 0x8(SP), AX    
  main.go:4        0x6ec            4889442418        MOVQ AX, 0x18(SP)    
  main.go:4        0x6f1            48c70064000000        MOVQ $0x64, 0(AX)    
  main.go:5        0x6f8            488d0500000000        LEAQ 0(IP), AX        [3:7]R_PCREL:type.noalg.struct { F uintptr; %22%22.x *int }    
  main.go:5        0x6ff            48890424        MOVQ AX, 0(SP)        
  main.go:5        0x703            e800000000        CALL 0x708        [1:5]R_CALL:runtime.newobject    
  main.go:5        0x708            488b442408        MOVQ 0x8(SP), AX    
  main.go:5        0x70d            4889442410        MOVQ AX, 0x10(SP)    
  main.go:5        0x712            488d0d00000000        LEAQ 0(IP), CX        [3:7]R_PCREL:%22%22.test.func1    
  main.go:5        0x719            488908            MOVQ CX, 0(AX)        
  main.go:5        0x71c            488b442410        MOVQ 0x10(SP), AX    
  main.go:5        0x721            8400            TESTB AL, 0(AX)        
  main.go:5        0x723            488b4c2418        MOVQ 0x18(SP), CX    
  main.go:5        0x728            488d7808        LEAQ 0x8(AX), DI    
  main.go:5        0x72c            833d0000000000        CMPL $0x0, 0(IP)    [2:6]R_PCREL:runtime.writeBarrier+-1    
  main.go:5        0x733            7402            JE 0x737        
  main.go:5        0x735            eb1a            JMP 0x751        
  main.go:5        0x737            48894808        MOVQ CX, 0x8(AX)    
  main.go:5        0x73b            eb00            JMP 0x73d        
  main.go:5        0x73d            488b442410        MOVQ 0x10(SP), AX    
  main.go:5        0x742            4889442430        MOVQ AX, 0x30(SP)    
  main.go:5        0x747            488b6c2420        MOVQ 0x20(SP), BP    
  main.go:5        0x74c            4883c428        ADDQ $0x28, SP        
  main.go:5        0x750            c3            RET            
  main.go:5        0x751            4889c8            MOVQ CX, AX        
  main.go:5        0x754            e800000000        CALL 0x759        [1:5]R_CALL:runtime.gcWriteBarrier    
  main.go:5        0x759            ebe2            JMP 0x73d        
  main.go:3        0x75b            e800000000        CALL 0x760        [1:5]R_CALL:runtime.morestack_noctxt    
  main.go:3        0x760            e948ffffff        JMP %22%22.test(SB)    

TEXT %22%22.main(SB) gofile../Users/user/go/src/test/main.go
  main.go:10        0x7bc            65488b0c2500000000    MOVQ GS:0, CX        [5:9]R_TLS_LE        
  main.go:10        0x7c5            483b6110        CMPQ 0x10(CX), SP    
  main.go:10        0x7c9            763f            JBE 0x80a        
  main.go:10        0x7cb            4883ec18        SUBQ $0x18, SP        
  main.go:10        0x7cf            48896c2410        MOVQ BP, 0x10(SP)    
  main.go:10        0x7d4            488d6c2410        LEAQ 0x10(SP), BP    
  main.go:11        0x7d9            e800000000        CALL 0x7de        [1:5]R_CALL:%22%22.test    
  main.go:11        0x7de            488b1424        MOVQ 0(SP), DX        
  main.go:11        0x7e2            4889542408        MOVQ DX, 0x8(SP)    
  main.go:12        0x7e7            488b02            MOVQ 0(DX), AX        
  main.go:12        0x7ea            ffd0            CALL AX            [0:0]R_CALLIND        
  main.go:13        0x7ec            488b542408        MOVQ 0x8(SP), DX    
  main.go:13        0x7f1            488b02            MOVQ 0(DX), AX        
  main.go:13        0x7f4            ffd0            CALL AX            [0:0]R_CALLIND        
  main.go:14        0x7f6            488b542408        MOVQ 0x8(SP), DX    
  main.go:14        0x7fb            488b02            MOVQ 0(DX), AX        
  main.go:14        0x7fe            ffd0            CALL AX            [0:0]R_CALLIND        
  main.go:15        0x800            488b6c2410        MOVQ 0x10(SP), BP    
  main.go:15        0x805            4883c418        ADDQ $0x18, SP        
  main.go:15        0x809            c3            RET            
  main.go:10        0x80a            e800000000        CALL 0x80f        [1:5]R_CALL:runtime.morestack_noctxt    
  main.go:10        0x80f            ebab            JMP %22%22.main(SB)    

TEXT %22%22.test.func1(SB) gofile../Users/user/go/src/test/main.go
  main.go:5        0x84b            4883ec10        SUBQ $0x10, SP        
  main.go:5        0x84f            48896c2408        MOVQ BP, 0x8(SP)    
  main.go:5        0x854            488d6c2408        LEAQ 0x8(SP), BP    
  main.go:5        0x859            488b4208        MOVQ 0x8(DX), AX    
  main.go:5        0x85d            48890424        MOVQ AX, 0(SP)        
  main.go:6        0x861            48830064        ADDQ $0x64, 0(AX)    
  main.go:7        0x865            488b6c2408        MOVQ 0x8(SP), BP    
  main.go:7        0x86a            4883c410        ADDQ $0x10, SP        
  main.go:7        0x86e            c3            RET        
```

#### 递归函数

从本质上讲递归函数与普通函数并无特殊之处,只是不断调用自身,栈不断增加而已.在 C 里面栈大小是固定的,因此需要关心栈溢出(Stack overflow)的问题.不过 Go 里面栈根据需要自动扩容,不需要担心这个问题.

### 关于 defer 语句

#### defer与return

可以先看一下下面三个函数,尝试推理函数的返回值：

```go
func f() (result int) {
    defer func() {
        result++
    }()
    return 0
}

func f() (r int) {
     t := 5 
     defer func() {
       t = t + 5
     }()
     return t
}

func f() (r int) {
    defer func(r int) {
          r = r + 5
    }(r)
    return 1
}
```

正确答案分别是：1,5,1.如果您的答案正确,可以略过下面的解释了 :)

"defer 后的函数调用 在 return 语句之前执行"这句话并不容易理解正确.实际上 return xxx 语句不是原子的,而是先将xxx写入到 caller 为返回值分配的栈空间,接着执行 RET 指令这两步操作.defer函数就是插入在
RET 指令前执行.

> goroutine的控制结构里有一张记录defer表达式的表,编译器在defer出现的地方插入了指令 call runtime.deferproc,它将defer的表达式记录在表中.然后在函数返回之前依次从defer表中将表达式出栈执行,这时插入的指令是call
> runtime.deferreturn.

#### defer 与闭包

**defer 语句调用的函数的参数是在defer注册时求值或复制的**.因此局部变量作为参数传递给defer的函数语句后,后面对局部变量的修改将不再影响defer函数内对该变量值的使用.但是defer函数里使用非参数传入的外部函数的变量,将使用到该变量在外部函数生命周期内最终的值.

```go
package main

import "fmt"


func test() {
    x, y := 10, 20
    defer func(i int) {
        fmt.Println("defer:", i, y)
    }(x)

    x += 10
    y += 100
    fmt.Println(x, y)
}

func main(){
    test()
}
```

```go
输出：
20 120
defer: 10 120
```

### 备注：

* 内存中栈从高地址空间向低地址空间增长,栈顶比栈底的内存地址小,分配栈空间对应的是 sp 值的减小.
* 写值是从低地址往高地址写,比如 SP 指向 0xff00,往栈里写入一个字(8 字节),占用的是 0xff00 到 0xff07 这 8 个字节.
* intel存储字节的顺序为小端优先：即低有效字节存储在内存低地址中.
* 在IA-32和X86-64中,字长定义为16位,dword（双倍字）是 32 位,qword（四倍字）是64位.

#### 生成汇编文件的方法

1. 使用 `go tool compile -N -l -S go_file.go` 生成
2. 使用 `go tool compile -N -l go_file.go`编译成二进制文件,接着执行 `go tool objdump bin_name.o`反汇编出代码,可以通过 -s
   指定函数名从而只反汇编特定函数：`go tool objdump -s YOUR_FUNC_NAME bin_name.o`
3. 使用 `go build -gcflags -S`生成 注意：go tool compile 和 go build -gcflags -S 生成的是过程中的汇编,go tool objdump生成的是最终的机器码的汇编.

### 总结

Go 语言完全使用栈来传递参数和返回值并由调用者负责清栈,通过栈传递返回值使得Go函数能支持多返回值,调用者清栈则可以实现可变参数的函数.Go
使用值传递的模式传递参数,因此传递数组和结构体时,应该尽量使用指针作为参数来避免大量数据拷贝从而提升性能.

Go 方法调用的时候是将接收者作为参数传递给了callee,接收者分值接收者和指针接收者.

当传递匿名函数的时候,传递的实际上是函数的入口指针.当使用闭包的时候,Go 通过逃逸分析机制将变量分配到堆内存,变量地址和函数入口地址组成一个存在堆上的结构体,传递闭包的时候,传递的就是这个结构体的地址.

Go 的数据类型分为值类型和引用类型,但 Go 的参数传递是值传递.当传递的是值类型的时候,是完全的拷贝,callee里对参数的修改不影响原值;当传递的是引用类型的时候,callee里的修改会影响原值.

带返回值的return语句对应的是多条机器指令,首先是将返回值写入到caller在栈上为返回值分配的空间,然后执行ret指令.有defer语句的时候,defer语句里的函数就是插入到 ret 指令之前执行.

