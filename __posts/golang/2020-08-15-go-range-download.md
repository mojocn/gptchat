---
layout: post
title: "Go进阶49:HTTP断点续传多线程下载原理"
category: Golang
tags: Go进阶 
keywords: "HTTP,断点续传,多线程下载,原理,golang,"
description: "怎么实现多线程下载"
coverage: http_ranges.png
permalink: /go/:title
date: 2020-08-15T10:06:00+08:00
---

## 1. HTTP断点续传多线程下载

一个比较常见的场景,就是断点续传/下载,在网络情况不好的时候,可以在断开连接以后,仅继续获取部分内容.
例如在网上下载软件,已经下载了 95% 了,此时网络断了,如果不支持范围请求,那就只有被迫重头开始下载.但是如果有范围请求的加持,就只需要下载最后 5% 的资源,避免重新下载.

另一个场景就是多线程下载,对大型文件,开启多个线程,
每个线程下载其中的某一段,最后下载完成之后,
在本地拼接成一个完整的文件,可以更有效的利用资源.

### 一图胜千言

![Golang HTTP Range Request](/assets/image/HTTP-Range-Request.png)

## 2. Range & Content-Range

HTTP1.1 协议（RFC2616）开始支持获取文件的部分内容,这为并行下载以及断点续传提供了技术支持.
它通过在 Header 里两个参数实现的,客户端发请求时对应的是 Range ,服务器端响应时对应的是 Content-Range.

```
$ curl --location --head 'https://download.jetbrains.com/go/goland-2020.2.2.exe'
date: Sat, 15 Aug 2020 02:44:09 GMT
content-type: text/html
content-length: 138
location: https://download-cf.jetbrains.com/go/goland-2020.2.2.exe
server: nginx
strict-transport-security: max-age=31536000; includeSubdomains;
x-frame-options: DENY
x-content-type-options: nosniff
x-xss-protection: 1; mode=block;
x-geocountry: United States
x-geocode: US

HTTP/1.1 200 OK
Content-Type: binary/octet-stream
Content-Length: 338589968
Connection: keep-alive
x-amz-replication-status: COMPLETED
Last-Modified: Wed, 12 Aug 2020 13:01:03 GMT
x-amz-version-id: p7a4LsL6K1MJ7UioW7HIz_..LaZptIUP
Accept-Ranges: bytes
Server: AmazonS3
Date: Fri, 14 Aug 2020 21:27:08 GMT
ETag: "1312fd0956b8cd529df1100d5e01837f-41"
X-Cache: Hit from cloudfront
Via: 1.1 8de6b68254cf659df39a819631940126.cloudfront.net (CloudFront)
X-Amz-Cf-Pop: PHX50-C1
X-Amz-Cf-Id: LF_ZIrTnDKrYwXHxaOrWQbbaL58uW9Y5n993ewQpMZih0zmYi9JdIQ==
Age: 19023

```

### Range

The Range 是一个请求首部,告知服务器返回文件的哪一部分.
在一个 Range 首部中,可以一次性请求多个部分,服务器会以 multipart 文件的形式将其返回.
如果服务器返回的是范围响应,需要使用 206 Partial Content 状态码.
假如所请求的范围不合法,那么服务器会返回 416 Range Not Satisfiable 状态码,表示客户端错误.
服务器允许忽略 Range 首部,从而返回整个文件,状态码用 200 .`Range:(unit=first byte pos)-[last byte pos]`

Range 头部的格式有以下几种情况：

```
Range: <unit>=<range-start>-
Range: <unit>=<range-start>-<range-end>
Range: <unit>=<range-start>-<range-end>, <range-start>-<range-end>
Range: <unit>=<range-start>-<range-end>, <range-start>-<range-end>, <range-start>-<range-end>
```

### Content-Range

假如在响应中存在 Accept-Ranges 首部（并且它的值不为 “none”）,那么表示该服务器支持范围请求(支持断点续传).
例如,您可以使用 cURL 发送一个 `HEAD` 请求来进行检测.`curl -I http://i.imgur.com/z4d4kWk.jpg`

```
HTTP/1.1 200 OK
...
Accept-Ranges: bytes
Content-Length: 146515
```

在上面的响应中, `Accept-Ranges: bytes` 表示界定范围的单位是 bytes .
这里  `Content-Length` 也是有效信息,因为它提供了要检索的图片的完整大小.

如果站点未发送 Accept-Ranges 首部,那么它们有可能不支持范围请求.一些站点会明确将其值设置为 "none",以此来表明不支持.在这种情况下,某些应用的下载管理器会将暂停按钮禁用.

## 3. Golang代码实现HTTP断点续传多线程下载

通过以下代码您可以了解到多线程下载的原理, 同时给您突破百度网盘下载提供思路.

```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"
)

func parseFileInfoFrom(resp *http.Response) string {
	contentDisposition := resp.Header.Get("Content-Disposition")
	if contentDisposition != "" {
		_, params, err := mime.ParseMediaType(contentDisposition)

		if err != nil {
			panic(err)
		}
		return params["filename"]
	}
	filename := filepath.Base(resp.Request.URL.Path)
	return filename
}

//FileDownloader 文件下载器
type FileDownloader struct {
	fileSize       int
	url            string
	outputFileName string
	totalPart      int //下载线程
	outputDir      string
	doneFilePart   []filePart
}

//NewFileDownloader .
func NewFileDownloader(url, outputFileName, outputDir string, totalPart int) *FileDownloader {
	if outputDir == "" {
		wd, err := os.Getwd() //获取当前工作目录
		if err != nil {
			log.Println(err)
		}
		outputDir = wd
	}
	return &FileDownloader{
		fileSize:       0,
		url:            url,
		outputFileName: outputFileName,
		outputDir:      outputDir,
		totalPart:      totalPart,
		doneFilePart:   make([]filePart, totalPart),
	}

}

//filePart 文件分片
type filePart struct {
	Index int    //文件分片的序号
	From  int    //开始byte
	To    int    //解决byte
	Data  []byte //http下载得到的文件内容
}

func main() {
	startTime := time.Now()
	var url string //下载文件的地址
	url = "https://download.jetbrains.com/go/goland-2020.2.2.dmg"
	downloader := NewFileDownloader(url, "", "", 10)
	if err := downloader.Run(); err != nil {
		// fmt.Printf("\n%s", err)
		log.Fatal(err)
	}
	fmt.Printf("\n 文件下载完成耗时: %f second\n", time.Now().Sub(startTime).Seconds())
}

//head 获取要下载的文件的基本信息(header) 使用HTTP Method Head
func (d *FileDownloader) head() (int, error) {
	r, err := d.getNewRequest("HEAD")
	if err != nil {
		return 0, err
	}
	resp, err := http.DefaultClient.Do(r)
	if err != nil {
		return 0, err
	}
	if resp.StatusCode > 299 {
		return 0, errors.New(fmt.Sprintf("Can't process, response is %v", resp.StatusCode))
	}
	//检查是否支持 断点续传
	//https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Ranges
	if resp.Header.Get("Accept-Ranges") != "bytes" {
		return 0, errors.New("服务器不支持文件断点续传")
	}

	d.outputFileName = parseFileInfoFrom(resp)
	//https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length
	return strconv.Atoi(resp.Header.Get("Content-Length"))
}

//Run 开始下载任务
func (d *FileDownloader) Run() error {
	fileTotalSize, err := d.head()
	if err != nil {
		return err
	}
	d.fileSize = fileTotalSize

	jobs := make([]filePart, d.totalPart)
	eachSize := fileTotalSize / d.totalPart

	for i := range jobs {
		jobs[i].Index = i
		if i == 0 {
			jobs[i].From = 0
		} else {
			jobs[i].From = jobs[i-1].To + 1
		}
		if i < d.totalPart-1 {
			jobs[i].To = jobs[i].From + eachSize
		} else {
			//the last filePart
			jobs[i].To = fileTotalSize - 1
		}
	}

	var wg sync.WaitGroup
	for _, j := range jobs {
		wg.Add(1)
		go func(job filePart) {
			defer wg.Done()
			err := d.downloadPart(job)
			if err != nil {
				log.Println("下载文件失败:", err, job)
			}
		}(j)

	}
	wg.Wait()
	return d.mergeFileParts()
}

//下载分片
func (d FileDownloader) downloadPart(c filePart) error {
	r, err := d.getNewRequest("GET")
	if err != nil {
		return err
	}
	log.Printf("开始[%d]下载from:%d to:%d\n", c.Index, c.From, c.To)
	r.Header.Set("Range", fmt.Sprintf("bytes=%v-%v", c.From, c.To))
	resp, err := http.DefaultClient.Do(r)
	if err != nil {
		return err
	}
	if resp.StatusCode > 299 {
		return errors.New(fmt.Sprintf("服务器错误状态码: %v", resp.StatusCode))
	}
	defer resp.Body.Close()
	bs, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if len(bs) != (c.To - c.From + 1) {
		return errors.New("下载文件分片长度错误")
	}
	c.Data = bs
	d.doneFilePart[c.Index] = c
	return nil

}

// getNewRequest 创建一个request
func (d FileDownloader) getNewRequest(method string) (*http.Request, error) {
	r, err := http.NewRequest(
		method,
		d.url,
		nil,
	)
	if err != nil {
		return nil, err
	}
	r.Header.Set("User-Agent", "mojocn")
	return r, nil
}

//mergeFileParts 合并下载的文件
func (d FileDownloader) mergeFileParts() error {
	log.Println("开始合并文件")
	path := filepath.Join(d.outputDir, d.outputFileName)
	mergedFile, err := os.Create(path)
	if err != nil {
		return err
	}
	defer mergedFile.Close()
	hash := sha256.New()
	totalSize := 0
	for _, s := range d.doneFilePart {

		mergedFile.Write(s.Data)
		hash.Write(s.Data)
		totalSize += len(s.Data)
	}
	if totalSize != d.fileSize {
		return errors.New("文件不完整")
	}
	//https://download.jetbrains.com/go/goland-2020.2.2.dmg.sha256?_ga=2.223142619.1968990594.1597453229-1195436307.1493100134
	if hex.EncodeToString(hash.Sum(nil)) != "3af4660ef22f805008e6773ac25f9edbc17c2014af18019b7374afbed63d4744" {
		return errors.New("文件损坏")
	} else {
		log.Println("文件SHA-256校验成功")
	}
	return nil

}

```

### Github Action 运行结果

[Github Action Run 日志](https://github.com/mojocn/flash/runs/987304235?check_suite_focus=true)

```bash
Run go run main.go
2020/08/15 02:15:31 开始[9]下载from:376446150 to:418273495
2020/08/15 02:15:31 开始[0]下载from:0 to:41827349
2020/08/15 02:15:31 开始[1]下载from:41827350 to:83654699
2020/08/15 02:15:31 开始[5]下载from:209136750 to:250964099
2020/08/15 02:15:31 开始[6]下载from:250964100 to:292791449
2020/08/15 02:15:31 开始[7]下载from:292791450 to:334618799
2020/08/15 02:15:31 开始[2]下载from:83654700 to:125482049
2020/08/15 02:15:31 开始[8]下载from:334618800 to:376446149
2020/08/15 02:15:31 开始[4]下载from:167309400 to:209136749
2020/08/15 02:15:31 开始[3]下载from:125482050 to:167309399
2020/08/15 02:15:36 开始合并文件
2020/08/15 02:15:38 文件SHA-256校验成功

 文件下载完成耗时: 7.169149 second
```

## 4. 附录

- [源码](https://github.com/mojocn/flash)
- [GithubAction 运行日志](https://github.com/mojocn/flash/runs/987304235?check_suite_focus=true)
- [HTTP/Headers/Range](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Range)
- [HTTP/Range_requests](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Range_requests)