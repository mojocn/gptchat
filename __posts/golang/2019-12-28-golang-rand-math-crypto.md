---
layout: post
title: "Go进阶39:math/rand VS crypto/rand"
category: Golang
tags: Go进阶 
keywords: "Go语言math/rand VS crypto/rand 区别 加密安全的随机数生成器 VS 伪随机数生成器 "
description: "golang,package,cyrpto/rand 和 math.rand的区别 加密安全的随机数生成器 VS 伪随机数生成器 "
coverage: golang_random.jpg
permalink: /go/:title
date: 2019-12-28T18:11:45+08:00
---

## 1. 前言

之前发现了golang标准库中又两个rand软件包,开始非常想知道他们之间的差异.

`math/rand`软件包可以用于简单的游戏,但不能用于真正的随机性.

- `math/rand` : 伪随机数生成器
- `crypto/rand` : 加密安全的随机数生成器

Rob Pike的代码

```go
package main

import (
	"fmt"
	"math/rand"
	"time"
)

func main() {
	c := fanIn(boring("Joe"), boring("Ann"))
	for i := 0; i < 10; i++ {
		fmt.Println(<-c)
	}
	fmt.Println("You're both boring; I'm leaving.")
}

func boring(msg string) <-chan string {
	c := make(chan string)
	go func() {
		for i := 0; ; i++ {
			c <- fmt.Sprintf("%s %d", msg, i)
			time.Sleep(time.Duration(rand.Intn(1e3)) * time.Millisecond)
		}
	}()
	return c
}

// FAN IN
func fanIn(input1, input2 <-chan string) <-chan string {
	c := make(chan string)
	go func() {
		for {
			c <- <-input1
		}
	}()
	go func() {
		for {
			c <- <-input2
		}
	}()
	return c
}

```

## 2. Math/rand 伪随机数生成器

实现伪随机数生成器.

随机数由源生成.顶级函数（例如Float64和Int）使用默认的共享源,该源在每次运行程序时都会产生确定的值序列.
如果每次运行需要不同的行为,
请使用种子函数初始化默认的源.
默认的Source可安全地供多个goroutine并发使用,但不是由NewSource创建的Source.

```go
package main

import (
	"fmt"
	"math/rand"
	"time"
)
func init(){
    rand.Seed(time.Now().UTC().UnixNano())
}

func main() {

	// launches 2 generators and the fanIn collector function
	c := fanIn(genrt(), genrt())
	for i := 0; i < 10000; i++ {
		fmt.Println(<-c)
	}
}

func fanIn(a <-chan int, b <-chan int) <-chan string {
	c := make(chan string)
	// launch collector from a to channel
	go func() {
		var count int
		for {
			count += <-a
			c <- fmt.Sprintf("Tally of A is: %d", count)
		}
	}()
	// launch collector from b to channel
	go func() {
		var count int
		for {
			count += <-b
			c <- fmt.Sprintf("Tally of B is: %d", count)
		}
	}()

	return c
}

func genrt() <-chan int {
	c := make(chan int)
	// launch generator of Dice rolls
	go func() {
		for i := 0; ; i++ {
			c <- rand.Intn(6) + 1
			time.Sleep(time.Duration(500 * time.Millisecond))
		}
	}()
	return c
}


```

打印输出

```bash
...
Tally of B is: 17656
Tally of A is: 17438
Tally of A is: 17440
Tally of B is: 17659
Tally of B is: 17660
Tally of A is: 17445
```

## 3. Crypto/rand 加密安全的随机数生成器

实现了加密安全的随机数生成器.

```go
package main
import (
	"crypto/rand"
	"fmt"
	"math/big"
	"time"
)

func main() {

	// launches 2 generatores and the fanIn collector function
	c := fanIn(genrt(), genrt())
	for i := 0; i < 10000; i++ {
		fmt.Println(<-c)
	}
}

func fanIn(a <-chan int, b <-chan int) <-chan string {
	c := make(chan string)
	// launch collector from a to channel
	go func() {
		var count int
		for {
			count += <-a
			c <- fmt.Sprintf("Tally of A is: %d", count)
		}
	}()
	// launch collector from b to channel
	go func() {
		var count int
		for {
			count += <-b
			c <- fmt.Sprintf("Tally of B is: %d", count)
		}
	}()

	return c
}

func genrt() <-chan int {
	c := make(chan int)
	// launch generator of Dice rolls
	go func() {
		for i := 0; ; i++ {
			dice, err := rand.Int(rand.Reader, big.NewInt(6))
			if err != nil {
				fmt.Println(err)
			}
			c <- int(dice.Int64()) + 1
			time.Sleep(time.Duration(1 * time.Millisecond))
		}
	}()
	return c
}

```

打印输出

```bash
...
Tally of B is: 17496
Tally of A is: 17570
Tally of A is: 17574
Tally of B is: 17500
Tally of B is: 17505
Tally of A is: 17576
```