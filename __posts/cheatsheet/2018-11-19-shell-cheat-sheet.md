---
layout: post
title: Shell语法快速入门
category: CheatSheet
tags: [Shell,Bash,CheatSheet,快速入门,快速查询]
description: Shell 语言语法快速入门和查询,小抄,快速查询册子, Shell 编程快速入门指南
keywords: Shell Shell 快速入门 语法快速入门 快速查询
date: 2018-12-26T13:19:54+08:00
---

## 第一个shell脚本

    #!/bin/bash
    echo "hello, world"

运行程序可以作为解释器参数或者作为可执行程序

    bash test.sh
    

    chmod +x test.sh
    test.sh

## 变量

**命名**

    name="huruji"

需要注意的是变量名与等号之间不能有空格.

#### 使用

    echo $name
    echo ${name}

使用在变量名前添加$即可,{}表示这个变量名的边界.

**只读变量**

    name="huruji"
    readonly name

使用readonly可以将变量定义为只读变量,只读变量不能再次赋值

**删除变量**

    name="huruji"
    unset name

使用unset删除变量,之后不能再使用.

## 字符串

    name="huruji"

    echo "my name is $name"

字符串可以使用单引号和双引号,单引号中不能包含单引号,即使转义单引号也不次那个,双引号则可以,双引号也可以使用字符串.

**拼接**

    name="huruji"
    hello="my name is ${name}"

**获取字符串长度**

    str="huruji"
    echo ${#str} #6

**提取子字符串**

    str="huruji"
    echo ${str:2:3}

从字符串的第二个字符开始提取3个字符,输出ruj

**查找**

    str="huruji"
    echo `expr index "$str" u`

此时输出2,因为此时第一个字符位置从1开始

## 数组

**定义**

    names=("huruji" "greywind" "xie")
    echo ${names[0]}
    echo ${names[2]}

**读取**

    echo ${names[2]}
    echo ${names[@]}

如上例子,使用@可以获取数组中的所有元素

**获取长度**

    length=${#names[@]}
    length=${#names[*]}

## Shell参数传递

执行Shell脚本的时候,可以向脚本传递参数,在Shell中获取这些参数的格式为$n,即$1,$2.......,

    echo "第一个参数是：$1"
    echo "第一个参数是：$2"
    echo "第一个参数是：$3"

运行

    chmod +x test.sh
    test.sh 12 13 14

则此时输出：

    第一个参数是：12
    第一个参数是：13
    第一个参数是：14

此外,还有其他几个特殊字符来处理参数

* $#：传递脚本的参数个数
* $*：显示所有的参数

* $@：返回所有参数
* $-：显示Shell的使用的当前选项
* $?：退出的状态,0表示没有错误,其他则表示有错误

## 运算

**算数运算** 原生bash不支持简单的数学运算,可以借助于其他命令来完成,例如awk和expr,其中expr最常用.expr是一款表达式计算工具,使用它能完成表达式的求值操作.

    val=`expr 2 + 2`
    echo $val

需要注意的是运算符两边需要空格,且使用的是反引号. 算术运算符包括：+ - × / % = == !=

**关系运算** 关系运算只支持数字,不支持字符串,除非字符串的值是数字.

    a=12
    b=13
    if [ $a -eq $b ]
    	then
    	echo "相等"
    else
    	echo "不等"
    fi

* -eq：是否相等
* -ne：是否不等
* -gt：大于
* -lt：小于
* -ge：大于等于
* -le：小于等于

**布尔运算**

* !：非
* -o：或
* -a：与

**逻辑运算符**

* &&：逻辑与
* ||：逻辑或

**字符串运算符**

* =：相等 [ ![a =](https://juejin.im/equation?tex=a%20%3D%20)b ]
* !=：不等 [ ![a !=](https://juejin.im/equation?tex=a%20!%3D%20)b ]
* -z：字符串长度是否为0,为0返回true [ -z $a ]
* -n：字符串长度是否为0,不为0返回true [ -n $a ]
* str：字符串是否为空,不为空返回true [ $a ]

**文件测试运算符** 用于检测Unix文件的各种属性.

* -b：检测文件是否为块设备文件 [ -b $file ]
* -c：检测文件是否为字符设备文件 [ -c $file ]
* -d：检测文件是否为目录 [ -d $file ]
* -f：检测文件是否为普通文件 [ -f $file ]
* -g：检测文件是否设置了SGID位 [ -g $file ]
* -k：检测文件是否设置了粘着位 [ -k $file ]
* -p：检测文件是否是有名管道 [ -p $file ]
* -u：检测文件是否设置了SUID位 [ -u $file ]
* -r：检测文件是否可读 [ -r $file ]
* -w：检测文件是否可写 [ -w $file ]
* -x：检测文件是否可执行 [ -x $file ]
* -s：检测文件大小是否大于0 [ -s $file ]
* -e：检测文件是否存在 [ -e $file ]

  file="/home/greywind/Desktop/learnShell/test.sh"

  if [ -e $file ]
  then
  echo "文件存在"
  else
  echo "文件不存在"
  fi

  if [ -r $file ]
  then
  echo "可读"
  else
  echo "不可读"
  fi

  if [ -w $file ]
  then
  echo "可写"
  else
  echo "不可写"
  fi

  if [ -x $file ]
  then
  echo "可执行"
  else
  echo "不可执行"
  fi

  if [ -d $file ]
  then
  echo "是目录"
  else
  echo "不是目录"
  fi

  if [ -f $file ]
  then
  echo "是普通文件"
  else
  echo "不是普通文件"
  fi

## echo

echo在显示输出的时候可以省略双引号,使用read命令可以从标准输入中读取一行并赋值给变量

    read name
    echo your name is $name

换行使用转义\n,不换行使用\c 此外使用 > 可以将echo结果写入指定文件,这个文件不存在会自动创建

    echo "it is a test" > "/home/greywind/Desktop/learnShell/hello"

使用反引号可以显示命令执行的结果,如date,history,pwd

    echo `pwd`
    echo `date`

## printf

Shell中的输出命令printf类似于C语言中的printf(), 语法格式：

    printf format-string [arguments...]
    

    printf "%-10s %-8s %-4s\n" 姓名 性别 体重kg  
    printf "%-10s %-8s %-4.2f\n" 郭靖 男 66.1234 
    printf "%-10s %-8s %-4.2f\n" 杨过 男 48.6543 
    printf "%-10s %-8s %-4.2f\n" 郭芙 女 47.9876 

## test

test命令用于检查某个条件是否成立,可以进行数值,字符,文件三方面的测试

    a=100
    b=200
    if test a == b
    	then
    	echo "相等"
    else
    	echo "不等"
    fi

## 流程控制

**if**

    a=100
    b=200
    if test $a -eq $b
    	then
    	echo "相等"
    else
    	echo "不等"
    fi
    

    a=100
    b=200
    if test $a -eq $b
    	then
    	echo "相等"
    elif test $a -gt $b
    	then
    	echo "a大于b"
    elif test $a -lt $b
    	then
    	echo "a小于b"
    fi

**for**

    for num in 1 2 3 4
    do
    	echo ${num}
    done
    

    num=10
    for((i=1;i<10;i++));
    do
    	((num=num+10))
    done
    echo $num

**while**

    num=1
    while [ $num -lt 100 ]
    do
    	((num++))
    done

    echo $num

**无限循环**

    while:
    do
          command
    done
    

    while true
    do
          command
    done
    

    for (( ; ; ))

**until**

    until condition
    do
          command
    done

**case**

    case 值 in
    模式1)
        command1
        command2
        ...
        commandN
        ;;
    模式2）
        command1
        command2
        ...
        commandN
        ;;
    esac

需要注意的是与其他语言不同Shell使用;;表示break,另外没有一个匹配则使用*捕获该值

    echo "输入1 2 3任意一个数字"
    read num
    case $num in
    	1)echo "输入了1"
    ;;
    	2)echo "输入了2"
    ;;
    	3)echo "输入了3"
    ;;
    	*)echo "输入的值不是1 2 3"
    ;;
    esac

与其他语言类似,循环可以使用break和continue跳出

## 函数

**函数定义** 用户自定义函数可以使用或者不使用function关键字,同时指定了return值则返回这个值,如果没有return语句则以最后一条运行结果作为返回值.

    function first(){
    	echo "hello world"
    }
    

    first(){
    	echo "hello world"
    }

调用函数直接使用这个函数名即可

    first

**函数参数**
调用函数可以传入参数,函数内部使用![n获取传入的参数,类似于运行程序使用时获取使用的参数,不过需要注意的是两位数以上应该使用{}告诉shell边界例如](https://juejin.im/equation?tex=n%E8%8E%B7%E5%8F%96%E4%BC%A0%E5%85%A5%E7%9A%84%E5%8F%82%E6%95%B0%EF%BC%8C%E7%B1%BB%E4%BC%BC%E4%BA%8E%E8%BF%90%E8%A1%8C%E7%A8%8B%E5%BA%8F%E4%BD%BF%E7%94%A8%E6%97%B6%E8%8E%B7%E5%8F%96%E4%BD%BF%E7%94%A8%E7%9A%84%E5%8F%82%E6%95%B0%EF%BC%8C%E4%B8%8D%E8%BF%87%E9%9C%80%E8%A6%81%E6%B3%A8%E6%84%8F%E7%9A%84%E6%98%AF%E4%B8%A4%E4%BD%8D%E6%95%B0%E4%BB%A5%E4%B8%8A%E5%BA%94%E8%AF%A5%E4%BD%BF%E7%94%A8%7B%7D%E5%91%8A%E8%AF%89shell%E8%BE%B9%E7%95%8C%E4%BE%8B%E5%A6%82)
{12},${20}

    function add(){
    	num=0;
    	for((i=1;i<=$#;i++));
    	do
    		num=`expr $i + $num`
    	done
    	return $num
    }
    add 1 2 3 4 5
    a=$?

    echo $a

函数本身是一个命令,所以只能通过$?来获得这个返回值

## 输入输出重定向

在上文的例子中可以使用 > 可以将echo结果写入指定文件,这就是一种输出重定向,重定向主要有以下：

* command > file：输出重定向至文件file
* command < file：输入重定向至文件file
* command >> file：输出以追加的方式重定向至文件file
* n > file：将文件描述符为n的文件重定向至文件file
* n >> file：将文件描述符为 n 的文件以追加的方式重定向到文件file
* n >& m：将输出文件 m 和 n 合并
* n <& m：将输入文件 m 和 n 合并
* << tag：将开始标记 tag 和结束标记 tag 之间的内容作为输入

将whoami命令输出保存到user文件中

    who > "./user"

使用cat命令就可以看到内容已经保存了,如果不想覆盖文件的内容那么就使用追加的方式即可.

    who >> "./user"

## Shell文件包含

Shell脚本可以包含外部脚本,可以很方便的封装一些公用的代码作为一个独立的文件,包含的语法格式如下：

    . filename
    # 或
    source filename

如: test1.sh

    echo "hello world"

test.sh

    source ./test1.sh

    echo "hello"
    
