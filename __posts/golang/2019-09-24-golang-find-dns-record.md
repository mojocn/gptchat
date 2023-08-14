---
layout: post
title: Go进阶30:Golang获取域名/IP/DNS信息
category: Golang
tags: Go进阶
keywords: Go语言教程,Golang教程,Go代码,域名Domain,DNS记录信息
description:  Go语言教程,Go代码查找域名Domain的DNS记录信息,DNS记录是映射文件,这些文件与DNS服务器关联,每个域与哪个IP地址关联,它们处理发送到每个域的请求.net包包含各种方法来查找DNS记录的技术细节
coverage: golang_dns_works.png
permalink: /2018/12/26/golang-find-dns-record
date: 2019-09-24T11:22:54+08:00
---

## 1. DNS是什么?

DNS （Domain Name System 的缩写）的作用非常简单,就是根据域名查出IP地址.
域名系统（通常被称为“DNS”）是一个网络系统,允许我们把对人类友好的名称解析为唯一的地址.
Internet 上的所有计算机,从您的智能手机或笔记本电脑到可提供大量零售网站内容的服务器,均通过使用编号寻找另一方并相互通信.
这些编号称为 IP 地址.当您打开 Web 浏览器并前往一个网站时,您不必记住和输入长编号.
而是输入域名 (入 example.com),然后在正确的IP地址获取数据.
您可以把它想象成一本巨大的电话本.下面图片将展示DNS的工作原理.

![DNS工作原理图](/assets/image/dns_works.jpg)

## 2. Go语言查找DNS A记录

A (Address) 记录是用来指定主机名（或域名）对应的IP地址记录.
用户可以将该域名下的网站服务器指向到自己的web server上.
同时也可以设置您域名的二级域名.

使用 Go 语言的标准库 `net.LookupIP()` 接受域名的字符串参数,返回 `net.IP`的切片. 这个 `net.IP` 对象包含IPv4地址和IPv6地址.

```go
package main
 
import (
	"fmt"
	"net"
)
 
func main() {
	iprecords, _ := net.LookupIP("mojotv.cn")
	for _, ip := range iprecords {
		fmt.Println(ip)
	}
}
```

上面代码返回的facebook域名的IPv4和IPv6地址:

```go
C:\golang\mojotv.cn>go run golang_dns_example.go
2a03:2880:f12f:83:face:b00c:0:25de
31.13.79.35
```

## 3. Go语言查找DNS CNAME记录

CNAME(缩写canonical name)记录,即：别名记录.这种记录允许您将多个名字映射到同一台计算机.
通常用于同时提供WWW和MAIL服务的计算机.例如,有一台计算机名为“host.mydomain.com”（A记录）.
它同时提供WWW和MAIL服务,为了便于用户访问服务.可以为该计算机设置两个别名（CNAME）：WWW和MAIL.

使用Go语言标准库`net.LookupCNAME()`根据域名字符串查询DNS CNAME 记录值.

```go
package main
 
import (
	"fmt"
	"net"
)
 
func main() {
	cname, _ := net.LookupCNAME("m.facebook.com")
	fmt.Println(cname)
}
```

返回m.facebook.com 的 DNS CNAME 记录值出输结果如下:

```go
C:\golang\mojotv.cn>go run dns_cname_example.go
star-mini.c10r.facebook.com.
```

## 4. Go语言查找DNS PTR记录

PTR记录,是电子邮件系统中的邮件交换记录的一种;另一种邮件交换记录是A记录（在IPv4协议中）或AAAA记录（在IPv6协议中）.PTR记录常被用于反向地址解析.
根据一个IP值,查找映射的域名值,不一定没有ip地址都回生效,DNS的IP地址可以查到.

DNS PTR用途

- PTR记录被用于电子邮件发送过程中的反向地址解析.
- 当正向域名解析完成后,还应当向您的线路接入商（ISP）申请做反向地址解析,以减少被国外机构退信的可能性.

使用Go语言标准库`net.LookupAddr()`函数对地址执行反向查找,并返回映射到给定地址的名称列表.

```go
package main
 
import (
	"fmt"
	"net"
)
 
func main() {
	ptr, err := net.LookupAddr("114.114.114.114")
		if err != nil {
    		fmt.Println(err)
    	}
	for _, ptrvalue := range ptr {
		fmt.Println(ptrvalue)
	}
}
```

查找dns的返回值如下

```
C:\golang\dns>go run example3.go
public1.114dns.com.
```

## 5. Go语言查找DNS NS记录

***NS记录此记录指定负责此DNS区域的权威名称服务器***.
A记录和NS记录的区别是,A记录直接给出目的IP,
NS记录将DNS解析任务交给特定的服务器,
NS记录中记录的IP即为该特定服务器的IP地址.

使用Go语言标准库`net.LookupNS()`函数对域名执行反向查找,并返回负责此域名DNS-NS记录切片.

```go
package main
 
import (
	"fmt"
	"net"
)
 
func main() {
	nameserver, _ := net.LookupNS("baidu.com")
	for _, ns := range nameserver {
		fmt.Println(ns)
	}
}
```

结果如下

```shell
C:\golang\mojotv.cn>go run dsn_ns_example.go
&{ns3.baidu.com.}
&{ns4.baidu.com.}
&{ns7.baidu.com.}
&{dns.baidu.com.}
&{ns2.baidu.com.}
```

## 6. Go语言查找DNS MX记录

邮件交换记录 (MX record)是域名系统（DNS）中的一种资源记录类型,用于指定负责处理发往收件人域名的邮件服务器.
MX记录允许设置一个优先级,当多个邮件服务器可用时,会根据该值决定投递邮件的服务器.简单邮件传输协议（SMTP）会根据MX记录的值来决定邮件的路由过程.

使用Go语言标准库 `net.LookupMX` 函数将域名作为字符串,并返回按首选项排序的MX 结构体的切片. MX结构由主机作为string组成,Pref是uint16.

```go
package main
 
import (
	"fmt"
	"net"
)
 
func main() {
	mxrecords, _ := net.LookupMX("baidu.com")
	for _, mx := range mxrecords {
		fmt.Println(mx.Host, mx.Pref)
	}
}
```

域名（baidu.com）的输出列表MX记录

```shell
C:\golang\mojotv.cn>go run golang_dns_mx_example.go
mx.maillb.baidu.com. 10
mx.n.shifen.com. 15
mx1.baidu.com. 20
jpmx.baidu.com. 20
mx50.baidu.com. 20

```

## 7. Go语言查找DNS SRV记录

SRV记录（英語：Service Record,中文又名服务定位记录）是域名系统中用于指定服务器提供服务的位置（如主机名和端口）数据.此数据于RFC 2782中定义,类型代码为33.
部分协议,如会话发起协议（SIP）及可扩展消息与存在协议（XMPP）通常需要服务记录的支持.

Go语言标准库`LookupSRV`函数尝试指定服务的SRV查询,协议和域名的SRV查询. 第二个参数是“tcp”或“udp”. 返回的记录按优先级排序,并按优先级在权重随机分配.

```go
package main
 
import (
	"fmt"
	"net"
)
 
func main() {
	cname, srvs, err := net.LookupSRV("xmpp-server", "tcp", "golang.org")
	if err != nil {
		panic(err)
	}
 
	fmt.Printf("\ncname: %s \n\n", cname)
 
	for _, srv := range srvs {
		fmt.Printf("%v:%v:%d:%d\n", srv.Target, srv.Port, srv.Priority, srv.Weight)
	}
}
```

下面的输出演示了CNAME返回,后跟SRV记录目标,端口,优先级和由冒号分隔的权重.

```
C:\golang\mojotv.cn>go run golang_dns_srv_example.go
cname: _xmpp-server._tcp.golang.org.
```

## 8. Go语言查找DNS TXT记录

TXT记录用来保存域名的附加文本信息,TXT记录的内容按照一定的格式编写,最常用的是SPF格式,SPF用于登记某个域名拥有的用来外发邮件的所有ip地址.
MX记录的作用是给寄信者指明某个域名的邮件服务器有哪些,SPF格式的TXT记录的作用跟MX记录相反,它向收信者表明,哪些邮件服务器是经过某个域名认可发送邮件的.
SPF的作用主要是反垃圾邮件,主要针对那些发信人伪造域名的垃圾邮件.按照SPF格式在DNS中增加一条TXT类型的记录,将提高该域名的信誉度,同时可以防止垃圾邮件伪造该域的发件人发送垃圾邮件.

Go语言标准库 `net.LookupTXT` 函数将域名（baidu.com）作为字符串,并返回DNS TXT记录列表作为字符串片段.

```go
package main
 
import (
	"fmt"
	"net"
)
 
func main() {
	txtrecords, _ := net.LookupTXT("baidu.com")
 
	for _, txt := range txtrecords {
		fmt.Println(txt)
	}
}
```

baidu.com的txt值如下

```
C:\golang\mojotv>go run golang_dns_txt.go
v=spf1 include:spf1.baidu.com include:spf2.baidu.com include:spf3.baidu.com a mx ptr -all
google-site-verification=GHb98-6msqyx_qqjGl5eRatD3QTHyVB6-xQ3gJB5UwM
```