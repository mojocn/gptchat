---
layout: post
title: Go进阶19:如何开发多彩动感的终端UI应用
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,term,tty,pty,vt100终端,如何开发华丽的终端UI
description:  Go语言教程,Golang教程,term,tty,pty,vt100终端,如何开发华丽的终端UI
permalink: /tutorial/:title
coverage: termnial_animation.gif
date: 2019-08-27T20:45:54+08:00
---

## 1. 终端(terminal)的发展历史

终端(Terminal)是计算机系统的输入输出设备,由于历史的原因终端这个概念非常混乱,
终端的发展经历了***字符终端***,***图形终端*** 和 ***网络终端*** 三个阶段.

### 1.1 电传打字机的设备TTY(TeleTYpe)

在早期由于计算机非常昂贵,因此数十个用户共用一台主机,
为了满足多用户同时使用,最初使用一种叫电传打字机的设备,简称TTY(TeleTYpe),
通过专用线缆与中央计算机相连,
电传打字机通过键盘将电码信号发送给主机,同时接收主机程序的输出并打印在纸带上,缺点是非常浪费纸,TTY设备是现代控制台(Console)的鼻祖.

![TeleTYpe](/assets/image/TeleTYpe.jpg)

### 1.2 VT100

在20世纪70年代后期,VT100由DEC生产.本机具有单色显示屏.
我们仍然无法改变颜色,但它能够表达丰富的视觉效果,如闪烁,删除文本,并使文本变为粗体或斜体.
为特定操作定义了许多控制序列.

![vt100_machine](/assets/image/vt100_machine.jpeg)

***VT100是一个古老的终端定义,后面出现的终端几乎都兼容这种终端***.***VT100无法表达颜色,因为它嵌入了单色显示器.***
***VT100控制码***是用来在终端扩展显示的代码.
比如果终端上任意坐标用不同的颜色显示字符.***VT100控制码***有时又称为ANSI Escape Sequence.
如果感兴趣继续了解VT的发展历史请访问[vt100.net](https://vt100.net/dec/vt_history)

***VT100控制码ANSI Escape Sequence***
顾名思义,所有控制序列开始从`\x1b` 对应逃逸上ASCII码表.***今天大多数个人计算机的Telnet用户端提供最普遍的终端（一般VT100）的模拟***.
VT100无法表达颜色,因为它嵌入了单色显示器.但是不知道为什么***VT100控制码ANSI Escape Sequence***有改变颜色的控制序列的细节,
但VT241终端是高端模型嵌入彩色图形显示器.

让我们了解VT100控制码.所有的控制符是`\033`或`\e`打头（即 ESC 的 ASCII 码）用输出字符语句来输出.
可以在命令行用 echo 命令,或者在 C 程序中用 printf 来输出 VT100 的控制字符.

#### 1.2.1 VT100 控制码

```bash
\033[0m		// 关闭所有属性
\033[1m		// 设置为高亮
\033[4m		// 下划线
\033[5m		// 闪烁
\033[7m		// 反显
\033[8m		// 消隐
\033[nA		// 光标上移 n 行
\033[nB		// 光标下移 n 行
\033[nC		// 光标右移 n 行
\033[nD		// 光标左移 n 行
\033[y;xH	// 设置光标位置
\033[2J		// 清屏
\033[K		// 清除从光标到行尾的内容
\033[s		// 保存光标位置
\033[u		// 恢复光标位置
\033[?25l	// 隐藏光标
\033[?25h	// 显示光标
```

#### 1.2.2 `\033[30m – \033[37m`为设置前景色

```bash
30: 黑色
31: 红色
32: 绿色
33: 黄色
34: 蓝色
35: 紫色
36: 青色
37: 白色
```

#### 1.2.3 `\033[40m – \033[47m` 为设置背景色

````bash
40: 黑色
41: 红色
42: 绿色
43: 黄色
44: 蓝色
45: 紫色
46: 青色
47: 白色
````

[ANSI / VT100控制码文档](http://www.termsys.demon.co.uk/vtansi.htm#cursor)

### 1.3 PTY(pseudoTTY)伪终端/网络终端

在一些操作系统中,包括Unix的,一个伪终端,pseudotty,或PTY是一对伪设备,
其中,所述一个的从属,模仿硬件文本终端装置,其中,所述其它的主,提供了这样的装置终端仿真器进程控制从站.
终端仿真器进程还必须处理终端控制命令,例如,用于调整屏幕的大小.
广泛使用的终端仿真程序包括xterm,GNOME终端,Konsole和终端.
远程登录处理程序（如ssh和telnet服务器）扮演相同的角色,但与远程用户而不是本地用户进行通信.
还要考虑诸如期望之类的程序.

![pseudo_ssh](/assets/image/pseudo_ssh.jpg)

## 2. Go语言终端colorful-text

打印色彩文字示例

```go
package main
import "fmt"
func main() {
   fmt.Print("\x1b[4;30;46m")//设置颜色样式
   fmt.Print("Hello World")//打印文本内容
   fmt.Println("\x1b[0m")//样式结束符,清楚之前的显示属性
}
```

运行效果

![](/assets/image/vt100_term_demo.png)

源代码解析,请关注第4行,这是VT100控制码改变颜色.`\x1b[4;30;46m`由3部分组成.

- `\x1b[` ：控制序列导入器
- `4;30;46`：由分号分隔的参数.4表示下划线,30表示设置前景色黑色,46表示设置背景颜色青色.
- `m` ：最后一个字符（总是一个字符）.

打印Hello World后, print`\x1b[0m`包含`0`用来表示清除显示属性.

开源库[fatih/color](https://github.com/fatih/color/blob/master/color.go)的原理就是使用golang `print`
VT100控制码(ANSI Escape Sequence)标记文本内容,色彩丰富的终端文本

## 3. Go语言终端进度条progress

显示进度条的代码的原理:

1. 终端需要擦除终端,
2. 打印进度条,
3. 并移动光标位置

```go
package main

import (
	"fmt"
	"strings"
	"time"
)

func renderbar(count, total int) {
	barwidth := 30
	done := int(float64(barwidth) * float64(count) / float64(total))

	fmt.Printf("Progress: \x1b[33m%3d%%\x1b[0m ", count*100/total)
	fmt.Printf("[%s%s]",
		strings.Repeat("=", done),
		strings.Repeat("-", barwidth-done))
}

func main() {
	total := 50
	for i := 1; i <= total; i++ {
		//<ESC>表示ASCII“转义”字符,0x1B
		fmt.Print("\x1b7")   // 保存光标位置 保存光标和Attrs <ESC> 7
		fmt.Print("\x1b[2k") // 清空当前行的内容 擦除线<ESC> [2K
		renderbar(i, total)
		time.Sleep(50 * time.Millisecond)
		fmt.Print("\x1b8") // 恢复光标位置 恢复光标和Attrs <ESC> 8
	}
	fmt.Println()
}
```

这部分代码缺陷就是`barwidth`这个值是固定的,但实际中这个变量因该跟随终端的宽度来确定.

## 4. 关于终端仿真器的窗口大小

我们可以更改窗口大小,因为我们使用pty(终端模拟器),
而不是终端机器.在本节中,让我们了解如何获得终端仿真器的大小.
要获得窗口大小,您需要`syscall.SYS_IOCTL`使用`TIOCGWINSZ `以下调用.

```go
type winsize struct {
   Row uint16
   Col uint16
   X  uint16
   Y uint16
}

func getWinSize(fd int) (row, col uint16, err error) {
   var ws *winsize
   retCode, _, errno := syscall.Syscall(
      syscall.SYS_IOCTL, uintptr(fd),
      uintptr(syscall.TIOCGWINSZ),
      uintptr(unsafe.Pointer(ws)))
   if int(retCode) == -1 {
      panic(errno)
   }
   return ws.Row, ws.Col, nil
}
```

但从易用性和简单出发,最好直接调用`unix.IoctlGetWinsize`, ***注意GetWinsizeAPi在windows上不好使***

```go
package main

import (
	"fmt"
	"strings"
	"syscall"
	"time"

	"golang.org/x/sys/unix"
)

var wscol = 30

func init() {
	ws, err := unix.IoctlGetWinsize(syscall.Stdout, unix.TIOCGWINSZ)
	if err != nil {
		panic(err)
	}
	wscol = int(ws.Col)
}

func renderbar(count, total int) {
	barwidth := wscol - len("Progress: 100% []")
	done := int(float64(barwidth) * float64(count) / float64(total))

	fmt.Printf("Progress: \x1b[33m%3d%%\x1b[0m ", count*100/total)
	fmt.Printf("[%s%s]",
		strings.Repeat("=", done),
		strings.Repeat("-", barwidth-done))
}

func main() {
	total := 50
	for i := 1; i <= total; i++ {
		fmt.Print("\x1b7")   // save the cursor position
		fmt.Print("\x1b[2k") // erase the current line
		renderbar(i, total)
		time.Sleep(50 * time.Millisecond)
		fmt.Print("\x1b8") // restore the cursor position
	}
	fmt.Println()
}
```

不仅要了解如何获取窗口大小,还需要知道如何接收事件,通知事件窗口大小更改.

这里以macOS/unix系统为例,
您可以从`UNIX OS`信号接收通知.您只需处理`SIGWINCH os`信号,如下所示.

```go
package main

import (
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"golang.org/x/sys/unix"
)

var (
	total = 50
	count = 0
	wscol = 20
)

func init() {
	err := updateWSCol()
	if err != nil {
		panic(err)
	}
}

func updateWSCol() error {
	ws, err := unix.IoctlGetWinsize(syscall.Stdout, unix.TIOCGWINSZ)
	if err != nil {
		return err
	}
	wscol = int(ws.Col)
	return nil
}

func renderbar() {
	fmt.Print("\x1b7")       // 保存光标位置
	fmt.Print("\x1b[2k")     // 清除当前行内容
	defer fmt.Print("\x1b8") // 恢复光标位置

	barwidth := wscol - len("Progress: 100% []")
	done := int(float64(barwidth) * float64(count) / float64(total))

	fmt.Printf("Progress: \x1b[33m%3d%%\x1b[0m ", count*100/total)
	fmt.Printf("[%s%s]",
		strings.Repeat("=", done),
		strings.Repeat("-", barwidth-done))
}

func main() {
	// set signal handler
	sigwinch := make(chan os.Signal, 1)
	defer close(sigwinch)
	signal.Notify(sigwinch, syscall.SIGWINCH)
	go func() {
		for {
			if _, ok := <-sigwinch; !ok {
				return
			}
			_ = updateWSCol()
			renderbar()
		}
	}()

	for count = 1; count <= 50; count++ {
		renderbar()
		time.Sleep(time.Second)
	}
	fmt.Println()
}
```

![](/assets/image/termnial_animation.gif)

通过调用`ioctl`与`TIOCGWINSZ`当您收到`SIGWINCH` signal,您可以得到窗口的大小.您可以从此信息控制终端UI.
但是很难正确擦除屏幕.
实际上,如果在此代码中使终端窗口变小,则输出将崩溃.最简单的方法是每次都擦除整个屏幕.

## 结束语

思维扩展:根据 `ANSI / VT100终端控制码` 文档结合python/bash/go/java/c/php等语言的`print`函数您可以开发出自己的富文本终端UI app.

参考文档

- [VT100发展史](https://vt100.net/dec/vt_history)
- [ANSI/VT100终端控制码](http://www.termsys.demon.co.uk/vtansi.htm#cursor)
- [ANSI/VT100控制码go语言实现:GitHub开源库fatih/color](https://github.com/fatih/color/blob/master/color.go)
- [终端GUI高级示例:https://github.com/jroimartin/gocui](https://github.com/jroimartin/gocui)