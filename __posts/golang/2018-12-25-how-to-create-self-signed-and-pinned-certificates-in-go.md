---
layout: post
title: Go进阶09:使用go自己签发的TLS证书
category: Golang
tags: Go进阶
description: 在Go中生成密钥和证书非常简单明,Go Package tls部分实现了 tls 1.2的功能,可以满足我们日常的应用.Package crypto/x509提供了证书管理的相关操作.
keywords: golang,go语言,TLS证书
date: 2018-12-26T13:19:54+08:00
score: 4.9
coverage: golang_tls.png
---

## 前言

HTTPS核心的一个部分是数据传输之前的握手,握手过程中确定了数据加密的密码.
在握手过程中,网站会向浏览器发送SSL证书,SSL证书和我们日常用的身份证类似,是一个支持HTTPS网站的身份证明,SSL证书里面包含了网站的域名,证书有效期,证书的颁发机构以及用于加密传输密码的公钥等信息,由于公钥加密的密码只能被在申请证书时生成的私钥解密,因此浏览器在生成密码之前需要先核对当前访问的域名与证书上绑定的域名是否一致,同时还要对证书的颁发机构进行验证,如果验证失败浏览器会给出证书错误的提示.
在这一部分我将对SSL证书的验证过程以及个人用户在访问HTTPS网站时,对SSL证书的使用需要注意哪些安全方面的问题进行描述.

我最近需要在Go中生成一些受信任的TLS证书.接下来我介绍一下我是怎么做的

## 什么是 AWS IAM

AWS Identity and Access Management (IAM) 是一种 Web 服务,可以帮助您安全地控制对 AWS 资源的访问.
您可以使用 IAM 控制对哪个用户进行身份验证 (登录) 和授权 (具有权限) 以使用资源.

当您首次创建 AWS 账户时,最初使用的是一个对账户中所有 AWS 服务和资源有完全访问权限的单点登录身份.此身份称为 AWS 账户 根用户,使用您创建账户时所用的电子邮件地址和密码登录,即可获得该身份.强烈建议您不使用
根用户 执行日常任务,即使是管理任务.请遵守使用 根用户 的最佳实践,
仅将其用于创建您的首个 IAM 用户.然后请妥善保存 根用户 凭证,仅用它们执行少数账户和服务管理任务.

## 介绍

在工作中,我们正在做一个非常有趣的项目,它是一个暴露自己服务本地服务器,提供类似[AWS IAM元服务](https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/tutorials.html)的功能.
这个服务把我们的笔记本变成生产服务器,是登陆到Amazon服务更加简单和安全.
我更详细的介绍这个服务,但是里面的内容实在太多了.

该工具（称为ZAM）运行Web服务器,并且还具有嵌入式浏览器.
我们需要浏览器信任其嵌入式证书,否则进行正常的TLS验证.
当我第一次开始使用该工具添加功能和修复错误时,密钥和证书保存到我们的仓库,有效期是一百年.这样看起来很混乱.

我最初更新它,以便脚本每次编译就生产一个新的证书,只是这样我们就不会被迫校验存储库中的证书.
我自豪地告诉Aaron Hopkins我做的优化,并且他像往常一样说,这不够好,我们需要在每次运行应用程序时在内存中生成证书.
他给出的经验法则是我们根本不应该把证书和应用一起发布,应该让应用生成证书.

**事实证明,在Go中生成密钥和证书非常简单明了.生成证书比使用证书更令人愉快**

## Go语言代码实现

### 1.生成证书,私钥,和SPKI指纹(go中实现`openssl`的功能)

> Go Package tls部分实现了 tls 1.2的功能,可以满足我们日常的应用.Package crypto/x509提供了证书管理的相关操作.

```go
import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"math/big"
	"time"

	"github.com/pkg/errors"
)

// KeyPairWithPin 返回 PEM证书 and PEM-Key 和SKPI(PIN码)
// 公共证书的指纹
func KeyPairWithPin() ([]byte, []byte, []byte, error) {
	bits := 4096
	privateKey, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return nil, nil, nil, errors.Wrap(err, "rsa.GenerateKey")
	}

	tpl := x509.Certificate{
		SerialNumber:          big.NewInt(1),
		Subject:               pkix.Name{CommonName: "169.264.169.254"},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(2, 0, 0),
		BasicConstraintsValid: true,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
	}
	derCert, err := x509.CreateCertificate(rand.Reader, &tpl, &tpl, &privateKey.PublicKey, privateKey)
	if err != nil {
		return nil, nil, nil, errors.Wrap(err, "x509.CreateCertificate")
	}

	buf := &bytes.Buffer{}
	err = pem.Encode(buf, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: derCert,
	})
	if err != nil {
		return nil, nil, nil, errors.Wrap(err, "pem.Encode")
	}

	pemCert := buf.Bytes()

	buf = &bytes.Buffer{}
	err = pem.Encode(buf, &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	})
	if err != nil {
		return nil, nil, nil, errors.Wrap(err, "pem.Encode")
	}
	pemKey := buf.Bytes()
	// ...
```

我认为上面代码能够满足我们的需求,比大多数生成证书的命令行工具都好.

下一步是生成“PIN”,或者更具技术性来书：[SPKI指纹](https://tools.ietf.org/html/rfc7469#section-2.4).
基本大概的意思就是：“任何时候您看到使用这个公钥的证书,信任他.”
当您不想建立某种证书权限但仍想验证您的TLS通讯时,这很有用.此外,Chrome支持开箱即用.

产生PIN代码就像如下简单:

```go
	cert, err := x509.ParseCertificate(derCert)
	if err != nil {
		return nil, nil, nil, errors.Wrap(err, "x509.ParseCertificate")
	}

	pubDER, err := x509.MarshalPKIXPublicKey(cert.PublicKey.(*rsa.PublicKey))
	if err != nil {
		return nil, nil, nil, errors.Wrap(err, "x509.MarshalPKIXPublicKey")
	}
	sum := sha256.Sum256(pubDER)
	pin := make([]byte, base64.StdEncoding.EncodedLen(len(sum)))
	base64.StdEncoding.Encode(pin, sum[:])

	return pemCert, pemKey, pin, nil
}
```

### 2.配置在服务使用证书和私钥

**需要把`[]byte`证书和密钥进行转换 `tls.Certificate`类型**

本节代码提供了服务器使用证书的例子.
下面的代码是服务器的例子：

```go
package main
import (
	"bufio"
	"crypto/tls"
	"log"
	"net"
)
func main() {
	cert, err := tls.LoadX509KeyPair("server.pem", "server.key")
	if err != nil {
		log.Println(err)
		return
	}
	config := &tls.Config{Certificates: []tls.Certificate{cert}}
	ln, err := tls.Listen("tcp", ":443", config)
	if err != nil {
		log.Println(err)
		return
	}
	defer ln.Close()
	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Println(err)
			continue
		}
		go handleConn(conn)
	}
}
func handleConn(conn net.Conn) {
	defer conn.Close()
	r := bufio.NewReader(conn)
	for {
		msg, err := r.ReadString('\n')
		if err != nil {
			log.Println(err)
			return
		}
		println(msg)
		n, err := conn.Write([]byte("world\n"))
		if err != nil {
			log.Println(n, err)
			return
		}
	}
}
```

**当然您也可以把`[]byte`证书写到文件中`nginx.crt`和`nginx.key`让nginx使用**

### 3.在客户端(chrome)里面设置对SPKI指纹的证书忽略验证

在这个项目中我们内置的服务器使用[chromedp](/2018/12/11/chromedp-tutorial-for-golang.html).
使用go语言的chromedp打开chrome浏览器 设置 [chrome Flag参数 ignore-certificate-errors-spki-list](https://peter.sh/experiments/chromium-command-line-switches/)
`PIN`用法如下

```go
	cdp, err := chromedp.New(
		ctx,
		chromedp.WithRunnerOptions(
			// ...
			runner.Flag("ignore-certificate-errors-spki-list", pin),
		),
	)
```

google chrome 浏览器本身也支持Flag参数,您可以考虑将其用于集成度较低的应用程序,而您只需要安装Chrome本身.
（顺便说一下,这是一个很棒的[Chrome Flag参考文档](https://peter.sh/experiments/chromium-command-line-switches/)）
再加一个有趣的旁注,自动生成的证书在提交后的一天内就会使错误变得更加清晰.

## 总结

不知何故,有人最终同时运行了两个版本的ZAM.如果我们有旧版本,我们只是忽略了证书错误,它会以某种奇怪的方式报错.
使用当前版本,我们立即获得证书错误.在这种情况下,更清楚地详细的表述错误会更好.

在大多数情况下,我觉得让这一切运行起来非常轻松愉快.
最烦人的部分是,尽管Go是一种强类型语言,具有通常有用的类型系统,但几乎所有上面的证书类型都是`[] byte`.
密钥,证书和引脚都是`[]byte`类型.有时它们是`PEM`,有时它们是`DER`,但它们总是`[]byte`类型,这很烦人,但至少这个代码往往是相当孤立的.

有点滑稽Go 好像通过返回PEM证书具有RSA PRIVATE KEY标头的错误,来检测您是否不小心交换了密钥和证书.
如果它们是不同的类型,这马上就很明了,但是上面的逻辑是在`runtime`中执行的.

那好吧.如果您还不知道Go语言,那么一定要看[Go 语言快速入门](/2018/11/18/golang-cheat-sheet.html) [ The Go Programming Language](http://gobook.mojotv.cn/).
它不仅仅是一本伟大的Go书,而且是一本优秀的编程书,通常具有大量的并发性.
另一本要考虑学习Go的书是[Go Web 编程](https://astaxie.gitbooks.io/build-web-application-with-golang/content/zh/).
它具有几乎交互式的风格,您可以在其中编写代码,查看语法错误（或其他任何内容）,修复代码并进行迭代.
一本有用的书,表明您不必在第一次编译时完全使用所有程序.

## 参照

- [Self-Signed and Pinned Certificates in Go](https://blog.afoolishmanifesto.com/posts/golang-self-signed-and-pinned-certs/)