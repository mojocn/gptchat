---
layout: post
title: toml格式配置文件详解
category: Misc
tags: toml
keywords: toml格式配置文件详解
date: 2018-12-26T13:19:54+08:00
---

> Github 目前的新项目已经转用 CoffeeScript 了.CoffeeScript 比 JavaScript 要简洁优雅得多.同样地,Github 也觉得 YAML
> 不够简洁优雅,因此捣鼓出了一个[TOML](https://github.com/toml-lang/toml).
> TOML 的全称是 Tom's Obvious, Minimal Language,因为它的作者是 Github 联合创始人 Tom Preston-Werner .

## 1. TOML 的目标

TOML 的目标是成为一个**极简的配置文件格式**.TOML 被设计成可以无歧义地被映射为哈希表,从而被多种语言解析.

## 2. 例子

```yml

[owner]
name = "Tom Preston-Werner"
organization = "Github"
bio = "Github Cofounder &amp; CEO\nLikes tater tots and beer."
dob = 1979-05-27T07:32:00Z # 日期时间是一等公民.为什么不呢？

[database]
server = "192.168.1.1"
ports = [ 8001, 8001, 8002 ]
connection_max = 5000
enabled = true

[servers]

  # 您可以依照您的意愿缩进.使用空格或Tab.TOML不会在意.
  [servers.alpha]
  ip = "10.0.0.1"
  dc = "eqdc10"

  [servers.beta]
  ip = "10.0.0.2"
  dc = "eqdc10"

[clients]
data = [ ["gamma", "delta"], [1, 2] ]
```

## 3.在数组里换行没有关系.

```yml
hosts = [
  "alpha",
  "omega"
]
```

```yml

    title = "TOML 例子"

    [owner]
    name = "Tom Preston-Werner"
    organization = "Github"
    bio = "Github Cofounder & CEO\nLikes tater tots and beer."
    dob = 1979-05-27T07:32:00Z # 日期时间是一等公民.为什么不呢？

    [database]
    server = "192.168.1.1"
    ports = [ 8001, 8001, 8002 ]
    connection_max = 5000
    enabled = true

    [servers]

      # 您可以依照您的意愿缩进.使用空格或Tab.TOML不会在意.
      [servers.alpha]
      ip = "10.0.0.1"
      dc = "eqdc10"

      [servers.beta]
      ip = "10.0.0.2"
      dc = "eqdc10"

    [clients]
    data = [ ["gamma", "delta"], [1, 2] ]

    # 在数组里换行没有关系.
    hosts = [
      "alpha",
      "omega"
    ]
```

**TOML 是大小写敏感的.**

## 4. 注释

使用 `#` 表示注释：

```yml
    # I am a comment. Hear me roar. Roar.
    key = "value" # Yeah, you can do this.
```

## 5.字符串

字符串和 JSON 的定义一致,只有一点除外： TOML 要求使用 UTF-8 编码.

注释以引号包裹,里面的字符必须是 UTF-8 格式.引号,反斜杠和控制字符（U+0000 到 U+001F）需要转义.

```yml
    "I'm a string. \"You can quote me\". Name\tJos\u00E9\nLocation\tSF."
```

常用的转义序列：

```yml
\t     - tab             (U+0009)
\n     - linefeed        (U+000A)
\f     - form feed       (U+000C)
\r     - carriage return (U+000D)
\"     - quote           (U+0022)
\/     - slash           (U+002F)
\\     - backslash       (U+005C)
\uXXXX - unicode         (U+XXXX)
```

```yml

    \b     - backspace       (U+0008)
    \t     - tab             (U+0009)
    \n     - linefeed        (U+000A)
    \f     - form feed       (U+000C)
    \r     - carriage return (U+000D)
    \"     - quote           (U+0022)
    \/     - slash           (U+002F)
    \\     - backslash       (U+005C)
    \uXXXX - unicode         (U+XXXX)
```

使用保留的特殊字符,TOML 会抛出错误.例如,在 Windows 平台上,应该使用两个反斜杠来表示路径：

```yml

    wrong = "C:\Users\nodejs\templates" # 注意：这不会生成合法的路径.
    right = "C:\\Users\\nodejs\\templates"
```

二进制数据建议使用 Base64 或其他合适的编码.具体的处理取决于特定的应用.

## 6.整数 int

整数就是一些没有小数点的数字.想用负数？按直觉来就行.整数的尺寸最小为64位.

## 7.浮点数 float

浮点数带小数点.小数点两边都有数字.64位精度.

```yml


    3.1415
    -0.01
```

## 8. 布尔值 bool

布尔值永远是小写.

```yml
    true
    false
```

## 9.日期时间 time

使用 ISO 8601 完整格式.

```yml
    1979-05-27T07:32:00Z
```

## 10.数组 array/slice

数组使用方括号包裹.空格会被忽略.元素使用逗号分隔.注意,不允许混用数据类型.

```yml

[ "red", "yellow", "green" ]
[ [ 1, 2 ], [3, 4, 5] ]
[ [ 1, 2 ], ["a", "b", "c"] ] # 这是可以的.
[ 1, 2.0 ] # 注意：这是不行的.
```

```yml

    [ 1, 2, 3 ]
    [ "red", "yellow", "green" ]
    [ [ 1, 2 ], [3, 4, 5] ]
    [ [ 1, 2 ], ["a", "b", "c"] ] # 这是可以的.
    [ 1, 2.0 ] # 注意：这是不行的.
```

数组可以多行.也就是说,除了空格之外,方括号间的换行也会被忽略.在关闭方括号前的最终项后的逗号是允许的.

## 11. 表格 table/hash/map

表格（也叫哈希表或字典）是键值对的集合.它们在方括号内,自成一行.注意和数组相区分,数组只有值.

```yml
    [table]
```

在此之下,直到下一个 table 或 EOF 之前,是这个表格的键值对.键在左,值在右,等号在中间.键以非空字符开始,以等号前的非空字符为结尾.键值对是无序的.

```yml
    [table]
    key = "value"
```

您可以随意缩进,使用 Tab 或空格.为什么要缩进呢？因为您可以嵌套表格.

嵌套表格的表格名称中使用`.`.您可以任意命名您的表格,只是不要用点,点是保留的.

```yml
    [dog.tater]
    type = "pug"
```

以上等价于如下的 JSON 结构：

```yml
    { "dog": { "tater": { "type": "pug" } } }
```

如果您不想的话,您不用声明所有的父表.TOML 知道该如何处理.

```yml
# [x.y] 不需要
# [x.y.z] 这些
[x.y.z.w] # 可以直接写
```

```yml
    # [x] 您
    # [x.y] 不需要
    # [x.y.z] 这些
    [x.y.z.w] # 可以直接写
```

空表是允许的,其中没有键值对.

只要父表没有被直接定义,而且没有定义一个特定的键,您可以继续写入：

```yml

[a]
d = 2
```

    [a.b]
    c = 1
    [a]
    d = 2

然而您不能多次定义键和表格.这么做是不合法的.

    [a]
    b = 1
    
    [a]
    c = 2


    # 别这么干！

    [a]
    b = 1

    [a]
    c = 2

```yml
    [a]
    b = 1
    
    [a.b]
    c = 2


    # 也别这个干

    [a]
    b = 1

    [a.b]
    c = 2
```

## 12. 表格数组 Table Array

最后要介绍的类型是表格数组.表格数组可以通过包裹在双方括号内的表格名来表达.使用相同的双方括号名称的表格是同一个数组的元素.表格按照书写的顺序插入.双方括号表格如果没有键值对,会被当成空表.

```yml

[[products]]

[[products]]
name = "Nail"
sku = 284758393
color = "gray"
```

```yml

    [[products]]
    name = "Hammer"
    sku = 738594937

    [[products]]

    [[products]]
    name = "Nail"
    sku = 284758393
    color = "gray"
```

等价于以下的 JSON 结构：

```yml

  "products": [
    { "name": "Hammer", "sku": 738594937 },
    { },
    { "name": "Nail", "sku": 284758393, "color": "gray" }
  ]
}
```

## 13.但是为什么要选择TOML？

因为我们需要一个像样的人类可读的格式,同时能无歧义地映射到哈希表.然后***YAML 的规范有 80 页那么长***,真是发指！不,不考虑 JSON .您知道为什么.
哈哈！想帮忙么？发合并请求过来.或者编写一个解析器.勇敢一点.

#### TOML Parser 实现

如果您有一个实现,请发一个合并请求,把您的实现加入到这个列表中.请在您的解析器的 README 中标记您的解析器支持的 提交SHA1 或 版本号.

* C#/.NET - [https://github.com/LBreedlove/Toml.net](https://github.com/LBreedlove/Toml.net)
* C#/.NET - [https://github.com/rossipedia/toml-net](https://github.com/rossipedia/toml-net)
* C#/.NET - [https://github.com/RichardVasquez/TomlDotNet](https://github.com/RichardVasquez/TomlDotNet)
* C (@ajwans) - [https://github.com/ajwans/libtoml](https://github.com/ajwans/libtoml)
* C++ (@evilncrazy) - [https://github.com/evilncrazy/ctoml](https://github.com/evilncrazy/ctoml)
* C++ (@skystrife) - [https://github.com/skystrife/cpptoml](https://github.com/skystrife/cpptoml)
* Clojure (@lantiga) - [https://github.com/lantiga/clj-toml](https://github.com/lantiga/clj-toml)
* Clojure (@manicolosi) - [https://github.com/manicolosi/clojoml](https://github.com/manicolosi/clojoml)
* CoffeeScript (@biilmann) - [https://github.com/biilmann/coffee-toml](https://github.com/biilmann/coffee-toml)
* Common Lisp (@pnathan) - [https://github.com/pnathan/pp-toml](https://github.com/pnathan/pp-toml)
* Erlang - [https://github.com/kalta/etoml.git](https://github.com/kalta/etoml.git)
* Erlang - [https://github.com/kaos/tomle](https://github.com/kaos/tomle)
* Emacs Lisp (@gongoZ) - [https://github.com/gongo/emacs-toml](https://github.com/gongo/emacs-toml)
* Go (@thompelletier) - [https://github.com/pelletier/go-toml](https://github.com/pelletier/go-toml)
* Go (@laurent22) - [https://github.com/laurent22/toml-go](https://github.com/laurent22/toml-go)
* Go w/ Reflection (@BurntSushi) - [https://github.com/BurntSushi/toml](https://github.com/BurntSushi/toml)
* Haskell (@seliopou) - [https://github.com/seliopou/toml](https://github.com/seliopou/toml)
* Haxe (@raincole) - [https://github.com/raincole/haxetoml](https://github.com/raincole/haxetoml)
* Java (@agrison) - [https://github.com/agrison/jtoml](https://github.com/agrison/jtoml)
* Java (@johnlcox) - [https://github.com/johnlcox/toml4j](https://github.com/johnlcox/toml4j)
* Java (@mwanji) - [https://github.com/mwanji/toml4j](https://github.com/mwanji/toml4j)
* Java - [https://github.com/asafh/jtoml](https://github.com/asafh/jtoml)
* Java w/ ANTLR (@MatthiasSchuetz) - [https://github.com/mschuetz/toml](https://github.com/mschuetz/toml)
* Julia (@pygy) - [https://github.com/pygy/TOML.jl](https://github.com/pygy/TOML.jl)
* Literate CoffeeScript (@JonathanAbrams) - [https://github.com/JonAbrams/tomljs](https://github.com/JonAbrams/tomljs)
* node.js - [https://github.com/aaronblohowiak/toml](https://github.com/aaronblohowiak/toml)
* node.js/browser - [https://github.com/ricardobeat/toml.js](https://github.com/ricardobeat/toml.js) (npm install tomljs)
* node.js - [https://github.com/BinaryMuse/toml-node](https://github.com/BinaryMuse/toml-node)
* node.js (@redhotvengeance) - [https://github.com/redhotvengeance/topl](https://github.com/redhotvengeance/topl) (topl npm package)
* node.js/browser (@alexanderbeletsky) - [https://github.com/alexanderbeletsky/toml-js](https://github.com/alexanderbeletsky/toml-js) (npm browser amd)
* Objective C (@mneorr) - [https://github.com/mneorr/toml-objc.git](https://github.com/mneorr/toml-objc.git)
* Objective-C (@SteveStreza) - [https://github.com/amazingsyco/TOML](https://github.com/amazingsyco/TOML)
* Ocaml (@mackwic) [https://github.com/mackwic/to.ml](https://github.com/mackwic/to.ml)
* Perl (@alexkalderimis) - [https://github.com/alexkalderimis/config-toml.pl](https://github.com/alexkalderimis/config-toml.pl)
* Perl - [https://github.com/dlc/toml](https://github.com/dlc/toml)
* PHP (@leonelquinteros) - [https://github.com/leonelquinteros/php-toml.git](https://github.com/leonelquinteros/php-toml.git)
* PHP (@jimbomoss) - [https://github.com/jamesmoss/toml](https://github.com/jamesmoss/toml)
* PHP (@coop182) - [https://github.com/coop182/toml-php](https://github.com/coop182/toml-php)
* PHP (@checkdomain) - [https://github.com/checkdomain/toml](https://github.com/checkdomain/toml)
* PHP (@zidizei) - [https://github.com/zidizei/toml-php](https://github.com/zidizei/toml-php)
* PHP (@yosymfony) - [https://github.com/yosymfony/toml](https://github.com/yosymfony/toml)
* Python (@socketubs) - [https://github.com/socketubs/pytoml](https://github.com/socketubs/pytoml)
* Python (@f03lipe) - [https://github.com/f03lipe/toml-python](https://github.com/f03lipe/toml-python)
* Python (@uiri) - [https://github.com/uiri/toml](https://github.com/uiri/toml)
* Python - [https://github.com/bryant/pytoml](https://github.com/bryant/pytoml)
* Python (@elssar) ) [https://github.com/elssar/tomlgun](https://github.com/elssar/tomlgun)
* Python (@marksteve) - [https://github.com/marksteve/toml-ply](https://github.com/marksteve/toml-ply)
* Python (@hit9) - [https://github.com/hit9/toml.py](https://github.com/hit9/toml.py)
* Ruby (@jm) - [https://github.com/jm/toml](https://github.com/jm/toml) (toml gem)
* Ruby (@eMancu) - [https://github.com/eMancu/toml-rb](https://github.com/eMancu/toml-rb) (toml-rb gem)
* Ruby (@charliesome) - [https://github.com/charliesome/toml2](https://github.com/charliesome/toml2) (toml2 gem)
* Ruby (@sandeepravi) - [https://github.com/sandeepravi/tomlp](https://github.com/sandeepravi/tomlp) (tomlp gem)
* Scala - [https://github.com/axelarge/tomelette](https://github.com/axelarge/tomelette)

## 14. TOML校验

@BurntSushi) - [https://github.com/BurntSushi/toml/tree/master/tomlv](https://github.com/BurntSushi/toml/tree/master/tomlv)

## 15.TOML 测试套件 （语言无关）

* toml-test (@BurntSushi) - [https://github.com/BurntSushi/toml-test](https://github.com/BurntSushi/toml-test)

## 16. TOML编辑器支持

* Emacs (@dryman) - [https://github.com/dryman/toml-mode.el](https://github.com/dryman/toml-mode.el)
* Sublime Text 2 & 3 (@lmno) - [https://github.com/lmno/TOML](https://github.com/lmno/TOML)
* TextMate (@infininight) - [https://github.com/textmate/toml.tmbundle](https://github.com/textmate/toml.tmbundle)
* Vim (@cespare) - [https://github.com/cespare/vim-toml](https://github.com/cespare/vim-toml)


