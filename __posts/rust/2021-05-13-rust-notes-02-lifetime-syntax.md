---
layout: post
title: "Rust笔记:02-Lifetime 与 References 有效性"
category: Rust
tags: Rust笔记
keywords: 'rust,References,Lifetime'
description: 'Rust 中的每一个 References 都有其 Lifetime,也就是 References 保持有效的 Scope '
coverage: rust-lifetime.png
permalink: /:categories/:title
date: 2020-05-08T15:58:54+08:00
---


Rust 中的每一个 References 都有其 Lifetime,也就是 References 保持有效的 Scope.
大部分时候 Lifetime 是隐含并可以推断的,正如大部分时候类型也是可以推断的一样.
类似于当因为有多种可能类型的时候必须注明类型,也会出现 References 的 Lifetime 以一些不同方式相关联的情况,

Rust 需要我们使用`Generic Lifetime 参数`来注明他们的关系,这样就能确保运行时实际使用的 References 绝对是有效的.

Lifetime 的概念从某种程度上说不同于其他语言中类似的工具,毫无疑问这是 Rust 最与众不同的功能.

## Lifetime 避免了 Dangling References

Lifetime 的主要目标是避免 Dangling References,它会导致程序 References 了非预期 References 的数据.

这些代码不能编译

```
{
    let r;//声明了没有初始值的变量,所以这些变量存在于外部 Scope 
    //这乍看之下好像和 Rust 不允许存在空值相冲突
    {
        let x = 5;
        r = &x;//给它一个值之前使用这个变量,会出现一个编译时错误,这就说明了 Rust 确实不允许空值.
    }
    println!("r: {}", r); //尝试使用离开 Scope 的值的 References 
}
```

外部 Scope 声明了一个没有初值的变量 r,而内部 Scope 声明了一个初值为 5 的变量x.
在内部 Scope 中,我们尝试将 r 的值设置为一个 x 的 References.
接着在内部 Scope 结束后,尝试打印出 r 的值.这段代码不能编译因为 r References 的值在尝试使用之前就离开了 Scope.

变量 x 并没有 "存在的足够久".其原因是 x 在到达第 7 行内部 Scope 结束时就离开了 Scope.
不过 r 在外部 Scope 仍是有效的； Scope 越大我们就说它 "存在的越久".如果 Rust 允许这段代码工作,r 将会 References 在 x 离开 Scope 时被释放的内存,这时尝试对 r 做任何操作都不能正常工作.
那么 Rust 是如何决定这段代码是不被允许的呢？这得益于borrow checker.

## Borrow Checker

Rust 编译器有一个 borrow checker,它比较 Scope 来确保所有的 borrow 都是有效的.

相同的例子不过带有变量 Lifetime 的注释：

这些代码不能编译！

```
{
    let r;                // ---------+-- 'a
                          //          |
    {                     //          |
        let x = 5;        // -+-- 'b  |
        r = &x;           //  |       |
    }                     // -+       |
                          //          |
    println!("r: {}", r); //          |
}                         // ---------+
```

r 和 x 的 Lifetime 注解,分别叫做 'a 和 'b

这里将 r 的 Lifetime 标记为 'a 并将 x 的 Lifetime 标记为 'b.
如你所见,内部的 'b 块要比外部的 Lifetime  'a 小得多.在编译时,Rust 比较这两个 Lifetime 的大小,并发现 r 拥有 Lifetime  'a,不过它 References 了一个拥有 Lifetime  'b 的对象
.程序被拒绝编译,因为 Lifetime  'b 比 Lifetime  'a 要小：被 References 的对象比它的 References 者存在的时间更短.

让我们看看示例中这个并没有产生Dangling References 且可以正确编译的例子：

```
{
    let x = 5;            // ----------+-- 'b
                          //           |
    let r = &x;           // --+-- 'a  |
                          //   |       |
    println!("r: {}", r); //   |       |
                          // --+       |
}     
                          // ----------+

```

一个有效的 References ,因为数据比 References 有着更长的 Lifetime

这里 x 拥有 Lifetime  'b,比 'a 要大.这就意味着 r 可以 References x：Rust 知道 r 中的 References 在 x 有效的时候也总是有效的.

现在我们已经在一个具体的例子中展示了 References 的 Lifetime 位于何处,并讨论了 Rust 如何分析 Lifetime 来保证 References 总是有效的,接下来让我们聊聊在 Function 的上下文中参数和返回值的Generic
Lifetime.

## Generic Lifetimes in Functions

让我们来编写一个返回两个String slice 中较长者的 Function.这个 Function 获取两个String slice 并返回一个String slice.
一旦我们实现了 longest Function ,示例中的代码应该会打印出 The longest string is abcd：

文件名: src/main.rs

```
fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";
    let result = longest(string1.as_str(), string2);
    println!("The longest string is {}", result);
}
```

main Function 调用 longest Function 来寻找两个 String slice 中较长的一个

注意这个 Function 获取作为 References 的 String slice,因为我们不希望 longest Function 获取参数的Ownership.
我们期望该 Function 接受 String 的 slice（参数 string1 的类型）和String字面值（包含于参数 string2）

如果尝试像示例中那样实现 longest Function ,它并不能编译：

文件名: src/main.rs

这些代码不能编译！

```
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

一个 longest Function 的实现,它返回两个String slice 中较长者,现在还不能编译

提示文本揭示了返回值需要一个 Generic Lifetime 参数,因为 Rust 并不知道将要返回的 References 是指向 x 或 y.
事实上我们也不知道,因为 Function 体中 if 块返回一个 x 的 References 而 else 块返回一个 y 的 References ！

当我们定义这个 Function 的时候,并不知道传递给 Function 的具体值,所以也不知道到底是 if 还是 else 会被执行.
我们也不知道传入的 References 的具体 Lifetime ,所以也就不能通过观察 Scope 来确定返回的 References 是否总是有效.
borrow checker 自身同样也无法确定,因为它不知道 x 和 y 的 Lifetime 是如何与返回值的 Lifetime 相关联的.

为了修复这个错误,我们将增加Generic Lifetime 参数来定义 References 间的关系以便borrow checker可以进行分析.

## Lifetime 注解语法

> Lifetime 注解并不改变任何 References 的 Lifetime 的长短.

与当 Function 签名中指定了Generic类型参数后就可以接受任何类型一样,当指定了Generic Lifetime 后 Function 也能接受任何 Lifetime 的 References.

> Lifetime 注解描述了多个 References Lifetime 相互的关系,而不影响其 Lifetime.

Lifetime 注解有着一个不太常见的语法：

> Lifetime 参数名称必须以撇号（'）开头,其名称通常全是小写,类似于Generic其名称非常短.
> 'a 是大多数人默认使用的名称. Lifetime 参数注解位于 References 的 & 之后,并有一个空格来将 References 类型与 Lifetime 注解分隔开.

这里有一些例子：
我们有一个没有 Lifetime 参数的 i32 的 References ,一个有叫做 'a 的 Lifetime 参数的 i32 的 References ,和一个 Lifetime 也是 'a 的 i32 的可变 References ：

&i32 // References
&'a i32 // 带有显式 Lifetime 的 References
&'a mut i32 // 带有显式 Lifetime 的可变 References

> 单个的 Lifetime 注解本身没有多少意义,因为 Lifetime 注解告诉 Rust 多个 References 的Generic Lifetime 参数如何相互联系的.

例如如果 Function 有一个 Lifetime  'a 的 i32 的 References 的参数 first.还有另一个同样是 Lifetime  'a 的 i32 的 References 的参数 second.
这两个 Lifetime 注解意味着 References first 和 second 必须与这Generic Lifetime 存在得一样久.

### Function 签名中的 Lifetime 注解

现在来看看 longest Function 的上下文中的 Lifetime.

> 就像Generic类型参数,Generic Lifetime 参数需要声明在 Function 名和参数列表间的尖括号中.

这里我们想要告诉 Rust 关于参数中的 References 和返回值之间的限制是他们都必须拥有相同的 Lifetime ,
就像示例中在每个 References 中都加上了 'a 那样：

文件名: src/main.rs

```
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

示例 longest Function 定义指定了签名中所有的 References 必须有相同的 Lifetime 'a

这段代码能够编译并会产生我们希望得到的示例中的 main Function 的结果.

现在 Function 签名表明对于某些 Lifetime 'a, Function 会获取两个参数,他们都是与 Lifetime 'a 存在的一样长的String slice.
Function 会返回一个同样也与 Lifetime  'a 存在的一样长的String slice.
它的实际含义是 longest Function 返回的 References 的 Lifetime 与传入该 Function 的 References 的 Lifetime 的较小者一致.

> 记住通过在 Function 签名中指定 Lifetime 参数时,我们并没有改变任何传入值或返回值的 Lifetime ,
> 而是指出任何不满足这个约束条件的值都将被borrow checker拒绝.

注意 longest Function 并不需要知道 x 和 y 具体会存在多久,而只需要知道有某个可以被 'a 替代的 Scope 将会满足这个签名.

当在 Function 中使用 Lifetime 注解时,这些注解出现在 Function 签名中,而不存在于 Function 体中的任何代码中.这是因为 Rust 能够分析 Function 中代码而不需要任何协助,
不过当 Function References 或被 Function 之外的代码 References 时,让 Rust 自身分析出参数或返回值的 Lifetime 几乎是不可能的.

这些 Lifetime 在每次 Function be called时都可能不同.这也就是为什么我们需要手动标记 Lifetime.

当具体的 References 被传递给 longest 时,被 'a 所替代的具体 Lifetime 是 x 的 Scope 与 y 的 Scope 相重叠的那一部分.
换一种说法就是Generic Lifetime 'a 的具体 Lifetime 等同于 x 和 y 的 Lifetime 中较小的那一个.
因为我们用相同的 Lifetime 参数 'a 标注了返回的 References 值,
所以返回的 References 值就能保证在 x 和 y 中较短的那个 Lifetime 结束之前保持有效.

让我们看看如何通过传递拥有不同具体 Lifetime 的 References 来限制 longest Function 的使用.示例是一个很直观的例子.

文件名: src/main.rs

```
fn main() {
let string1 = String::from("long string is long");

    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is {}", result);
    }
}
```

示例：通过拥有不同的具体 Lifetime 的 String 值调用 longest Function

在这个例子中,string1 直到外部 Scope 结束都是有效的,string2 则在内部 Scope 中是有效的,而 result 则 References 了一些直到内部 Scope 结束都是有效的值.
borrow checker认可这些代码；它能够编译和运行,并打印出 The longest string is long string is long.

接下来,让我们尝试另外一个例子,该例子揭示了 result 的 References 的 Lifetime 必须是两个参数中较短的那个.
以下代码将 result 变量的声明移动出内部 Scope ,但是将 result 和 string2 变量的赋值语句一同留在内部 Scope 中.接着,使用了变量 result 的 println! 也被移动到内部 Scope 之外.
注意示例中的代码不能通过编译：

文件名: src/main.rs 这些代码不能编译！

```
fn main() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
    }
    println!("The longest string is {}", result);
}
```

错误表明为了保证 println! 中的 result 是有效的,string2 需要直到外部 Scope 结束都是有效的.Rust 知道这些是因为（longest） Function 的参数和返回值都使用了相同的 Lifetime 参数 'a.

如果从人的角度读上述代码,我们可能会觉得这个代码是正确的. string1 更长,因此 result 会包含指向 string1 的 References.因为 string1 尚未离开 Scope ,对于 println! 来说 string1 的
References 仍然是有效的.然而,我们通过 Lifetime 参数告诉 Rust 的是： longest Function 返回的 References 的 Lifetime 应该与传入参数的 Lifetime 中较短那个保持一致.因此,borrow
checker不允许示例 10-24 中的代码,因为它可能会存在无效的 References.

请尝试更多采用不同的值和不同 Lifetime 的 References 作为 longest Function 的参数和返回值的实验.并在开始编译前猜想你的实验能否通过borrow checker,接着编译一下看看你的理解是否正确！

## 深入理解 Lifetime

> 指定 Lifetime 参数的正确方式依赖 Function 实现的具体功能.

例如,如果将 longest Function 的实现修改为总是返回第一个参数而不是最长的String slice,就不需要为参数 y 指定一个 Lifetime.如下代码将能够编译：

文件名: src/main.rs

```
fn longest<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

在这个例子中,我们为参数 x 和返回值指定了 Lifetime 参数 'a,不过没有为参数 y 指定,因为 y 的 Lifetime 与参数 x 和返回值的 Lifetime 没有任何关系.

> 当从 Function 返回一个 References ,返回值的 Lifetime 参数需要与一个参数的 Lifetime 参数相匹配.

> 如果返回的 References 没有指向任何一个参数,那么唯一的可能就是它指向一个 Function 内部创建的值,它将会是一个 Dangling References,因为它将会在 Function 结束时离开 Scope.

尝试考虑这个并不能编译的 longest Function 实现：

文件名: src/main.rs 这些代码不能编译！

```
fn longest<'a>(x: &str, y: &str) -> &'a str {
    let result = String::from("really long string");
    result.as_str()
}
```

即便我们为返回值指定了 Lifetime 参数 'a,这个实现却编译失败了,因为返回值的 Lifetime 与参数完全没有关联.这里是会出现的错误信息：

出现的问题是 result 在 longest Function 的结尾将离开 Scope 并被清理,
而我们尝试从 Function 返回一个 result 的 References.无法指定 Lifetime 参数来改变Dangling References ,
而且 Rust 也不允许我们创建一个Dangling References.在这种情况,最好的解决方案是返回一个有Ownership的数据类型而不是一个 References ,这样 Function 调用者就需要负责清理这个值了.

综上, Lifetime 语法是用于将 Function 的多个参数与其返回值的 Lifetime 进行关联的.一旦他们形成了某种关联,Rust 就有了足够的信息来允许内存安全的操作并阻止会产生Dangling指针亦或是违反内存安全的行为.

## 结构体定义中的 Lifetime 注解

目前为止,我们只定义过有Ownership类型的结构体.接下来,我们将定义包含 References 的结构体,不过这需要为结构体定义中的每一个 References 添加 Lifetime 注解.示例 10-25 中有一个存放了一个String
slice 的结构体 ImportantExcerpt：

文件名: src/main.rs

```
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");
    let i = ImportantExcerpt { part: first_sentence };
}
```

示例：一个存放 References 的结构体,所以其定义需要 Lifetime 注解

这个结构体有一个字段,part,它存放了一个String slice,这是一个 References.
类似于Generic参数类型,必须在结构体名称后面的尖括号中声明Generic Lifetime 参数,以便在结构体定义中使用 Lifetime 参数.这个注解意味着 ImportantExcerpt 的实例不能比其 part 字段中的
References 存在的更久.

这里的 main Function 创建了一个 ImportantExcerpt 的实例,它存放了变量 novel 所拥有的 String 的第一个句子的 References.novel 的数据在 ImportantExcerpt 实例创建之前就存在.另外,直到
ImportantExcerpt 离开 Scope 之后 novel 都不会离开 Scope ,所以 ImportantExcerpt 实例中的 References 是有效的.

## Lifetime 省略（Lifetime Elision）

现在我们已经知道了每一个 References 都有一个 Lifetime ,而且我们需要为那些使用了 References 的 Function 或结构体指定 Lifetime.然而,第四章的示例 4-9 中有一个 Function ,如示例 10-26
所示,它没有 Lifetime 注解却能编译成功：

文件名: src/lib.rs

```
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

示例：定义了一个没有使用 Lifetime 注解的 Function ,即便其参数和返回值都是 References

这个 Function 没有 Lifetime 注解却能编译是由于一些历史原因：在早期版本（pre-1.0）的 Rust 中,这的确是不能编译的.每一个 References 都必须有明确的 Lifetime.那时的 Function 签名将会写成这样：

`fn first_word<'a>(s: &'a str) -> &'a str {`
在编写了很多 Rust 代码后,Rust 团队发现在特定情况下 Rust 程序员们总是重复地编写一模一样的 Lifetime 注解.
这些场景是可预测的并且遵循几个明确的模式.接着 Rust 团队就把这些模式编码进了 Rust 编译器中,如此borrow checker在这些情况下就能推断出 Lifetime 而不再强制程序员显式的增加注解.

这里我们提到一些 Rust 的历史是因为更多的明确的模式被合并和添加到编译器中是完全可能的.未来只会需要更少的 Lifetime 注解.

被编码进 Rust References 分析的模式被称为 Lifetime 省略规则（lifetime elision rules）.

这并不是需要程序员遵守的规则；这些规则是一系列特定的场景,此时编译器会考虑,如果代码符合这些场景,就无需明确指定 Lifetime.

省略规则并不提供完整的推断：如果 Rust 在明确遵守这些规则的前提下变量的 Lifetime 仍然是模棱两可的话,它不会猜测剩余 References 的 Lifetime 应该是什么.在这种情况,编译器会给出一个错误,这可以通过增加对应
References 之间相联系的 Lifetime 注解来解决.

Function 或方法的参数的 Lifetime 被称为 输入 Lifetime （input lifetimes）,而返回值的 Lifetime 被称为 输出 Lifetime （output lifetimes）.

编译器采用三条规则来判断 References 何时不需要明确的注解.第一条规则适用于输入 Lifetime ,后两条规则适用于输出 Lifetime.
如果编译器检查完这三条规则后仍然存在没有计算出 Lifetime 的 References ,编译器将会停止并生成错误.这些规则适用于 fn 定义,以及 impl 块.

第一条规则是每一个是 References 的参数都有它自己的 Lifetime 参数.换句话说就是,有一个 References 参数的 Function 有一个 Lifetime 参数：fn foo<'a>(x: &'a i32),有两个 References 参数的
Function 有两个不同的 Lifetime 参数,fn foo<'a, 'b>(x: &'a i32, y: &'b i32),依此类推.

第二条规则是如果只有一个输入 Lifetime 参数,那么它被赋予所有输出 Lifetime 参数：fn foo<'a>(x: &'a i32) -> &'a i32.

第三条规则是如果方法有多个输入 Lifetime 参数并且其中一个参数是 &self 或 &mut self,说明是个对象的方法(method)(译者注： 这里涉及rust的面向对象参见17章), 那么所有输出 Lifetime 参数被赋予
self 的 Lifetime.第三条规则使得方法更容易读写,因为只需更少的符号.

假设我们自己就是编译器.并应用这些规则来计算示例中 first_word Function 签名中的 References 的 Lifetime.开始时签名中的 References 并没有关联任何 Lifetime:

fn first_word(s: &str) -> &str {
接着编译器应用第一条规则,也就是每个 References 参数都有其自己的 Lifetime.我们像往常一样称之为 'a,所以现在签名看起来像这样：

fn first_word<'a>(s: &'a str) -> &str {
对于第二条规则,因为这里正好只有一个输入 Lifetime 参数所以是适用的.第二条规则表明输入参数的 Lifetime 将被赋予输出 Lifetime 参数,所以现在签名看起来像这样：

fn first_word<'a>(s: &'a str) -> &'a str {
现在这个 Function 签名中的所有 References 都有了 Lifetime ,如此编译器可以继续它的分析而无须程序员标记这个 Function 签名中的 Lifetime.

让我们再看看另一个例子,这次我们从示例中没有 Lifetime 参数的 longest Function 开始：

fn longest(x: &str, y: &str) -> &str {
再次假设我们自己就是编译器并应用第一条规则：每个 References 参数都有其自己的 Lifetime.这次有两个参数,所以就有两个（不同的） Lifetime ：

fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str {
再来应用第二条规则,因为 Function 存在多个输入 Lifetime ,它并不适用于这种情况.再来看第三条规则,它同样也不适用,这是因为没有 self 参数.应用了三个规则之后编译器还没有计算出返回值类型的
Lifetime.这就是为什么在编译示例 10-21 的代码时会出现错误的原因：编译器使用所有已知的 Lifetime 省略规则,仍不能计算出签名中所有 References 的 Lifetime.

因为第三条规则真正能够适用的就只有方法签名,现在就让我们看看那种情况中的 Lifetime ,并看看为什么这条规则意味着我们经常不需要在方法签名中标注 Lifetime.

### 方法定义中的 Lifetime 注解

当为带有 Lifetime 的结构体实现方法时,其语法依然类似示例 10-11 中展示的Generic类型参数的语法.声明和使用 Lifetime 参数的位置依赖于 Lifetime 参数是否同结构体字段或方法参数和返回值相关.

（实现方法时）结构体字段的 Lifetime 必须总是在 impl 关键字之后声明并在结构体名称之后被使用,因为这些 Lifetime 是结构体类型的一部分.

impl 块里的方法签名中, References 可能与结构体字段中的 References 相关联,也可能是独立的.另外, Lifetime 省略规则也经常让我们无需在方法签名中使用 Lifetime 注解.让我们看看一些使用示例
10-25 中定义的结构体 ImportantExcerpt 的例子.

首先,这里有一个方法 level.其唯一的参数是 self 的 References ,而且返回值只是一个 i32,并不 References 任何值：

```
impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
}
```

impl 之后和类型名称之后的 Lifetime 参数是必要的,不过因为第一条 Lifetime 规则我们并不必须标注 self References 的 Lifetime.

这里是一个适用于第三条 Lifetime 省略规则的例子：

```
impl<'a> ImportantExcerpt<'a> {
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention please: {}", announcement);
        self.part
    }
}
```

这里有两个输入 Lifetime ,所以 Rust 应用第一条 Lifetime 省略规则并给予 &self 和 announcement 他们各自的 Lifetime.接着,因为其中一个参数是 &self,返回值类型被赋予了 &self 的 Lifetime
,这样所有的 Lifetime 都被计算出来了.

### 静态 Lifetime

这里有一种特殊的 Lifetime 值得讨论：'static,其 Lifetime 能够存活于整个程序期间.所有的String字面值都拥有 'static Lifetime ,我们也可以选择像下面这样标注出来：

let s: &'static str = "I have a static lifetime.";
这个String的文本被直接储存在程序的二进制文件中而这个文件总是可用的.因此所有的String字面值都是 'static 的.

你可能在错误信息的帮助文本中见过使用 'static Lifetime 的建议,不过将 References 指定为 'static 之前,思考一下这个 References 是否真的在整个程序的 Lifetime
里都有效.你也许要考虑是否希望它存在得这么久,即使这是可能的.大部分情况,代码中的问题是尝试创建一个Dangling References 或者可用的 Lifetime 不匹配,请解决这些问题而不是指定一个 'static
的 Lifetime.

结合Generic类型参数、trait bounds 和 Lifetime
让我们简要的看一下在同一 Function 中指定Generic类型参数、trait bounds 和 Lifetime 的语法！

```
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(x: &'a str, y: &'a str, ann: T) -> &'a str where T: Display{
    println!("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

```

这个是示例中那个返回两个String slice 中较长者的 longest Function ,
不过带有一个额外的参数 ann.ann 的类型是Generic T,它可以被放入任何实现了 where 从句中指定的 Display trait 的类型.
这个额外的参数会在 Function 比较String slice 的长度之前被打印出来,这也就是为什么 Display trait bound 是必须的.因为 Lifetime 也是Generic,所以 Lifetime 参数 'a 和Generic类型参数 T
都位于 Function 名后的同一尖括号列表中.
