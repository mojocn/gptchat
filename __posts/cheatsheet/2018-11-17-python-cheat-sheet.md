---
layout: post
title: Python快速入门和查询
category: CheatSheet
tags: [Python,CheatSheet,快速入门,快速查询]
description: Python语言语法快速入门和查询,小抄,快速查询册子,编程快速入门指南
keywords: python3 python 快速入门 语法快速入门 快速查询,编程快速入门指南
date: 2018-12-26T13:19:54+08:00
---

## 1. 注释

三种方式：

* 单行注释以 `#` 开头
* 多行注释用三个单引号 `'''` 将注释括起来
* 多行注释用三个双引号 `"""` 将注释括起来

示例代码如下：

    #!/usr/bin/python3

    # 这是一个注释

    '''
    这是多行注释,用三个单引号
    这是多行注释,用三个单引号
    这是多行注释,用三个单引号
    '''

    """
    这是多行注释,用三个单引号
    这是多行注释,用三个单引号 
    这是多行注释,用三个单引号
    """
    print("Hello, World!")

## 2. 运算符

与 Java 一致,除了以下特例：

* **算法运算符：**
    * `**` 幂 - 返回x的y次幂
    * `/` 除 - x 除以 y **（返回小数）** 在整数除法中,除法（`/`）总是返回一个浮点数,如果只想得到整数的结果,丢弃可能的分数部分,可以使用运算符 `//`
    * `//` 取整除 - 返回商的整数部分
* **逻辑运算符：**
    * `and` 布尔"与" - 如果 x 为 False,x and y 返回 False,否则它返回 y 的计算值
    * `or` 布尔"或" - 如果 x 是 True,它返回 x 的值,否则它返回 y 的计算值.
    * `not` 布尔"非" - 如果 x 为 True,返回 False .如果 x 为 False,它返回 True.
* **成员运算符：**
    * `in` 如果在指定的序列中找到值返回 True,否则返回 False.
    * `not in` 如果在指定的序列中没有找到值返回 True,否则返回 False.

示例代码如下：

    #!/usr/bin/python3

    x = 9
    y = 2
    print(x**y) # 81
    print(x/y) # 4.5
    print(x//y) # 4

    print(x and y) # 2
    print(x or y) # 9
    print(not x) # False

    z = [1, 2, 3]
    print(x in z) # False
    print(x not in z) # True
    print(y in z) # True

## 3. 数字 Number

**Python 支持三种不同的数值类型：**

* 整型 `int` - 通常被称为是整型或整数,是正或负整数,不带小数点.Python3 整型是没有限制大小的.
* 浮点型 `float` - 浮点型由整数部分与小数部分组成.
* 复数 `complex` - 复数由实数部分和虚数部分构成,可以用 `a + bj`,或者 `complex(a,b)` 表示.

**数字类型转换：**

* `int(x)` 将 `x` 转换为一个整数.
* `float(x)` 将 `x` 转换到一个浮点数.
* `complex(x)` 将 `x` 转换到一个复数,实数部分为 `x`,虚数部分为 0.
* `complex(x, y)` 将 `x` 和 `y` 转换到一个复数,实数部分为 `x`,虚数部分为 `y`.

示例代码如下：

    #!/usr/bin/python3
    import math
    import random

    # 16进制
    print(0xA0F) # 2575

    # 8进制
    print(0o31) # 25

    print((int)(3.1)) # 3

    print((float)(3)) # 3.0

    print(abs(-10)) # 10

    print(random.random()) # 随机生成下一个实数,它在[0,1)范围内.

    print(math.sin(0.1)) # 0.09983341664682815

    print(math.e) # 2.718281828459045

## 4. 字符串

**字符串运算符：**

* `+` 字符串连接
* `*` 重复输出字符串
* `[]` 通过索引获取字符串中字符
* `[ : ]` 截取字符串中的一部分
* `in` 如果字符串中包含给定的字符返回 True
* `not in` 如果字符串中不包含给定的字符返回 True
* `r/R` 原始字符串：所有的字符串都是直接按照字面的意思来使用,没有转义特殊或不能打印的字符
* `%` 格式字符串

python 三引号允许一个字符串跨多行,字符串中可以包含换行符,制表符以及其他特殊字符.

示例代码如下：

    #!/usr/bin/python3

    print('abc' + 'def') # abcdef

    print('abc' * 2) # abcabc

    print('abc'[1]) # b

    print('abc'[1:3]) # bc

    print('a' in 'abc') # True

    print('d' not in 'abc') # True

    print('a.') # a'
    print(r'a.') # a. 原始字符串

    print('%s: %d' % ('Age', 10)) # Age: 10

    str = """这是一个多行字符串的实例
    多行字符串可以使用制表符
    TAB ( . ).
    也可以使用换行符 [ . ].
    """
    print(str)

## 5. 列表

列表的数据项不需要具有相同的类型.  
创建一个列表,只要把逗号分隔的不同的数据项使用方括号 `[ ]` 括起来即可.

示例代码如下：

    #!/usr/bin/python3

    list1 = ['a', 'b', 1, 2]

    print(list1) # ['a', 'b', 1, 2]
    print(list1[1]) # b
    print(list1[-1]) # 2 右数第一个
    print(list1[1:3]) # ['b', 1]

    print(len(list1)) # 4 长度

    print(list1 + [3, 4]) # ['a', 'b', 1, 2, 3, 4] 组合

    print(list1 * 2) # ['a', 'b', 1, 2, 'a', 'b', 1, 2] 重复

    print('a' in list1) # True 元素是否存在于列表中

    for x in list1:
        print(x) # 迭代

    del list1[1]
    print(list1) # ['a', 1, 2]

## 6. 元组

元组与列表类似,不同之处在于元组的元素不能修改.  
元组使用小括号 `( )`,列表使用方括号.

示例代码如下：

    #!/usr/bin/python3

    tup1 = ('a', 'b', 1, 2)

    print(tup1) # ('a', 'b', 1, 2)
    print(tup1[1]) # b
    print(tup1[-1]) # 2 右数第一个
    print(tup1[1:3]) # ('b', 1)

    print(len(tup1)) # 4 长度

    print(tup1 + (3, 4)) # ('a', 'b', 1, 2, 3, 4) 组合

    print(tup1 * 2) # ('a', 'b', 1, 2, 'a', 'b', 1, 2) 重复

    print('a' in tup1) # True 元素是否存在于元祖中

    for x in tup1:
        print(x) # 迭代

## 7. 字典

字典的每个键值对用冒号 `:` 分割,每个对之间用逗号 `,` 分割,整个字典包括在花括号 `{ }` 中.

示例代码如下：

    #!/usr/bin/python3

    dic1 = {'name':'Tom', 'age':20}

    print(dic1) # {'name': 'Tom', 'age': 20}
    print(dic1['name']) # Tom

    print(len(dic1)) # 2 长度

    del dic1['name']
    print(dic1) # {'age': 20}

## 8. 条件控制

示例代码如下：

    #!/usr/bin/python3

    age = int(input("Input your age: "))

    if age < 10:
        print('< 10')
    elif age < 20:
        print('10 ~ 20')
    else:
        print('> 20')

## 9. 循环语句

示例代码如下：

    #!/usr/bin/python3

    count = 5
    while count > 0:
        print(count)
        count = count - 1

    for i in [1, 2, 3]:
        print(i)

## 10. 迭代器与生成器

迭代器对象从集合的第一个元素开始访问,直到所有的元素被访问完结束.迭代器只能往前不会后退.  
迭代器有两个基本的方法：`iter()` 和 `next()`.  
字符串,列表或元组对象都可用于创建迭代器：

示例代码如下：

    #!/usr/bin/python3

    list = [1,2,3,4]
    it = iter(list)
    print(next(it)) # 1
    print(next(it)) # 2

    for i in it:
        print(i)  # 3, 4

## 11. 函数

* 函数代码块以 `def` 关键词开头,后接函数标识符名称和圆括号 `( )`.  
  任何传入参数和自变量必须放在圆括号中间,圆括号之间可以用于定义参数.
* 函数的第一行语句可以选择性地使用文档字符串,用于存放函数说明.
* 函数内容以冒号起始,并且缩进.
* `return [表达式]` 结束函数,选择性地返回一个值给调用方.不带表达式的 `return` 相当于返回 `None`.

示例代码如下：

    #!/usr/bin/python3

    def add(x):
        return x + 10

    print(add(1)) # 11

## 12. 模块

模块是一个包含所有您定义的函数和变量的文件,其后缀名是.py.  
模块可以被别的程序引入,以使用该模块中的函数等功能.这也是使用 python 标准库的方法.

示例代码如下：  
编写文件 `myfunction.py`：

    #!/usr/bin/python3

    def add(x):
        return x + 10

引用该模块：

    #!/usr/bin/python3

    import myfunction

    print(myfunction.add(1)) # 11

## 13. 标准库概览

* 操作系统接口 `import os`
* 文件通配符 `import glob`
* 命令行参数 `import sys`
* 字符串正则匹配 `import re`
* 数学 `import math`
* 随机数 `import random`
* 访问 互联网 `from urllib.request import urlopen`
* 日期和时间 `from datetime import date`
* 数据压缩 `import zlib`
