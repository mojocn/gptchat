---
layout: post
title: "Go进阶34:Chromedp浏览器模拟和截图微服务"
category: Golang
tags: Go进阶 
keywords: Go语言教程,Golang教程,Chromedp浏览器模拟和截图示例,微服务,docker
description: "chromedp提供一种更快,更简单的方式来驱动浏览器 (Chrome, Edge, Safari, Android等)在 Go中使用Chrome Debugging Protocol 并且没有外部依赖"
coverage: chromedp_banner.jpg
permalink: /go/:title
date: 2019-10-21T15:07:45+08:00
---

## 1. chromedp 是什么?

而最近广泛使用的headless browser解决方案PhantomJS已经宣布不再继续维护,转而推荐使用headless chrome.

那么headless chrome究竟是什么呢,Headless Chrome 是 Chrome 浏览器的无界面形态,可以在不打开浏览器的前提下,使用所有 Chrome 支持的特性运行您的程序.

简而言之,除了没有图形界面,headless chrome具有所有现代浏览器的特性,可以像在其他现代浏览器里一样渲染目标网页,并能进行网页截图,获取cookie,获取html等操作.

想要在golang程序里使用headless chrome,需要借助一些开源库,实现和headless chrome交互的库有很多,这里选择chromedp,接口和Selenium类似,易上手.

chromedp提供一种更快,更简单的方式来驱动浏览器 (Chrome, Edge, Safari, Android等)在 Go中使用Chrome Debugging Protocol 并且没有外部依赖 (如Selenium, PhantomJS等).

golang里驱动headless chrome有着开源库chromedp(在2017年的gopher大会上有展示过),它是使用Chrome Debugging Protocol(简称cdp) 并且没有外部依赖 (如Selenium, PhantomJS等).
浏览器本身其实还充当着一个服务端的角色,大家应该都用过chrome浏览器的F12,也就是devtools,
其实这是一个web应用,当您使用devtools的时候,而您看到的浏览器调试工具界面,其实只是一个前端应用,在这中间通信的,就是cdp,他是基于websocket的,一个让devtools和浏览器内核交换数据的通道.cdp的官方文档地址 https://chromedevtools.github.io/devtools-protocol/
可以点击查阅.

## 2. Golang + chromedp + docker 微服务示例

完整Golang 代码 [https://github.com/mojocn/chromegin](https://github.com/mojocn/chromegin)
Gin handler 代码 [https://github.com/mojocn/chromegin/blob/master/handler.go]()

```go
package main

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"github.com/chromedp/cdproto/emulation"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"github.com/chromedp/chromedp/device"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"math"
	"net/url"
	"os"
	"path"
	"strings"
	"time"
)

func handleError(c *gin.Context, err error) bool {
	if err != nil {
		//logrus.WithError(err).Error("gin context http handler error")
		c.JSON(200, gin.H{"msg": err.Error()})
		return true
	}
	return false
}
func md5Encode(data string) string {
	h := md5.New()
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}
func ChromedpShot(c *gin.Context) {
	var err error
	u := c.Query("u")
	//url decode 参数
	u, err = url.QueryUnescape(u)
	if handleError(c, err) {
		return
	}
	if !strings.HasPrefix(u, "http") {
		c.JSON(200, gin.H{"msg": u + " 地址无效"})
		return
	}

	timeString := c.Query("c")
	timeString, err = url.QueryUnescape(timeString)
	if handleError(c, err) {
		return
	}
	t, err := time.Parse("2006-01-02 15:04:05", timeString)
	if handleError(c, err) {
		return
	}
	fileName := fmt.Sprintf("%s_%s.png", t.Format("060102T150405"), md5Encode(u))
	//imagePath := path.Join(os.TempDir(), fileName)
	imagePath := path.Join("/data", fileName)
	if _, err := os.Stat(imagePath); os.IsExist(err) {
		//如果图片存在就直接gin response 图片
		c.File(imagePath)
		return
	}

	if err := runChromedp(u, imagePath); err != nil {
		log.WithField("URL", u).WithField("C", timeString).WithError(err)
		c.JSON(200, gin.H{"msg": err.Error()})
		return
	}
	c.File(imagePath)
}

func runChromedp(targetUrl, imagePath string) error {
	// create context
	// timeout 90 秒
	timeContext, cancelFunc := context.WithTimeout(context.Background(), time.Second*90)
	defer cancelFunc()

	ctx, cancel := chromedp.NewContext(timeContext)
	defer cancel()

	// capture screenshot of an element
	var buf []byte
	// capture entire browser viewport, returning png with quality=90
	if err := chromedp.Run(ctx, fullScreenshot(targetUrl, 50, &buf)); err != nil {
		return err
	}
	log.Println(imagePath)
	return ioutil.WriteFile(imagePath, buf, 0644)
}

func fullScreenshot(urlstr string, quality int64, res *[]byte) chromedp.Tasks {
	return chromedp.Tasks{
		chromedp.Emulate(device.IPad),
		chromedp.EmulateViewport(1024, 2048, chromedp.EmulateScale(2)),
		chromedp.Navigate(urlstr),
		chromedp.ActionFunc(func(ctx context.Context) error {
			// get layout metrics
			_, _, contentSize, err := page.GetLayoutMetrics().Do(ctx)
			if err != nil {
				return err
			}

			width, height := int64(math.Ceil(contentSize.Width)), int64(math.Ceil(contentSize.Height))

			// force viewport emulation
			err = emulation.SetDeviceMetricsOverride(width, height, 1, false).
				WithScreenOrientation(&emulation.ScreenOrientation{
					Type:  emulation.OrientationTypePortraitPrimary,
					Angle: 0,
				}).
				Do(ctx)
			if err != nil {
				return err
			}
			// capture screenshot
			*res, err = page.CaptureScreenshot().
				WithQuality(quality).
				WithClip(&page.Viewport{
					X:      contentSize.X,
					Y:      contentSize.Y,
					Width:  contentSize.Width,
					Height: contentSize.Height,
					Scale:  1,
				}).Do(ctx)
			if err != nil {
				return err
			}
			return nil
		}),
	}
}
```

### 2.1 Dockerfile功能说明

1. 安装中文字体
2. 安装linux chrome浏览器
3. 安装golang 环境
3. chromedp + gin RESTful API 业务代码编译和运行

```dockerfile
FROM centos:7.6.1810

# 安装中文字体和chrome
RUN yum install -y wget && \
    yum install -y wqy-microhei-fonts wqy-zenhei-fonts && \
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm && \
    yum install -y ./google-chrome-stable_current_*.rpm && \
    google-chrome --version && \
    rm -rf *.rpm

# 设置go mod proxy 国内代理
# 设置golang path
ENV GOPROXY=https://goproxy.io GOPATH=/gopath PATH="${PATH}:/usr/local/go/bin"
# 定义使用的Golang 版本
ARG GO_VERSION=1.13.3

# 安装 golang 1.13.3
RUN wget "https://dl.google.com/go/go$GO_VERSION.linux-amd64.tar.gz" && \
    rm -rf /usr/local/go && \
    tar -C /usr/local -xzf "go$GO_VERSION.linux-amd64.tar.gz" && \
    rm -rf *.tar.gz && \
    go version && go env;


WORKDIR $GOPATH
COPY . chromegin

RUN cd chromegin && go build -o app;

EXPOSE 6666

# 保存图片网页图片截图
VOLUME /data

CMD ["chromegin/app"]
```

### 2.2 Docker 编译和运行

```bash
git clone https://github.com/mojocn/chromegin.git && cd chromegin
# 编译build image 名称位chromegin  docker run 挂在host主机/data/chrome_screen_shot 目录保存图片
docker build -t chromegin . && docker run -p 6666:6666 -v /data/chrome_screen_shot:/data --name chromegin chromegin 
```

从dockerhub上pull
`docker pull mojotvcn/chromegin`

### 2.3 Chromedp RESTful API 接口说明

| 表头     | 表头                                       |
|--------|------------------------------------------|
| Method | GET                                      |
| URL    | 127.0.0.1:6666/python/ss                 |
| URL    | 127.0.0.1:6666/open/chromedp/screen/shot |
| u      | url-encode 之后的截图网址                       |
| c      | url-encode 时间 格式 `2018-09-09 12:12:12`   |

## 3. Golang Chromedp用法示例

### 3.1 模拟浏览器点击

```go
package main

import (
	"context"
	"log"
	"time"
	"github.com/chromedp/chromedp"
)

func main() {
	// 创建chromedp 
	ctx, cancel := chromedp.NewContext(
		context.Background(),
		chromedp.WithLogf(log.Printf),
	)
	defer cancel()

	// 设置timeout
	ctx, cancel = context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	// navigate to a page, wait for an element, click
	var example string
	err := chromedp.Run(ctx,
		chromedp.Navigate(`https://mojotv.cn/go/golang-flat-app-structure`),
		// 等等 footer可见
		chromedp.WaitVisible(`p.copyright`),
		// 点击微博分享按钮
		chromedp.Click(`div.article-share > a.fa.fa-weibo`, chromedp.NodeVisible),
		// 获取textarea
		chromedp.Value(`#app > div.main > div > section > div > textarea`, &example),
	)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("评论框的内容:\n%s", example)
}
```

### 3.2 模拟浏览器表单文件上传

```go
// Command upload is a chromedp example demonstrating how to upload a file on a
// form.
package main

import (
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/chromedp/chromedp"
)

var (
	flagPort = flag.Int("port", 8544, "port")
)

func main() {
	flag.Parse()

	// 获取公众目录 work directory
	wd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	filepath := wd + "/main.go"

	// 获取文件信息
	fi, err := os.Stat(filepath)
	if err != nil {
		log.Fatal(err)
	}

	// 启动上传服务器和html表单服务
	result := make(chan int, 1)
	go uploadServer(fmt.Sprintf(":%d", *flagPort), result)

	// 创建context
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// chromedp 运行 action
	var sz string
	err = chromedp.Run(ctx, upload(filepath, &sz))
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("原始 size: %d, 上传 size: %d", fi.Size(), <-result)
}
//chromedp 上传action
func upload(filepath string, sz *string) chromedp.Tasks {
	return chromedp.Tasks{
		chromedp.Navigate(fmt.Sprintf("http://localhost:%d", *flagPort)),
		chromedp.SendKeys(`input[name="upload"]`, filepath, chromedp.NodeVisible),
		chromedp.Click(`input[name="submit"]`),
		chromedp.Text(`#result`, sz, chromedp.ByID, chromedp.NodeVisible),
	}
}
//golang 启动http 服务
func uploadServer(addr string, result chan int) error {
	// create http server and result channel
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		fmt.Fprintf(res, uploadHTML)
	})
	mux.HandleFunc("/upload", func(res http.ResponseWriter, req *http.Request) {
		f, _, err := req.FormFile("upload")
		if err != nil {
			http.Error(res, err.Error(), http.StatusBadRequest)
			return
		}
		defer f.Close()

		buf, err := ioutil.ReadAll(f)
		if err != nil {
			http.Error(res, err.Error(), http.StatusBadRequest)
			return
		}

		fmt.Fprintf(res, resultHTML, len(buf))

		result <- len(buf)
	})
	return http.ListenAndServe(addr, mux)
}
//网站html 模板
const (
	uploadHTML = `<!doctype html>
<html>
<body>
  <form method="POST" action="/upload" enctype="multipart/form-data">
    <input name="upload" type="file"/>
    <input name="submit" type="submit"/>
  </form>
</body>
</html>`

	resultHTML = `<!doctype html>
<html>
<body>
  <div id="result">%d</div>
</body>
</html>`
)
```

### 3.3 实现浏览器图片截图

```go
package main

import (
	"context"
	"io/ioutil"
	"log"
	"math"

	"github.com/chromedp/cdproto/emulation"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

func main() {
	// 创建 context
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// 截取图片by 元素
	var buf []byte
	if err := chromedp.Run(ctx, elementScreenshot(`https://mojotv.cn/go/hardware-footprint-gui-proxy`, `article`, &buf)); err != nil {
		log.Fatal(err)
	}
	if err := ioutil.WriteFile("mojotv_article.png", buf, 0644); err != nil {
		log.Fatal(err)
	}

	// 截取全屏图片质量90%
	if err := chromedp.Run(ctx, fullScreenshot(`https://mojotv.cn/python/selenium-chrome-driver-docker`, 90, &buf)); err != nil {
		log.Fatal(err)
	}
	if err := ioutil.WriteFile("mojotv_full_screen_shot.png", buf, 0644); err != nil {
		log.Fatal(err)
	}
}

// 截取元素 图片
func elementScreenshot(urlstr, sel string, res *[]byte) chromedp.Tasks {
	return chromedp.Tasks{
		chromedp.Navigate(urlstr),
		chromedp.WaitVisible(sel, chromedp.ByID),
		chromedp.Screenshot(sel, res, chromedp.NodeVisible, chromedp.ByID),
	}
}

// 截取全部的viewport
// 注意会重新 viewport emulation 配置.
func fullScreenshot(urlstr string, quality int64, res *[]byte) chromedp.Tasks {
	return chromedp.Tasks{
		chromedp.Navigate(urlstr),
		chromedp.ActionFunc(func(ctx context.Context) error {
			// get layout metrics
			_, _, contentSize, err := page.GetLayoutMetrics().Do(ctx)
			if err != nil {
				return err
			}

			width, height := int64(math.Ceil(contentSize.Width)), int64(math.Ceil(contentSize.Height))

			// force viewport emulation
			err = emulation.SetDeviceMetricsOverride(width, height, 1, false).
				WithScreenOrientation(&emulation.ScreenOrientation{
					Type:  emulation.OrientationTypePortraitPrimary,
					Angle: 0,
				}).
				Do(ctx)
			if err != nil {
				return err
			}

			// capture screenshot
			*res, err = page.CaptureScreenshot().
				WithQuality(quality).
				WithClip(&page.Viewport{
					X:      contentSize.X,
					Y:      contentSize.Y,
					Width:  contentSize.Width,
					Height: contentSize.Height,
					Scale:  1,
				}).Do(ctx)
			if err != nil {
				return err
			}
			return nil
		}),
	}
}
```

### 3.4 模拟浏览器cookie

```go
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
)

var (
	flagPort = flag.Int("port", 8544, "port")
)

func main() {
	flag.Parse()

	// 启动 cookie http 服务
	go cookieServer(fmt.Sprintf(":%d", *flagPort))

	// 创建 context
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// 运行chromedp actions
	var res string
	err := chromedp.Run(ctx, setcookies(
		fmt.Sprintf("http://localhost:%d", *flagPort), &res,
		"cookie1", "value1",
		"cookie2", "value2",
	))
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("chrome received cookies: %s", res)
}

// 一个简单http服务 打印和接受cookie
func cookieServer(addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		cookies := req.Cookies()
		for i, cookie := range cookies {
			log.Printf("from %s, server received cookie %d: %v", req.RemoteAddr, i, cookie)
		}
		buf, err := json.MarshalIndent(req.Cookies(), "", "  ")
		if err != nil {
			http.Error(res, err.Error(), http.StatusInternalServerError)
			return
		}
		fmt.Fprintf(res, indexHTML, string(buf))
	})
	return http.ListenAndServe(addr, mux)
}

// setcookies 返回 a task([]action) 到指定页面带上cookie
func setcookies(host string, res *string, cookies ...string) chromedp.Tasks {
	if len(cookies)%2 != 0 {
		panic("length of cookies must be divisible by 2")
	}
	return chromedp.Tasks{
		chromedp.ActionFunc(func(ctx context.Context) error {
			// 创建 cookie 过期时间
			expr := cdp.TimeSinceEpoch(time.Now().Add(180 * 24 * time.Hour))
			// 添加cookie 到chromedp
			for i := 0; i < len(cookies); i += 2 {
				success, err := network.SetCookie(cookies[i], cookies[i+1]).
					WithExpires(&expr).
					WithDomain("localhost").
					WithHTTPOnly(true).
					Do(ctx)
				if err != nil {
					return err
				}
				if !success {
					return fmt.Errorf("could not set cookie %q to %q", cookies[i], cookies[i+1])
				}
			}
			return nil
		}),
		// 到网址
		chromedp.Navigate(host),
		// 读取元素文本
		chromedp.Text(`#result`, res, chromedp.ByID, chromedp.NodeVisible),
		// 读取网络值
		chromedp.ActionFunc(func(ctx context.Context) error {
			cookies, err := network.GetAllCookies().Do(ctx)
			if err != nil {
				return err
			}

			for i, cookie := range cookies {
				log.Printf("chrome cookie %d: %+v", i, cookie)
			}

			return nil
		}),
	}
}

const (
	indexHTML = `<!doctype html>
<html>
<body>
  <div id="result">%s</div>
</body>
</html>`
)
```

## 4. linux 安装chrome

### debian/ubuntu 安装chrome

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install
```

### centos 安装chrome

```bash
yum install -y google-chrome-stable_current_x86_64.rpm
#安装glib2
yum update glib2 -y 

#卸载Google浏览器
# yum autoremove -y google-chrome
```

## 5. 安装中文字体

```bash
## ubunt
apt-get -y install xfonts-wqy ttf-wqy-microhei

# centos
 yum -y install wqy-microhei-fonts wqy-zenhei-fonts
 ```

### 5.1 centos安装chrome-head-less 脚本

1. 安装浏览器 `sudo yum install chromium-headless.x86_64`
2. 安装中文字体  `yum -y install wqy-microhei-fonts wqy-zenhei-fonts`
3. 安装superivisor
3. supervisor 管理启动chrome-head-less
4. supervisor 配置文件, 添加专属chrome-headless Linux运行用户`sudo useradd chromeless`,提供给supervisor 配置文件 `user = chromeless`
   superivosr配置文件:   `/etc/supervisord.d/chromeless.ini`

```shell
[program: chromeless] 
command = /usr/lib64/chromium-browser/headless_shell --no-first-run --no-default-browser-check --headless --disable-gpu --remote-debugging-port=9222 --no-sandbox --disable-plugins --remote-debugging-address=0.0.0.0 
autostart = true     
startsecs = 5       
autorestart = true 
startretries = 3  
user = chromeless
redirect_stderr = true  
stdout_logfile_maxbytes = 50MB 
stdout_logfile_backups = 20  
```

5. 验证chromeless-api是否开启 `curl 127.0.0.1:9222/json`

## 6. 总结

- [历史版本chromedp教程(代码已经过时)](/2018/12/26/chromedp-tutorial-for-golang)
- [Chromedp-Golang-Docker 项目代码](https://github.com/mojocn/chromegin)
- [Chromedp-Golang DockerHub镜像Image](https://cloud.docker.com/u/mojotvcn/repository/docker/mojotvcn/chromegin)