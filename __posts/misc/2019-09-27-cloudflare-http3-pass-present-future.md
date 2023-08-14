---
layout: post
title: "MISC:HTTP3过去现在和未来"
category: Misc
tags: HTTP3
keywords: HTTP3,QUIC,HTTP3的进化史
description: "Web的新标准QUIC和HTTP3,让我们快速回顾一下HTTP多年来的发展,以便更好地理解为什么需要HTTP3"
coverage: http3_c.png
permalink: /:title
date: 2019-09-27T18:44:54+08:00
---

在去年的HTTP3"生日周"期间,我们Cloudflare宣布了对Web的新标准QUIC和HTTP3(或当时称为"HTTP over QUIC")的初步支持,从而可以更快,
更可靠,更安全地connect到网站和API.我们还让客户加入wait list,只要相关应用开发完成他们可用后立即尝试QUIC和HTTP3.

![](/assets/image/http3_01.png)

从那时起,我们一直与业界同行合作通过[Internet Engineering Task Force](https://ietf.org/)(IETF.org包括Google Chrome和Mozilla Firefox),
以迭代HTTP3和QUIC标准文档.
在标准日趋成熟的同时,我们还致力于改善对网络的支持.

现在,我们很高兴地宣布, Cloudflare Edge Network上已提供QUIC和HTTP3支持.
我们很高兴能与Google Chrome和Mozilla Firefox(两家领先的浏览器供应商和合作伙伴)一起加入此公告,以努力使所有人的网络速度更快,更可靠.

用Google的高级软件工程师Ryan Hamilton的话来说,
"HTTP3应该使每个人的网络变得更好.
Chrome和Cloudflare团队密切合作,将HTTP3和QUIC从新生标准引入到广泛采用的技术来改进Web.
行业领导者之间的强大合作伙伴关系使互联网标准创新成为可能,我们期待我们继续合作."

这对使用Cloudflare的客户,使用了我们的服务和Edge Network使他们的Web更快更安全,来对与客户说这意味着什么?

在Cloudflare仪表板中为您的域名启用 HTTP3支持后,客户便可以使用HTTP3与您的网站和API进行交互.
我们一直在稳定地邀请我们的HTTP3等待列表中的客户,启用该功能(请注意我们发来的邀请电子邮件),并且在接下来的几周内,我们将向所有人提供该功能.

如果您是互联网用户,并且通过浏览器和其他客户端与站点和API进行交互,那么此公告意味着什么?
从今天开始,您可以使用Chrome Canary通过HTTP3与Cloudflare和其他服务器进行交互.
对于那些正在寻找命令行客户端的人,curl还提供了对HTTP3的支持.
本文后面的内容将介绍如何在Chrome和curl中使用HTTP3.

## 1. 先有鸡还是先有蛋的问题

一直以来,由于先有鸡还是现有蛋的问题,Internet上的标准创新一直很困难：
***首先需要Server提供商(例如Cloudflare或其他云服务商)还是Client支持(例如浏览器,操作系统等)?
连接的两端都需要支持新的通信协议,这样它才可以使用.***

Cloudflare推动Web标准发展的历史由来已久,从HTTP3(HTTP3之前的HTTP版本)到TLS 1.3,再到加密SNI之类的东西.
我们与志同道合的组织合作,从而推动了标准的发展,这些组织有着共同的愿望,即帮助我们建立更好的互联网.
我们将HTTP3纳入主流的努力没有什么不同.

在整个HTTP3标准开发过程中,我们一直与行业合作伙伴紧密合作,以建立和验证与我们的Edge Network兼容和支持HTTP3 Client.
我们很高兴能与Google Chrome和curl结合使用,今天它们都可以用于通过HTTP3向Cloudflare Edge Network发出请求.
Mozilla Firefox预计也将在晚些时候发布的版本中提供支持.

总的来说：2019-09-26对于互联网用户来说是美好的一天;HTTP3的广泛推广将为所有人带来更快的Web体验,而今天的支持是朝着这一方向迈出的一大步.

更重要的是,2019-09-26对Internet来说是美好的一天：Chrome,curl和Cloudflare,很快,Mozilla迅速推出了实验性但实用的对HTTP3的支持,
表明Internet标准创建过程可以正常工作.
在Internet Task Force (ietf.org/)的协调下,行业合作伙伴,竞争对手和其他主要利益相关者可以齐心协力制定使整个Internet受益的标准,而不仅仅只有大公司收益.

Firefox的CTO Eric Rescorla很好地总结了这一点："开发新的网络协议很困难,要正确实现它就需要每个人共同努力.在过去的几年中,我们一直与Cloudflare和其他行业合作伙伴一起测试TLS
1.3,现在测试HTTP3和QUIC.
Cloudflare对这些协议的早期服务器端支持已帮助我们解决了客户端Firefox实施中的互操作性问题.我们期待着共同提高互联网的安全性和性能."

![](/assets/image/http3_02.png)

## 2. HTTP3进化史

在深入探究HTTP3之前,让我们快速回顾一下HTTP多年来的发展,以便更好地理解为什么需要HTTP3.

### 2.1 HTTP1.0

这一切始于1996年HTTP1.0规范的发布,该规范定义了我们今天所知道的基本HTTP文本传输格式(我假装HTTP0.9不存在).
在HTTP1.0中,将为客户端和服务器之间的每个请求/响应交换创建一个新的TCP连接,这意味着所有TCP/TLS握手均在每个请求之前完成,因此所有请求都会产生延迟.如下图所示.

![](/assets/image/http3_03.png)

### 2.2 HTTP1.1引入keep alive 解决http1.0 Slow Start问题

更糟糕的是,TCP建立了称为"慢启动Slow Start"的预热时间,"慢启动Slow Start"
使TCP拥塞控制算法可以确定可以传输的数据量,而不是在建立连接后尽快发送所有未完成的数据.在网络路径上发生拥塞之前的任何给定时刻,并避免将无法处理的数据包泛洪到网络中.但是由于新连接必须经过缓慢的启动过程,因此它们无法立即使用所有可用的网络带宽.

几年后,HTTP规范的HTTP1.1修订版试图通过引入"保持连接keep-alive"的概念来解决这些问题,该概念允许客户端重用TCP连接,
从而分摊了初始连接建立和缓慢连接的成本.
面对多个请求Request,但这不是灵丹妙药：
尽管多个请求可以共享同一个连接,但是仍然必须一个接一个地序列化它们,因此客户端和服务器只能在任意给定时间为每个连接执行一次Request/Response传输.

随着网络的发展,随着多年来每个网站所需资源(CSS,JavaScript,图像等)的增加,浏览器在获取和呈现网页时需要越来越多的并发性.
但是,由于HTTP1.1只允许客户端一次进行一次HTTP请求/响应传输,因此在网络层上获得并发性的唯一方法是并行使用多个TCP连接到同一源,
从而失去了大多数Keep alive的好处.尽管连接仍会在一定程度上(但较小程度)被重用,但我们还是回到了HTTP1.0那个局面.
![HTTP 1.1](/assets/image/http3_04.png)

### 2.3 HTTP2 引入SPDY解决TCP复用问题

最终,十多年后,出现了SPDY,然后是HTTP2,它首先引入了HTTP"流streams"的概念：
一种抽象,允许HTTP实现将不同的HTTP交换并发地复用到同一TCP连接上,浏览器以更有效地重用TCP连接.

![HTTP 2](/assets/image/http3_05.png)

再一次,SPDY/HTTP2这又不是灵丹妙药！HTTP2解决了最初的问题-单个TCP连接的使用效率低-因为现在可以通过同一连接同时传输多个请求/响应.
但是,即使丢失的数据仅涉及单个请求,所有请求和响应也同样会受到数据包丢失的影响(例如,由于网络拥塞).
这是因为尽管HTTP2层可以在不同的流上隔离不同的HTTP交换,但是TCP不了解这种抽象,并且TCP所看到的只是字节流,没有特殊含义.

TCP的作用是以正确的顺序从一个端点到另一端点传递整个字节流(stream).
当承载某些字节的TCP数据包在网络路径上丢失时,它将在流中造成间隙,并且TCP需要在检测到丢失时通过重新发送受影响的数据包来填充它.
这样做时,即使丢失的字节本身并没有丢失并且属于完全独立的HTTP请求,也不能将丢失的字节之后的已成功交付的字节都传递到应用程序.
因此,它们最终会不必要地延迟,因为TCP无法知道应用程序是否能够在没有丢失字节的情况下对其进行处理.此问题称为"首行阻塞head-of-line blocking".

### 2.4 引入HTTP3和QUIC

这就是HTTP3发挥作用的地方：它不是使用TCP作为会话的传输层,而是使用QUIC(一种新的Internet传输协议),
QUIC协议引入了传输层将流(stream)作为一流公民.
QUIC流共享相同的QUIC连接,因此不需要额外的握手和慢启动来创建新的QUIC流,但是QUIC流是独立交付的,因此在大多数情况下,影响一个流的丢包不会影响其他流.
这是可能的,因为QUIC数据包封装在UDP数据报的顶部.

与TCP相比,使用UDP可以提供更大的灵活性,并且可以使QUIC实现完全依赖于客户这边(客户端),与TCP一样,协议实现的更新不依赖于操作系统更新.
借助QUIC,可以将HTTP级别的流简单地映射到QUIC流的顶部,从而获得HTTP2的所有好处,而消除"首行阻塞head-of-line blocking".

QUIC还将典型的3次TCP握手与TLS 1.3的握手相结合.
组合这些步骤意味着默认情况下提供加密和身份验证,并且还可以更快地建立连接.
换句话说,即使对于HTTP会话中的初始请求需要新的QUIC连接,在数据开始流动之前所引起的等待时间也比具有TLS的TCP的等待时间低.

![](/assets/image/http3_06.png)

### 2.5 为什么不在QUIC上使用HTTP2

但是,为什么不只在QUIC上使用HTTP2,而不是创建一个全新的HTTP版本呢?
毕竟HTTP2还提供了流多路复用功能.事实证明,在QUIC上使用HTTP2要复杂得多.

确实可以轻松地将某些HTTP2功能映射到QUIC上,但并非所有功能都适用.
特别是一种[HTTP2的标头压缩方案HPACK](https://blog.cloudflare.com/hpack-the-silent-killer-feature-of-http-2/),
在很大程度上取决于将不同的HTTP请求和响应传递到端点的顺序.
QUIC强制执行单个流中字节的传递顺序,但不保证不同流之间的顺序.

此行为需要创建一个称为QPACK的新HTTP标头压缩方案,该方案可以解决问题,但需要更改HTTP映射.
另外,QUIC本身已经提供了HTTP2提供的某些功能(例如每流流控制),因此从HTTP3中删除了这些功能是为了消除协议中不必要的复杂性.

## 3. HTTP3由QUIC(quiche QUIC 美味的蛋饼)驱动

QUIC和HTTP3是非常令人兴奋的标准,有望解决以前标准的许多缺点,并开创了网络性能的新纪元.
那么,我们如何从令人兴奋的标准文档过渡到可行的实施?

Cloudflare的QUIC和HTTP3支持由quiche([我们自己的用Rust编写的开源实现)提供支持](https://blog.cloudflare.com/enjoy-a-slice-of-quic-and-rust/)).

![quiche QUIC](/assets/image/http3_07.png)

您可以在GitHub上找到它,网址为[github.com/cloudflare/quiche](https://github.com/cloudflare/quiche).

我们在几个月前发布了quiche,此后在现有QUIC支持的基础上增加了对HTTP3协议的支持.
我们已经开发设计了quiche,现在可以将其用于实现HTTP3客户端和服务器或仅用于普通QUIC的服务器.

### 3.1 如何为Cloudflare的域名启用HTTP3?

如上所述,我们已经开始为注册等待名单的客户提供服务.
如果您在候补名单上,并且已经收到我们的来信,通知您现在可以为您的网站启用该功能,则只需转到Cloudflare仪表板,然后手动从"网络"选项卡切换此开关：

![cloudflare http3 dashboard](/assets/image/http3_08.png)

我们希望在不久的将来向所有客户提供HTTP3功能.启用后,您可以通过多种方式尝试HTTP3：

### 3.2 使用Google Chrome作为HTTP3客户端

为了使用Chrome浏览器通过HTTP3连接到您的网站,您首先需要下载并安装最新的Canary版本.
然后,启用HTTP3支持所需要做的就是使用"--enable-quic"和"--quic-version = h3-23" 命令行参数启动Chrome Canary.

使用必需的参数启动Chrome后,您只需在地址栏中输入您的域名,然后查看它是否已通过HTTP3加载（您可以使用Chrome开发人员工具中的“网络"标签来检查使用的协议版本）.
请注意,由于浏览器和服务器之间协商HTTP3的机制,因此HTTP3可能不会在前几个域名连接使用,因此您应该尝试重新加载页面几次.

如果这看起来太复杂,请放心,因为随着时间的流逝,Chrome对HTTP3的支持将变得更加稳定,启用HTTP3将变得更加容易.

这是通过HTTP3浏览此博客时,开发人员工具中的“网络"选项卡显示的内容：

![chrome http3 browser](/assets/image/http3_09.png)

请注意,由于Chrome对HTTP3支持的实验性质,该协议在开发人员工具中实际上被标识为"http2 + quic / 99",但是请不要误以为它确实是HTTP3.

### 3.3 使用curl

curl命令行工具还支持HTTP3作为实验功能.您需要从git下载最新版本,并按照有关如何启用HTTP3支持的说明进行操作.

如果您运行的是macOS,我们还可以通过Homebrew轻松安装带有HTTP3的curl版本：

` brew install --HEAD -s https://raw.githubusercontent.com/cloudflare/homebrew-cloudflare/master/curl.rb`

为了执行HTTP3请求,您所需要做的就是将"--http3"命令行标志添加到普通curl命令中：

```
./curl -I https://blog.cloudflare.com/ --http3
HTTP/3 200
date: Tue, 17 Sep 2019 12:27:07 GMT
content-type: text/html; charset=utf-8
set-cookie: __cfduid=d3fc7b95edd40bc69c7d894d296564df31568723227; expires=Wed, 16-Sep-20 12:27:07 GMT; path=/; domain=.blog.cloudflare.com; HttpOnly; Secure
x-powered-by: Express
cache-control: public, max-age=60
vary: Accept-Encoding
cf-cache-status: HIT
age: 57
expires: Tue, 17 Sep 2019 12:28:07 GMT
alt-svc: h3-23=":443"; ma=86400
expect-ct: max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"
server: cloudflare
cf-ray: 517b128df871bfe3-MAN
```

### 3.4 使用quiche的http3-client

最后,我们还提供了一个基于乳蛋饼构建的示例HTTP3命令行客户端（以及命令行服务器）,您可以使用它来试用HTTP3.

为了使其运行,首先克隆乳蛋饼的GitHub存储库：

`$ git clone --recursive https://github.com/cloudflare/quiche`

然后建立它.您需要一个可运行的Rust和Cargo安装程序才能工作（我们建议使用rustup轻松设置一个有效的Rust开发环境）.

`$ cargo build --examples`

最后,您可以执行一个HTTP3请求：

`$ RUST_LOG=info target/debug/examples/http3-client https://blog.cloudflare.com/`

## 4. 下一步是什么?

在接下来的几个月中,我们将致力于改进和优化QUIC和HTTP3程序,最终将使每个人都能够启用此新功能,而无需等待列表.
随着标准的发展,我们将继续更新程序,这可能会导致标准草案版本之间的变更中断.

以下是我们路线图上一些令我们特别兴奋的功能：

### 4.1 connection迁移

QUIC启用的一项重要功能是在不同网络（例如您早上上班时在家中的WiFi网络和运营商的移动网络）之间进行无缝,透明的连接迁移,而无需创建全新的连接.

![](/assets/image/http3_10.png)

此功能将需要对我们的基础架构进行一些其他更改,但是我们很高兴将来能够为我们的客户提供服务.

### 4.2 零往返时间恢复

与TLS 1.3一样,QUIC支持一种操作模式,该模式允许客户端在连接握手完成之前开始发送HTTP请求.
我们尚未在QUIC部署中支持此功能,但我们将努力使其可用,就像我们已经为TLS 1.3支持所做的那样.

## 5. HTTP3 上线了

我们很高兴能够支持HTTP3,并允许我们的客户在仍致力于标准化QUIC和HTTP3的同时进行尝试.
我们将继续与其他组织（包括Google和Mozilla）合作,以最终确定QUIC和HTTP3标准并鼓励广泛采用.
这是为所有人提供更快,更可靠,更安全的Web体验.

## 6. 参考资料

- [翻译原文地址](https://blog.cloudflare.com/http3-the-past-present-and-future/)
- [Internet Task Force](https://ietf.org/)
- [Wikipedia HTTP 3](https://en.wikipedia.org/wiki/HTTP/3)
- [QUIC Library Is Now Open-Source](https://blog.litespeedtech.com/2019/09/11/litespeed-quic-http3-open-source/)
- [github.com/cloudflare/quiche](https://github.com/cloudflare/quiche)