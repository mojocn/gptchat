---
layout: post
title: "Rust-Crate:01-Quote 语法树数据结构转源代码标记宏"
category: Rust
tags: Rust笔记
keywords: 'rust,quote,macro,syn,procedural macro,过程宏'
description: 'quote crate 提供了quote!将 Rust 语法树数据结构转换为源代码标记的宏'
permalink: /:categories/:title
date: 2022-01-13T10:58:54+08:00
---

## 0. Quote Crate

quote crate 提供了 `quote!` 将 Rust 语法树数据结构转换为源代码标记的宏.

Rust 中的过程宏 (procedural macro) 接收标记流 (`TokenStream`) 作为输入，执行任意 Rust 代码以确定如何操作这些标记，
并生成标记流 (`TokenStream`) 以交回编译器以编译到调用者的 crate 中。准引用 (Quasi-quoting) 是其中一个解决方案: 生成标记以返回给编译器.

准引用 (Quasi-quoting) 的思想是我们编写我们视为数据的代码.
在 `quote!` 宏中，我们可以将看起来像代码的内容写入我们的文本编辑器或 IDE.
我们得到了编辑器的大括号匹配、语法高亮、缩进和自动补全的所有好处.
但是，与其将其作为代码编译到当前的 crate 中，我们可以将其视为数据，将其传递，改变它，并最终将其作为令牌返回给编译器以编译到宏调用者的 crate 中.

这个 crate 是由过程宏用例 (procedural macro case) 推动的，但它是一个通用的 Rust 准引用库，它的用途并不限于过程宏使用案例.

## 1. Quote Crate Example

您可能会在,与数据结构序列化有关的过程宏 (procedural macro) 中找到以下准引用 (quasi-quoted) 的代码块。
该 `#var` 语法将运行时变量 (runtime variables) 插值到引用的标记 (quoted tokens) 中.
查看 `quote!` 宏的文档以获取有关语法的更多详细信息.
另请参阅 `quote_spanned!` 对实施卫生程序宏很重要的宏 (hygienic procedural macros).

```rust
let tokens = quote! {
struct SerializeWith #generics #where_clause {
value: &'a #field_ty,
phantom: core::marker::PhantomData<#item_ty>,
}

    impl #generics serde::Serialize for SerializeWith #generics #where_clause {
        fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: serde::Serializer,
        {
            #path(self.value, serializer)
        }
    }

    SerializeWith {
        value: #value,
        phantom: core::marker::PhantomData::<#item_ty>,
    }
};
```

## 2.quote! 宏的语法

```rust
macro_rules! quote {
    () => { ... };
    ($($tt : tt) *) => { ... };
}
```

对输入执行变量插值并将其生成为 `proc_macro2::TokenStream`.

注意：要在过程宏 (procedural macro) 中将标记返回给编译器，请 `.into()` 在结果上使用 以转换为 `proc_macro::TokenStream`.

### 2.1 Interpolation

可变插与做 `#var`（类似于 `$var 在 `macro_rules!` 宏）.
这会抓取 `var` 当前范围内的变量并将其插入到输出标记中的该位置.
任何实现该 `ToTokens` 特征的类型都可以被插值. 这包括大多数 Rust 原始类型以及 `Syn crate` 中的大多数语法树类型.

重复使用 `#(...)*` 或 `#(...),*` 再次类似于 `macro_rules!`.
这将遍历在重复中插值的任何变量的元素，并为每个变量插入重复主体的副本. 插值中的变量可以是一个 `Vec`、 `slice` `BTreeSet` 或 any `Iterator`.

- `#(#var)*` : 没有分隔符
- `#(#var),*` : 星号前的字符用作分隔符
- `#( struct #var; )*` : 重复可以包含其他标记
- `#( #k => println!("{}", #v), )*` : 甚至多次插值

### 2.2 Hygiene

任何插值标记都会保留 `Span` 其 `ToTokens` 实现提供的信息. 源自 `quote!` 调用的标记用跨越 (spanned) `Span::call_site()`.

可以通过 `quote_spanned!` 宏提供不同的跨度。

### 2.3 Return type

这个宏 eval 类型的表达式proc_macro2::TokenStream. 同时，Rust 过程宏期望返回值类型是 `proc_macro::TokenStream`.

这两种类型之间的区别在于，`proc_macro` 类型完全特定于过程宏，并且不能存在于过程宏之外的代码中，而 `proc_macro2` 类型可能存在于任何地方，包括测试和非宏代码，如 main.rs 和 build.rs.
这就是为什么即使是程序宏生态系统也主要围绕proc_macro2.

有一个 [From](https://doc.rust-lang.org/std/convert/trait.From.html) 惯例 在两个方向上转换,
因此 `quote!` 返回的输出从程序宏看起来像 `tokens.into()` 或 `proc_macro::TokenStream::from(tokens)`.

### 2.4 Examples

#### 2.4.1 Procedural macro

基本 procedural macro 的结构如下.
有关作为程序宏的一部分使用的更多有用指导，请参阅 [Syn crate](https://github.com/dtolnay/syn) 中使用 `quote!`.

```rust
extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;

#[proc_macro_derive(HeapSize)]
pub fn derive_heap_size(input: TokenStream) -> TokenStream {
// Parse the input and figure out what implementation to generate...
let name = /* ... */;
let expr = /* ... */;

    let expanded = quote! {
        // The generated impl.
        impl heapsize::HeapSize for #name {
            fn heap_size_of_children(&self) -> usize {
                #expr
            }
        }
    };

    // Hand the output tokens back to the compiler.
    TokenStream::from(expanded)
}
```

#### 2.4.2 Combining quoted fragments 分片构建

通常，您最终不会在一个地方构造一个最终的一体的 `TokenStream`.
不同的部分可能来自不同的辅助函数. `quote!` 自己生成的令牌实现 `ToTokens`,
因此可以插入到以后的 `quote!` 调用中以建立最终结果.

```rust
let type_definition = quote! {...};
let methods = quote! {...};

let tokens = quote! {
#type_definition
#methods
};
```

#### 2.4.3 Constructing identifiers 构建标识符

假设我们有一个 `ident` 来自宏输入某处的标识符，我们需要以某种方式修改它以用于宏输出.
让我们考虑在***标识符前面加上下划线***.

简单地在下划线旁边插入标识符不会有连接它们的行为. 下划线和标识符将继续是两个单独的标记，就像您写的一样 `_ x`。

```rust
// incorrect 错误
quote! {
let mut _#ident = 0;
}
```

解决方案是使用正确的值构建一个新的标识符令牌. 由于这是一种常见的情况，`format_ident!` 宏提供了一个方便的实用程序来正确执行此操作.

```rust
let varname = format_ident!("_{}", ident);
quote! {
let mut #varname = 0;
}
```

或者，可以使用 `Syn` 和 `proc-macro2` 提供的 API 直接构建标识符. 这大致相当于上面的，但不会处理 `ident` 作为原始标识符.

```rust
let concatenated = format!("_{}", ident);
let varname = syn::Ident::new(&concatenated, ident.span());
quote! {
let mut #varname = 0;
}
```

#### 2.4.4 Making method calls 进行方法调用

假设我们的宏需要在宏输入中指定的某种类型才能拥有一个名为 `new`. 我们在一个名为 `type` 的变量中 `field_type` 有类型， `syn::Type` 并且想要调用构造函数。

```rust
// incorrect 错误
quote! {
let value = #field_type::new();
}
```

这仅在某些时候有效.如果 `field_type` 是 `String`, 则扩展代码包含 `String::new()` 哪个很好.
但是如果 `field_type` 是这样的，` Vec<i32>` 那么扩展的代码 `Vec<i32>::new()` 就是无效的语法.
通常我们会在手写的 Rust 中编写， `Vec::<i32>::new()` 但对于宏，通常以下更方便。

```rust
quote! {
let value = <#field_type>::new();
}
```

这扩展到 `<Vec<i32>>::new()` 哪个行为正确. 类似的模式适用于 trait 方法。

```rust

quote! {
let value = <#field_type as core::default::Default>::default();
}
```

#### 2.4.5 Interpolating text inside of doc comments 在文档注释中插入文本

文档注释和字符串文字都不会在引用中获得插值行为：

错误

```rust
quote! {
/// try to interpolate: #ident
///
/// ...
}
```

错误

```rust
quote! {
    #[doc = "try to interpolate: #ident"]
}
```

doc 属性中的宏调用不是有效的语法：

错误

```rust
quote! {
    #[doc = concat!("try to interpolate: ", stringify!(#ident))]
}
```

相反，构建涉及变量的文档注释的最佳方法是在引号之外格式化文档字符串文字.

```rust
let msg = format!(...);
quote! {
    #[doc = #msg]
    ///
    /// ...
}
```

#### 2.4.6 Indexing into a tuple struct 索引到元组结构

在插入元组或元组结构的索引时，我们需要它们不显示为整数文字的后缀，syn::Index 而是通过插入它们来代替。

```rust
//错误
let i = 0usize..self.fields.len();
// expands to 0 + self.0usize.heap_size() + self.1usize.heap_size() + ...
// which is not valid syntax
quote! {
    0 #( + self.#i.heap_size() )*
}
```

```rust
let i = (0..self.fields.len()).map(syn::Index::from);

// expands to 0 + self.0.heap_size() + self.1.heap_size() + ...
quote! {
    0 #( + self.#i.heap_size() )*
}
```

## 3. format_ident! 宏的语法

```rust
macro_rules! format_ident {
($fmt : expr) => { ... };
($fmt : expr, $($rest : tt) *) => { ... };
}
```

用于构造Idents 的格式化宏。

### 3.1 Syntax

语法从format!宏复制而来，支持位置参数和命名参数. 仅支持一组有限的格式化特征.
当前格式类型到特征的映射是：

```rust
{} ⇒ IdentFragment
{:o} ⇒ Octal
{:x} ⇒ LowerHex
{:X} ⇒ UpperHex
{:b} ⇒ Binary
```

有关 [std::fmt](https://doc.rust-lang.org/nightly/alloc/fmt/index.html) 更多信息，请参阅。

### 3.2 IdentFragment

与不同的是 `format!`，此宏 `IdentFragment` 默认使用格式化特.这个特征就像 `Display`，有一些不同：

- `IdentFragment` 仅针对一组有限的类型实现，例如无符号整数和字符串
- [Ident](https://docs.rs/proc-macro2/1.0.36/proc_macro2/struct.Ident.html) 参数将被 r# 将被trim prefix 如果存在 r#.

### 3.3 Hygiene

第一个 Ident Span 参数用作最终标识符的跨度，`Span::call_site` 当没有提供标识符时回退。

```rust
// If `ident` is an Ident, the span of `my_ident` will be inherited from it.
let my_ident = format_ident!("My{}{}", ident, "IsCool");
assert_eq!(my_ident, "MyIdentIsCool");
```

或者，可以通过传递span命名参数来覆盖跨度.

```rust
let my_span = /* ... */;
format_ident!("MyIdent", span = my_span);
```

### 3.4 Panics

如果生成的格式化字符串不是有效的标识符，则此方法将崩溃。

### 3.5 Examples

组合原始和非原始标识符：

```rust
let my_ident = format_ident!("My{}", "Ident");
assert_eq!(my_ident, "MyIdent");

let raw = format_ident!("r#Raw");
assert_eq!(raw, "r#Raw");

let my_ident_raw = format_ident!("{}Is{}", my_ident, raw);
assert_eq!(my_ident_raw, "MyIdentIsRaw");
```

整数格式化选项：

```rust
let num: u32 = 10;

let decimal = format_ident!("Id_{}", num);
assert_eq!(decimal, "Id_10");

let octal = format_ident!("Id_{:o}", num);
assert_eq!(octal, "Id_12");

let binary = format_ident!("Id_{:b}", num);
assert_eq!(binary, "Id_1010");

let lower_hex = format_ident!("Id_{:x}", num);
assert_eq!(lower_hex, "Id_a");

let upper_hex = format_ident!("Id_{:X}", num);
assert_eq!(upper_hex, "Id_A");
```

## 4.quote_spanned

```rust
macro_rules! quote_spanned {
    ($span : expr =>) => { ... };
    ($span : expr => $($tt : tt) *) => { ... };
}
```

与 相同 `quote!`，但将给定范围应用于源自宏调用的所有标记.

### 4.1 Syntax

类型为 的 span 表达式 [Span](https://docs.rs/proc-macro2/1.0/proc_macro2/struct.Span.html)，
后跟 `=>`，然后是要引用的标记.
span 表达式应该是简短的——使用一个变量来表示超过几个字符的任何内容.
`=>` 令牌前不应有空格.

```rust
let span = /* ... */;

// On one line, use parentheses. 一行
let tokens = quote_spanned!(span=> Box::into_raw(Box::new(#init)));

// On multiple lines, place the span at the top and use braces. 多行
let tokens = quote_spanned! {span=>
    Box::into_raw(Box::new(#init))
};
```

***`=>`前面没有空格***对 Rust 程序员来说应该是不和谐的，这是故意的.
由于跨度表达式是在过程宏的上下文中评估的，而剩余的标记是在生成的代码中评估的，
因此格式化被设计为明显不平衡并以特定的方式吸引眼球.

### 4.2 Hygiene

任何插值标记都会保留Span其ToTokens实现提供的信息. 源自 `quote_spanned!` 调用的标记使用给定的 span 参数进行跨越.

### 4.3 Examples

以下过程宏代码用于 `quote_spanned!` 断言特定的 Rust 类型实现了 `Sync` `trait`，以便可以在线程之间安全地共享引用.

```rust
let ty_span = ty.span();
let assert_sync = quote_spanned! {ty_span=>
    struct _AssertSync where #ty: Sync;
};
```

如果断言失败，用户将看到如下错误。他们类型的输入范围在错误中突出显示.

```rust
error[E0277]: the trait bound `*const (): std::marker::Sync` is not satisfied
--> src/main.rs:10:21
|
10 |     static ref PTR: *const () = &();
|                     ^^^^^^^^^ `*const ()` cannot be shared between threads safely
```

在此示例中，重要的是 where 子句与用户输入类型的行/列信息跨越，以便编译器适当地放置错误消息.! 宏的语法