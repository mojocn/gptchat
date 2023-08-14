---
layout: post
title: go语言chromedp使用教程
category: Golang
tags: golang chromedp Spider
date: 2018-12-26T13:19:54+08:00
description: chromedp提供一种更快,更简单的方式来驱动浏览器 (Chrome, Edge, Safari, Android等)在 Go中使用Chrome Debugging Protocol 并且没有外部依赖 (如Selenium, PhantomJS等)
keywords: chrome,chromedp,selenium,phantomjs,chrome debugging protocol, edge,safari,android
---

## chromedp版本更新Go代码失效,[新教程详解: Chromedp浏览器模拟和截图示例](/go/chromedp-example)

## 1. chromedp 是什么?

![chromedp-banner](/assets/image/chromedp_banner.jpg)

而最近广泛使用的headless browser解决方案PhantomJS已经宣布不再继续维护,转而推荐使用headless chrome.

那么headless chrome究竟是什么呢,Headless Chrome 是 Chrome 浏览器的无界面形态,可以在不打开浏览器的前提下,使用所有 Chrome 支持的特性运行您的程序.

简而言之,除了没有图形界面,headless chrome具有所有现代浏览器的特性,可以像在其他现代浏览器里一样渲染目标网页,并能进行网页截图,获取cookie,获取html等操作.

想要在golang程序里使用headless chrome,需要借助一些开源库,实现和headless chrome交互的库有很多,这里选择chromedp,接口和Selenium类似,易上手.

chromedp提供一种更快,更简单的方式来驱动浏览器 (Chrome, Edge, Safari, Android等)在 Go中使用Chrome Debugging Protocol 并且没有外部依赖 (如Selenium, PhantomJS等).

## 2. chromedp 能够做什么?

- 使用chromedp解决反爬虫JS问题
- 使用chromedp做网站的自动化测试
- [使用chromedp服务器代码渲染(主要是解决VueJS等SPA应用)](https://github.com/rendora/rendora)
- 使用chromedp做网页截图程序
- 使用chromedp做刷点击量/刷赞/搜索引擎SEO训练....(click farming)

## 3. 使用Go语言chromedp包调用chrome(headless)

使用chromedp 之前您必须有一下基础

- 少量linux(centos)基础
- 少量javascript selector/xpath 基础
- go 语言基础
- go 要熟悉go 中使用函数作为参数(闭包)的写法.
- 少量函数是编程概念(chromedp 有很多函数是编程写法)

### 3.1 安装go语言chromedp包

`go get` 命令安装chromedp `chromepd` 包

```shell
go get -u github.com/chromedp/chromedp
```

### 3.2 chromedp包使用chrome 普通模式

普通模式会在电脑上弹出浏览器窗口.调用完成之后需要关闭掉浏览器,

当然在电脑上也可以使用chrome headless 模式, 缺点就是您多次go run main.go 的时候, go 代码运行中断导致后台chrome headless不能退出,导致第二次本地调试失败,
解决方案就是自己手动结束chrome进程.

建议在不提调试go代码的时候不要使用 chrome headless 模式.
使用普通模式可以在浏览器中看到代码执行的效果.

#### 在我本机(windows10)上测试的时候chromedp 提示找不到chrome.exe

所以需要制定一下chrome.exe的执行程序地址

```go
runner.Path(`C:\Users\mojotv.cn\AppData\Local\Google\Chrome\Application\chrome.exe`),
```

#### main.go 代码

```go
package main

import (
	"context"
	"github.com/chromedp/chromedp/runner"
	"io/ioutil"
	"log"
	"time"

	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/chromedp"
)

func main() {
	var err error

	// create context
	ctxt, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 本期启动chrome的一些参数相当于执行了 shell 命令
	// C:\Users\mojotv.cn\AppData\Local\Google\Chrome\Application\chrome.exe --no-default-browser-check=true --no-sandbox=true --window-size=1280,900
	// 如果需要更多参数详解chrome浏览器参数的文档
	runnerOps := chromedp.WithRunnerOptions(
		//我的windows10电脑使用chromedp默认配置导致找不到chrome.exe
		//这行代码可以注释掉,如果找不到自己的chrome.exe 请像我一样制定chrome.exe路径
		//一下配置都不是必选的
		//更多参数详解文档 https://blog.csdn.net/wanwuguicang/article/details/79751571
		runner.Path(`C:\Users\mojotv.cn\AppData\Local\Google\Chrome\Application\chrome.exe`),
		//启动chrome的时候不检查默认浏览器
		runner.Flag("no-default-browser-check", true),
		//启动chrome 不适用沙盒, 性能优先
		runner.Flag("no-sandbox", true),
		//设置浏览器窗口尺寸,
		runner.WindowSize(1280, 1024),
		//设置浏览器的userage
		runner.UserAgent(`Mozilla/5.0 (iPhone; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1`),
	)
	//在普通模式的情况下启动chrome程序,并且建立共代码和chrome程序的之间的连接(https://127.0.0.1:9222)
	c, err := chromedp.New(ctxt, chromedp.WithLog(log.Printf), runnerOps)
	if err != nil {
		log.Fatal(err)
	}

	var siteHref, title, iFrameCode string
	err = c.Run(ctxt, visitMojoTvDotCn("https://mojotv.cn/2018/12/10/how-to-create-a-https-proxy-serice-in-100-lines-of-code.html", &siteHref, &title, &iFrameCode))
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("`%s` (%s),html:::%s", title, siteHref, iFrameCode)

	// shutdown chrome
	err = c.Shutdown(ctxt)
	if err != nil {
		log.Fatal(err)
	}

	// wait for chrome to finish
	err = c.Wait()
	if err != nil {
		log.Fatal(err)
	}
}

func visitMojoTvDotCn(url string, elementHref, pageTitle, iFrameHtml *string) chromedp.Tasks {
	//临时放图片buf
	var buf []byte
	return chromedp.Tasks{
		//跳转到页面
		chromedp.Navigate(url),
		//chromedp.Sleep(2 * time.Second),
		//等待博客正文显示
		chromedp.WaitVisible(`#post`, chromedp.ByQuery),
		//滑动页面到google adsense 广告
		chromedp.ScrollIntoView(`ins`, chromedp.ByQuery),
		chromedp.Screenshot(`#post`, &buf, chromedp.ByQuery, chromedp.NodeVisible),
		//等待2s
		chromedp.Sleep(2 * time.Second),
        //截图到文件
		chromedp.ActionFunc(func(context.Context, cdp.Executor) error {
			//保存图片到mojotv_local.png
			return ioutil.WriteFile("mojotv_local.png", buf, 0644)
		}),
		//滑动页面到#copyright
		chromedp.ScrollIntoView(`#copyright`, chromedp.ByID),
		//等待mojotv google广告展示出来
		chromedp.WaitVisible(`#post__title`, chromedp.ByID),
		chromedp.Sleep(2 * time.Second),

		//获取我的google adsense 广告代码
		chromedp.InnerHTML(`#post__title`, iFrameHtml, chromedp.ByID),
		//跳转到我的bilibili网站
		chromedp.Sleep(5 * time.Second),

		chromedp.Click("#copyright > a:nth-child(3)", chromedp.NodeVisible),
		//等待则个页面显现出来
		chromedp.WaitVisible(`#page`, chromedp.ByQuery),
		//在chrome浏览器页面里执行javascript
		chromedp.Evaluate(`document.title`, pageTitle),
		chromedp.Screenshot(`#page`, &buf, chromedp.ByQuery, chromedp.NodeVisible),
		chromedp.Sleep(5 * time.Second),

		//截取bili网页图片
		chromedp.ActionFunc(func(context.Context, cdp.Executor) error {
			return ioutil.WriteFile("bili_local.png", buf, 0644)
		}),
		//获取bilibili网页的标题
		chromedp.JavascriptAttribute(`a`, "href", elementHref, chromedp.ByQuery),
	}
}

```

#### chromedp普通模式您可以通过 `runner.Flag` 函数来定义 chrome 启动的参数

[chromedp普通chrome浏览器启动参数](参数详解文档 https://blog.csdn.net/wanwuguicang/article/details/79751571)

[headless-chrome启动详细参数参考](https://developers.google.com/web/updates/2017/04/headless-chrome)

#### chromedp截图效果

![](/assets/image/mojotv_local.png)

![](/assets/image/bili_local.png)

### 3.3 chromedp包使用chrome headless模式(不会弹出GUI界面)

#### 3.3.1 Centos7(没有图像界面) 安装chrome

##### 使用[官方Docker安装](https://github.com/chromedp/examples/tree/master/standalone)

- 下载docker image : `docker pull chromedp/headless-shell`
- 运行docker : `docker run -d -p 9222:9222 --rm --name headless-shell chromedp/headless-shell`

浏览器访问 `http://10.202.255.220:9222/json` 输出结果如下:

```json
[ {
   "description": "",
   "devtoolsFrontendUrl": "/devtools/inspector.html?ws=10.202.255.220:9222/devtools/page/EB66F54F32DE9C40D190E4B963DFBB8F",
   "id": "EB66F54F32DE9C40D190E4B963DFBB8F",
   "title": "about:blank",
   "type": "page",
   "url": "about:blank",
   "webSocketDebuggerUrl": "ws://10.202.255.220:9222/devtools/page/EB66F54F32DE9C40D190E4B963DFBB8F"
} ]
```

chrome-headless 启动成功

##### 在服务器yum安装chronium-headless

- 搜索chrome 的yum源
    ```shell
    [ericzhou@mojotv ~]$ yum search chromium
    Loaded plugins: fastestmirror, langpacks
    Loading mirror speeds from cached hostfile
    ================================================================================== N/S matched: chromium ===================================================================================
    chromium-common.x86_64 : Files needed for both the headless_shell and full Chromium
    chromium-headless.x86_64 : A minimal headless shell built from Chromium
    chromium-libs.x86_64 : Shared libraries used by chromium (and chrome-remote-desktop)
    
    ```

- 选择 `chromium-headless.x86_64`, 执行 `sudo yum install chromium-headless.x86_64`,我的服务器上已经安装好了

   ```shell
   [ericzhou@mojotv ~]$ sudo yum install chromium-headless.x86_64
   Loaded plugins: fastestmirror, langpacks
   ADDOPS-base                                                                                                                                                          | 2.9 kB  00:00:00     
   base                                                                                                                                                                 | 3.6 kB  00:00:00     
   centosplus                                                                                                                                                           | 3.4 kB  00:00:00     
   docker-ce-stable                                                                                                                                                     | 3.5 kB  00:00:00     
   epel                                                                                                                                                                 | 4.7 kB  00:00:00     
   extras                                                                                                                                                               | 3.4 kB  00:00:00     
   google-chrome                                                                                                                                                        | 1.3 kB  00:00:00     
   updates                                                                                                                                                              | 3.4 kB  00:00:00     
   google-chrome/primary                                                                                                                                                | 1.7 kB  00:00:00     
   Loading mirror speeds from cached hostfile
  ```
- 寻找chrome 二进制文件位置 `rpm -ql chromium-headless.x86_64`

    ```shell
    [ericzhou@mojotv ~]$ rpm -ql chromium-headless.x86_64
    /usr/lib64/chromium-browser/headless_shell
    ```

  我的安装可执行文件路径在 `/usr/lib64/chromium-browser/headless_shell`

- 使用非root用户运行 `chrome`

    ```shell
   [ericzhou@mojotv chromium-browser]$ nohup /usr/lib64/chromium-browser/headless_shell --no-first-run --no-default-browser-check --headless --disable-gpu --remote-debugging-port=9222 --no-sandbox --disable-plugins --remote-debugging-address=0.0.0.0 --window-size=1920,1080 &
   [1] 21747
   [ericzhou@mojotv chromium-browser]$ nohup: ignoring input and appending output to ‘/home/mojotv.cn/nohup.out’
    ```
  headless_shell(chrome) Flag 参数说明

    - `--no-first-run` 第一次不运行
    - `---default-browser-check` 不检查默认浏览器
    - `--headless` 不开启图像界面
    - `--disable-gpu` 关闭gpu,服务器一般没有显卡
    - `remote-debugging-port` chrome-debug工具的端口(golang chromepd 默认端口是9222,建议不要修改)
    - `--no-sandbox` 不开启沙盒模式可以减少对服务器的资源消耗,但是服务器安全性降低,配和参数 `--remote-debugging-address=127.0.0.1` 一起使用
    - `--disable-plugins` 关闭chrome插件
    - `--remote-debugging-address` 远程调试地址 `0.0.0.0` 可以外网调用但是安全性低,建议使用默认值 `127.0.0.1`
    - `--window-size` 窗口尺寸

  [更多参数说明详解headless-chrome官方文档](https://developers.google.com/web/updates/2017/04/headless-chrome)

- 查看端口服务器端口是否开启是否开启

    ```shell
    [ericzhou@mojotv chromium-browser]$ netstat -lntp
    (Not all processes could be identified, non-owned process info
     will not be shown, you would have to be root to see it all.)
    Active Internet connections (only servers)
    Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
    tcp        0      0 0.0.0.0:139             0.0.0.0:*               LISTEN      -                   
    tcp        0      0 0.0.0.0:111             0.0.0.0:*               LISTEN      -                   
    tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      -                   
    tcp        0      0 0.0.0.0:445             0.0.0.0:*               LISTEN      -                   
    tcp        0      0 0.0.0.0:9222            0.0.0.0:*               LISTEN      21747/headless_shel 
    ```

##### chrome-headless 9222端口效果

![chromedp](/assets/image/chromedp_port.png)

#### 3.3.2 golang代码实现chromedp 调用远程chrome-headless程序

##### 一下代码实例包含多个chromedp/example多个项目的功能

- chromedp 屏幕截图
- chromedp 和chrome浏览器分离, 远程调用
- chromedp 提取页面元素
- chromedp 执行javascript 代码
- chromedp 点击页面跳转

```go
package main

import (
	"context"

	//"fmt"
	"io/ioutil"
	"log"

	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/chromedp"
	"github.com/chromedp/chromedp/client"
)

func main() {
	var err error

	// create context
	ctxt, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 连接我远程服务器上启动和chrome-headless 服务器
	// 因为我的代码不是在我的笔记本上运行,所以不能使用client.New默认配置
	// 所以使用client.URL来自定义自己服务器地址
	c, err := chromedp.New(ctxt, chromedp.WithTargets(client.New(client.URL("http://pan.mojotv.cn:9222/json")).WatchPageTargets(ctxt)), chromedp.WithLog(log.Printf))
	if err != nil {
		log.Fatal(err)
	}

	// run task list
	var siteHref, title, iFrameCode string
	err = c.Run(ctxt, visitMojoTvDotCn("https://mojotv.cn/2018/12/10/how-to-create-a-https-proxy-serice-in-100-lines-of-code.html", &siteHref, &title, &iFrameCode))
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("`%s` (%s),html:::%s", title, siteHref, iFrameCode)
}

func visitMojoTvDotCn(url string, elementHref, pageTitle, iFrameHtml *string) chromedp.Tasks {
	//临时放图片buf
	var buf []byte
	return chromedp.Tasks{
		//跳转到页面
		chromedp.Navigate(url),
		//chromedp.Sleep(2 * time.Second),
		//等待博客正文显示
		chromedp.WaitVisible(`#post`, chromedp.ByQuery),
		//滑动页面到google adsense 广告
		chromedp.ScrollIntoView(`ins`, chromedp.ByQuery),
		chromedp.Screenshot(`#post`, &buf, chromedp.ByQuery, chromedp.NodeVisible),
		//截图到文件
		chromedp.ActionFunc(func(context.Context, cdp.Executor) error {
			return ioutil.WriteFile("mojotv.png", buf, 0644)
		}),
		//等待mojotv google广告展示出来
		chromedp.WaitVisible(`ins`, chromedp.ByQuery),
		//获取我的google adsense 广告代码
		chromedp.InnerHTML(`ins`, iFrameHtml, chromedp.ByQuery),
		//跳转到我的bilibili网站
		chromedp.Click("#copyright > a:nth-child(3)", chromedp.NodeVisible),
		//等待则个页面显现出来
		chromedp.WaitVisible(`#page-index`, chromedp.ByQuery),
		//在chrome浏览器页面里执行javascript
		chromedp.Evaluate(`document.title`, pageTitle),
		chromedp.Screenshot(`#page-index`, &buf, chromedp.ByQuery, chromedp.NodeVisible),
		//截取bili网页图片
		chromedp.ActionFunc(func(context.Context, cdp.Executor) error {
			return ioutil.WriteFile("bili.png", buf, 0644)
		}),
		//获取bilibili网页的标题
		chromedp.JavascriptAttribute(`a`, "href", elementHref, chromedp.ByQuery),
	}
}

```

##### chromedp代码和chrome-headless分离优缺点

- 优点: chrome只需要一个实例deamon运行,节省资源
- 缺点:不能在golang中创建chrome-headless 服务导致,不能控制chrome-headless的参数 浏览器的尺寸,useragent
- 缺点:服务端chrome-headless一般都缺少中文字体,需要到服务器安装字体

##### 截图效果

不能显示字体,因为我的centos7服务器没有安装中文字体导致,
[centos 安装中文字体教程](https://blog.csdn.net/wlwlwlwl015/article/details/51482065)

![](/assets/image/mojotv.png)

![](/assets/image/bili.png)

## 4. 总结

对与不习惯函数式编程的同学来说,chromedp的代码还是比较奇怪不是容易看懂, 但是如果您有耐心多点击cmd+鼠标左键还是可以看懂的,需要有耐心.
chromedp在使用selector 和执行js代码的时,如果表达式复杂就会找不到元素或者,js代码复制就会执行出错.
但是满足大部分需求是没有问题的.

## 5. 致谢

- [chromedp/chromepd](https://github.com/chromedp/chromedp)
- [headless-chrome启动详细参数参考](https://developers.google.com/web/updates/2017/04/headless-chrome)
- [chrome普通模式启动参数](https://blog.csdn.net/wanwuguicang/article/details/79751571)
- [rendora/rendora 使用chromedp来渲染单页面应用来解决SEO问题](https://github.com/rendora/rendora)
- [centos 安装中文字体](https://blog.csdn.net/wlwlwlwl015/article/details/51482065)
- [golang chrome-dp 网页截图教程](/2018/12/26/chromedp-tutorial-for-golang)
- [PHP phantomjs 网页截图教程](/2018/12/26/php-phantomjs-screen-shot)
- [golang phantomjs 网页截图教程](/2018/12/26/phantomjs-tutorial-in-golang)
- [Python Selenium Chome-driver 网页截图教程](/python/selenium-chrome-driver-docker)